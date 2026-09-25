import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { initDatabase, closeDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';
import { computeComparisonAnalysis, FullTestResponse, Profile, Evaluation, Run } from '@droptest/shared';

describe('Phase 4: Server Analysis API & Repository Integration Tests', () => {
  before(() => {
    initDatabase(':memory:');
  });

  after(() => {
    closeDatabase();
  });

  it('computes comparison analysis from persisted test, profiles, run, and evaluations', () => {
    // 1. Create draft test
    const testId = 'test_phase4_integration';
    const draft = TestRepository.saveDraft({
      test: { id: testId, title: 'Phase 4 Test', domain_id: 'clothing_accessories' },
      offering: {
        short_value_prop: 'Linen work shirt',
        description: 'Quality breathable shirt',
        currency: 'USD',
        period: 'launch_batch'
      },
      option_a: {
        name: 'Option A ($60)',
        price: 60,
        primary_message: 'Breathable linen shirt',
        served_markets: ['Bangalore Urban'],
        fulfillment_mode: 'Standard shipping',
        fixed_launch_cost: 1000,
        variable_cost_per_sale: 20
      },
      option_b: {
        name: 'Option B ($45)',
        price: 45,
        primary_message: 'Breathable linen shirt - sale',
        served_markets: ['Bangalore Urban'],
        fulfillment_mode: 'Standard shipping',
        fixed_launch_cost: 1000,
        variable_cost_per_sale: 20
      },
      audience_config: {
        intended_buyer_description: 'Office professionals',
        adjacent_buyer_description: 'Casual wearers',
        expected_spend_min: 30,
        expected_spend_max: 80,
        audience_markets: ['Bangalore Urban']
      },
      comparison_lever: 'price'
    });

    // 2. Create 50 profiles
    const profiles: Profile[] = [];
    for (let i = 1; i <= 50; i++) {
      const id = `prof_${String(i).padStart(2, '0')}`;
      profiles.push({
        id,
        test_id: testId,
        segment: i <= 20 ? 'intended' : (i <= 40 ? 'adjacent' : 'contrasting'),
        market: 'Bangalore Urban',
        budget_min: 30,
        budget_max: 80,
        use_case: 'Workwear',
        constraints: ['Machine washable'],
        priorities: ['Breathable'],
        access_mode: 'Standard shipping',
        created_at: new Date().toISOString()
      });
    }
    TestRepository.saveProfiles(testId, profiles);

    // 3. Create run and 100 evaluations
    const run = TestRepository.createRun(testId, 'price', 12345, 'openai/gpt-oss-120b');
    const runId = run.id;
    TestRepository.updateRun(runId, {
      status: 'completed',
      total_evaluations_completed: 100,
      completed_at: new Date().toISOString()
    });

    const evaluations: Evaluation[] = [];
    for (const p of profiles) {
      evaluations.push({
        id: `eval_a_${p.id}`,
        run_id: runId,
        test_id: testId,
        profile_id: p.id,
        option_id: 'A',
        access_status: 'served',
        response: 'unsure',
        reason: 'Price $60 is near the top of budget',
        primary_objection: 'High price',
        factor_tags: ['price'],
        referenced_fields: ['price'],
        created_at: new Date().toISOString()
      });
      evaluations.push({
        id: `eval_b_${p.id}`,
        run_id: runId,
        test_id: testId,
        profile_id: p.id,
        option_id: 'B',
        access_status: 'served',
        response: p.segment === 'intended' ? 'interested' : 'unsure',
        reason: 'Price $45 is affordable',
        factor_tags: ['price', 'fit'],
        referenced_fields: ['price'],
        created_at: new Date().toISOString()
      });
    }
    TestRepository.saveEvaluations(evaluations);

    // 4. Retrieve and verify full comparison analysis
    const fullTest = TestRepository.getById(testId)!;
    const savedRun = TestRepository.getRunById(runId)!;
    const savedProfiles = TestRepository.getProfiles(testId);
    const savedEvaluations = TestRepository.getEvaluationsByRunId(runId);

    const analysis = computeComparisonAnalysis(fullTest, savedRun, savedProfiles, savedEvaluations);

    assert.strictEqual(analysis.test_id, testId);
    assert.strictEqual(analysis.run_id, runId);
    assert.strictEqual(analysis.primary_lever, 'price');
    assert.strictEqual(analysis.option_a_summary.interested_total, 0);
    assert.strictEqual(analysis.option_b_summary.interested_total, 20);
    assert.strictEqual(analysis.option_b_summary.by_segment.intended.interested, 20);
    assert.strictEqual(analysis.transition_matrix.net_interested_change, 20);
    assert.strictEqual(analysis.decision_card.winner_declared, true);
    assert.strictEqual(analysis.decision_card.finance_comparison?.has_finance, true);
    assert.strictEqual(analysis.decision_card.finance_comparison?.break_even_a, 25);
    assert.strictEqual(analysis.decision_card.finance_comparison?.break_even_b, 40);

    // Clean up
    TestRepository.deleteById(testId);
  });
});
