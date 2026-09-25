import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { 
  GroqBatchEvaluationResponseSchema, 
  GroqEvaluationItemSchema,
  evaluateEligibility,
  calculatePanelEligibilityStats,
  PANEL_CONSTANTS
} from '@droptest/shared';
import { initDatabase, closeDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';
import { GroqEvaluator } from '../src/simulation/groqEvaluator.js';
import { generatePanelProfiles } from '../src/simulation/profileGenerator.js';

describe('Phase 3: Groq Evaluator, Gating & Incomplete Run Recovery Tests', () => {
  before(() => {
    initDatabase(':memory:');
  });

  after(() => {
    closeDatabase();
  });

  it('validates Groq structured batch response schema and rejects invalid response enum', () => {
    const validBatch = {
      evaluations: [
        {
          profile_id: 'prof_01',
          response: 'interested',
          reason: 'Fits daily office wear use case and within $50 budget limit.',
          primary_objection: null,
          factor_tags: ['fit', 'price'],
          referenced_fields: ['use_case', 'price', 'budget_max']
        },
        {
          profile_id: 'prof_02',
          response: 'unsure',
          reason: 'Appeals to style but price is near the upper budget limit.',
          primary_objection: 'Higher price point for daily staple',
          factor_tags: ['price'],
          referenced_fields: ['price', 'budget_max']
        }
      ]
    };

    const parsed = GroqBatchEvaluationResponseSchema.safeParse(validBatch);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.evaluations.length, 2);
      assert.strictEqual(parsed.data.evaluations[0].profile_id, 'prof_01');
      assert.strictEqual(parsed.data.evaluations[0].response, 'interested');
    }

    // Invalid response enum (e.g. 'maybe')
    const invalidBatch = {
      evaluations: [
        {
          profile_id: 'prof_03',
          response: 'maybe', // INVALID enum
          reason: 'Might buy it',
          factor_tags: ['price'],
          referenced_fields: ['price']
        }
      ]
    };

    const invalidParse = GroqBatchEvaluationResponseSchema.safeParse(invalidBatch);
    assert.strictEqual(invalidParse.success, false);
  });

  it('reports explicit configuration state and smoke test failure when GROQ_API_KEY is not configured', async () => {
    const isConfigured = GroqEvaluator.isConfigured();
    // In automated test environment without .env GROQ_API_KEY, isConfigured should be false
    if (!process.env.GROQ_API_KEY) {
      assert.strictEqual(isConfigured, false);
      const smokeResult = await GroqEvaluator.smokeTest();
      assert.strictEqual(smokeResult.success, false);
      assert.ok(smokeResult.error?.includes('GROQ_API_KEY is not configured'));
    }
  });

  it('determines unserved profiles with deterministic unavailable records without model calls', () => {
    const profiles = generatePanelProfiles({
      testId: 'test_gating',
      domainId: 'local_food_beverages',
      intendedBuyerDescription: 'Afternoon cold brew drinkers',
      adjacentBuyerDescription: 'Weekend brunch hosts',
      expectedSpendMin: 5,
      expectedSpendMax: 12,
      audienceMarkets: ['Downtown', 'Suburbs'],
      seed: 888
    });

    const optionA = {
      name: 'Downtown Pickup Only',
      price: 6.00,
      primary_message: 'Fresh pickup in Downtown',
      served_markets: ['Downtown'],
      fulfillment_mode: 'Pickup'
    };

    const statsA = calculatePanelEligibilityStats(profiles, optionA);
    assert.strictEqual(statsA.total, 50);
    assert.ok(statsA.unserved_count > 0);

    // Filter unserved profiles
    const unserved = profiles.filter(p => p.market === 'Suburbs');
    for (const p of unserved) {
      const elig = evaluateEligibility(p, optionA);
      assert.strictEqual(elig.is_eligible, false);
      assert.strictEqual(elig.access_status, 'unserved');
      assert.strictEqual(elig.response_if_unserved, 'unavailable');
      assert.ok(elig.reason_if_unserved?.includes('is outside "Downtown Pickup Only" served markets'));
    }
  });

  it('handles partial run states and accurately tracks missing evaluations without panel alteration', () => {
    // 1. Create test draft
    const testDraft = TestRepository.saveDraft({
      test: {
        title: 'Linen Shirt Launch',
        domain_id: 'clothing_accessories'
      },
      offering: {
        short_value_prop: 'Organic Linen Workwear',
        description: 'Breathable workwear for hot climates.',
        currency: 'USD',
        period: 'launch_batch'
      },
      option_a: {
        name: 'Standard $45',
        price: 45,
        primary_message: 'Essential comfort',
        served_markets: ['San Francisco', 'Austin'],
        fulfillment_mode: 'Standard shipping'
      },
      option_b: {
        name: 'Premium $65',
        price: 65,
        primary_message: 'Luxury craft with gift box',
        served_markets: ['San Francisco'],
        fulfillment_mode: 'Standard shipping'
      },
      audience_config: {
        intended_buyer_description: 'Office workers wanting natural linen',
        adjacent_buyer_description: 'Holiday gift buyers',
        expected_spend_min: 35,
        expected_spend_max: 80,
        audience_markets: ['San Francisco', 'Austin']
      },
      comparison_lever: 'price'
    });

    const testId = testDraft.test.id;

    // 2. Generate and save 50 profiles
    const profiles = generatePanelProfiles({
      testId,
      domainId: testDraft.test.domain_id,
      intendedBuyerDescription: testDraft.audience_config.intended_buyer_description,
      adjacentBuyerDescription: testDraft.audience_config.adjacent_buyer_description,
      expectedSpendMin: testDraft.audience_config.expected_spend_min,
      expectedSpendMax: testDraft.audience_config.expected_spend_max,
      audienceMarkets: testDraft.audience_config.audience_markets,
      seed: 456
    });
    TestRepository.saveProfiles(testId, profiles);

    // 3. Create a Run record
    const run = TestRepository.createRun(testId, 'price', 456, 'llama-3.3-70b-versatile');
    assert.strictEqual(run.status, 'running');
    assert.strictEqual(run.total_evaluations_expected, 100);
    assert.strictEqual(run.total_evaluations_completed, 0);

    // 4. Save partial evaluations (e.g. only 10 profiles evaluated for Option A)
    const partialEvals = profiles.slice(0, 10).map(p => ({
      id: `eval_${p.id}_A`,
      run_id: run.id,
      test_id: testId,
      profile_id: p.id,
      option_id: 'A' as const,
      access_status: 'served' as const,
      response: 'interested' as const,
      reason: 'Great fit for daily office wear',
      factor_tags: ['fit' as const],
      referenced_fields: ['use_case', 'price'],
      created_at: new Date().toISOString()
    }));

    TestRepository.saveEvaluations(partialEvals);
    TestRepository.updateRun(run.id, {
      status: 'partial',
      total_evaluations_completed: 10,
      error_message: 'Incomplete run: 10 / 100 evaluations recorded.'
    });

    const retrievedRun = TestRepository.getRunById(run.id);
    assert.ok(retrievedRun);
    assert.strictEqual(retrievedRun.status, 'partial');
    assert.strictEqual(retrievedRun.total_evaluations_completed, 10);

    // 5. Check missing evaluations
    const missing = TestRepository.getMissingEvaluations(run.id, testId);
    assert.strictEqual(missing.option_a_missing.length, 40); // 50 - 10 = 40 missing
    assert.strictEqual(missing.option_b_missing.length, 50); // 50 missing for Option B
    assert.ok(!missing.option_a_missing.includes('prof_01')); // prof_01 was completed
    assert.ok(missing.option_a_missing.includes('prof_11')); // prof_11 is missing

    // 6. Resume / Complete remaining evaluations
    const remainingEvalsA = profiles.slice(10).map(p => ({
      id: `eval_${p.id}_A`,
      run_id: run.id,
      test_id: testId,
      profile_id: p.id,
      option_id: 'A' as const,
      access_status: 'served' as const,
      response: 'unsure' as const,
      reason: 'Price is reasonable but style preference varies',
      factor_tags: ['fit' as const],
      referenced_fields: ['use_case'],
      created_at: new Date().toISOString()
    }));

    const allEvalsB = profiles.map(p => {
      const elig = evaluateEligibility(p, testDraft.options.B);
      return {
        id: `eval_${p.id}_B`,
        run_id: run.id,
        test_id: testId,
        profile_id: p.id,
        option_id: 'B' as const,
        access_status: elig.access_status,
        response: elig.is_eligible ? ('interested' as const) : ('unavailable' as const),
        reason: elig.is_eligible ? 'Accepts premium price for gift box' : elig.reason_if_unserved!,
        factor_tags: elig.is_eligible ? ['creative' as const] : ['access' as const],
        referenced_fields: ['price', 'served_markets'],
        created_at: new Date().toISOString()
      };
    });

    TestRepository.saveEvaluations([...remainingEvalsA, ...allEvalsB]);
    const finalMissing = TestRepository.getMissingEvaluations(run.id, testId);
    assert.strictEqual(finalMissing.option_a_missing.length, 0);
    assert.strictEqual(finalMissing.option_b_missing.length, 0);

    const completeEvals = TestRepository.getEvaluationsByRunId(run.id);
    assert.strictEqual(completeEvals.length, 100);

    TestRepository.updateRun(run.id, {
      status: 'completed',
      total_evaluations_completed: 100,
      completed_at: new Date().toISOString(),
      error_message: null
    });

    const finalRun = TestRepository.getRunById(run.id);
    assert.strictEqual(finalRun?.status, 'completed');
    assert.strictEqual(finalRun?.total_evaluations_completed, 100);
  });
});
