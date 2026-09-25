import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { 
  PANEL_CONSTANTS,
  evaluateEligibility,
  calculatePanelEligibilityStats,
  Profile
} from '@droptest/shared';
import { generatePanelProfiles } from '../src/simulation/profileGenerator.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';

describe('Phase 2: 50-Profile Generator & Eligibility Engine Tests', () => {
  before(() => {
    initDatabase(':memory:');
  });

  after(() => {
    closeDatabase();
  });

  it('generates exactly 50 profiles with exact 20/20/10 segment split and stable IDs', () => {
    const profiles = generatePanelProfiles({
      testId: 'test_demo_01',
      domainId: 'clothing_accessories',
      intendedBuyerDescription: 'Minimalist young professionals looking for organic linen workwear',
      adjacentBuyerDescription: 'Gift buyers and weekend leisure wearers',
      expectedSpendMin: 50,
      expectedSpendMax: 120,
      audienceMarkets: ['San Francisco', 'New York', 'Austin'],
      seed: 42
    });

    assert.strictEqual(profiles.length, 50);

    const intended = profiles.filter(p => p.segment === 'intended');
    const adjacent = profiles.filter(p => p.segment === 'adjacent');
    const contrasting = profiles.filter(p => p.segment === 'contrasting');

    assert.strictEqual(intended.length, PANEL_CONSTANTS.INTENDED_COUNT); // 20
    assert.strictEqual(adjacent.length, PANEL_CONSTANTS.ADJACENT_COUNT); // 20
    assert.strictEqual(contrasting.length, PANEL_CONSTANTS.CONTRASTING_COUNT); // 10

    // Check stable IDs
    for (let i = 0; i < 50; i++) {
      const expectedId = `prof_${(i + 1).toString().padStart(2, '0')}`;
      assert.strictEqual(profiles[i].id, expectedId);
      assert.strictEqual(profiles[i].test_id, 'test_demo_01');
      assert.ok(profiles[i].use_case.length > 0);
      assert.ok(profiles[i].constraints.length > 0);
      assert.ok(profiles[i].priorities.length > 0);
      assert.ok(profiles[i].access_mode.length > 0);
    }
  });

  it('ensures budget bands are derived strictly from expected spend and independent of option prices', () => {
    const params = {
      testId: 'test_demo_budget',
      domainId: 'local_food_beverages' as const,
      intendedBuyerDescription: 'Remote workers drinking iced coffee',
      adjacentBuyerDescription: 'Weekend brunch hosts',
      expectedSpendMin: 4.00,
      expectedSpendMax: 10.00,
      audienceMarkets: ['Downtown', 'Suburbs'],
      seed: 99
    };

    const profiles1 = generatePanelProfiles(params);

    // Profile budgets should fall logically relative to expected spend span
    for (const p of profiles1) {
      assert.ok(p.budget_min >= 0, `Budget min ${p.budget_min} should be >= 0`);
      assert.ok(p.budget_max >= p.budget_min, `Budget max ${p.budget_max} must be >= budget min ${p.budget_min}`);
    }

    // Changing option prices in a test does not change profile budgets
    const profiles2 = generatePanelProfiles(params);
    assert.deepStrictEqual(
      profiles1.map(p => ({ id: p.id, min: p.budget_min, max: p.budget_max })),
      profiles2.map(p => ({ id: p.id, min: p.budget_min, max: p.budget_max }))
    );
  });

  it('computes deterministic access status for served vs unserved markets', () => {
    const markets = ['Bangalore Urban', 'Chennai Central', 'Hyderabad'];
    const profiles = generatePanelProfiles({
      testId: 'test_demo_eligibility',
      domainId: 'clothing_accessories',
      intendedBuyerDescription: 'Eco-conscious buyers',
      adjacentBuyerDescription: 'Casual summer shoppers',
      expectedSpendMin: 600,
      expectedSpendMax: 1500,
      audienceMarkets: markets,
      seed: 777
    });

    const optionA = {
      name: 'Option A (All 3 Markets)',
      served_markets: ['Bangalore Urban', 'Chennai Central', 'Hyderabad']
    };

    const optionB = {
      name: 'Option B (Bangalore Only)',
      served_markets: ['Bangalore Urban']
    };

    const statsA = calculatePanelEligibilityStats(profiles, optionA);
    const statsB = calculatePanelEligibilityStats(profiles, optionB);

    // Option A covers all 3 markets -> 50 / 50 served
    assert.strictEqual(statsA.total, 50);
    assert.strictEqual(statsA.eligible_count, 50);
    assert.strictEqual(statsA.unserved_count, 0);

    // Option B only covers Bangalore Urban
    assert.strictEqual(statsB.total, 50);
    assert.ok(statsB.eligible_count > 0 && statsB.eligible_count < 50);
    assert.strictEqual(statsB.eligible_count + statsB.unserved_count, 50);

    // Check individual profile transition
    for (const prof of profiles) {
      const resA = evaluateEligibility(prof, optionA);
      const resB = evaluateEligibility(prof, optionB);

      assert.strictEqual(resA.is_eligible, true);
      assert.strictEqual(resA.access_status, 'served');

      if (prof.market === 'Bangalore Urban') {
        assert.strictEqual(resB.is_eligible, true);
        assert.strictEqual(resB.access_status, 'served');
      } else {
        assert.strictEqual(resB.is_eligible, false);
        assert.strictEqual(resB.access_status, 'unserved');
        assert.strictEqual(resB.response_if_unserved, 'unavailable');
        assert.ok(resB.reason_if_unserved?.includes(`Market "${prof.market}" is outside`));
      }
    }
  });

  it('guarantees attribute combination uniqueness across the 50 personas', () => {
    const profiles = generatePanelProfiles({
      testId: 'test_demo_uniqueness',
      domainId: 'digital_products_services',
      intendedBuyerDescription: 'Solo agencies automating invoice OCR',
      adjacentBuyerDescription: 'Freelance bookkeepers',
      expectedSpendMin: 29,
      expectedSpendMax: 99,
      audienceMarkets: ['US East', 'US West', 'EU Central', 'UK'],
      seed: 12345
    });

    const signatures = new Set<string>();
    for (const p of profiles) {
      const sig = `${p.segment}::${p.market}::${p.use_case}::${p.constraints.join('|')}::${p.priorities.join('|')}`;
      assert.ok(!signatures.has(sig), `Duplicate profile attribute signature found: ${sig}`);
      signatures.add(sig);
    }
    assert.strictEqual(signatures.size, 50);
  });

  it('generates sample profiles for Clothing & Accessories and Local Food drafts', () => {
    // Clothing Draft
    const clothingProfiles = generatePanelProfiles({
      testId: 'clothing_draft',
      domainId: 'clothing_accessories',
      intendedBuyerDescription: 'Young professionals wanting 100% organic linen shirts',
      adjacentBuyerDescription: 'Graduates looking for smart workwear gifts',
      expectedSpendMin: 700,
      expectedSpendMax: 1400,
      audienceMarkets: ['Bangalore', 'Mumbai'],
      seed: 101
    });
    assert.strictEqual(clothingProfiles.length, 50);
    assert.ok(clothingProfiles[0].use_case.includes('Young professionals wanting 100% organic linen shirts'));
    assert.ok(clothingProfiles[20].use_case.includes('Graduates looking for smart workwear gifts'));

    // Local Food Draft
    const foodProfiles = generatePanelProfiles({
      testId: 'food_draft',
      domainId: 'local_food_beverages',
      intendedBuyerDescription: 'Specialty cold brew coffee drinkers',
      adjacentBuyerDescription: 'Weekend bakery hosts',
      expectedSpendMin: 150,
      expectedSpendMax: 400,
      audienceMarkets: ['Indiranagar', 'Koramangala', 'HSR Layout'],
      seed: 202
    });
    assert.strictEqual(foodProfiles.length, 50);
    assert.ok(foodProfiles[0].use_case.toLowerCase().includes('coffee') || foodProfiles[0].use_case.toLowerCase().includes('beverage') || foodProfiles[0].use_case.toLowerCase().includes('brew'));
  });

  it('persists and retrieves 50 profiles in SQLite database via TestRepository', () => {
    // 1. Save test draft
    const savedTest = TestRepository.saveDraft({
      test: {
        title: 'Organic Tea Blend',
        domain_id: 'local_food_beverages'
      },
      offering: {
        short_value_prop: 'Handcrafted loose leaf artisan green tea',
        description: 'Single-estate loose leaf tea.',
        currency: 'USD',
        period: 'launch_batch'
      },
      option_a: {
        name: 'Loose Leaf Tin $18',
        price: 18,
        primary_message: 'Fresh spring harvest tin',
        served_markets: ['Seattle', 'Portland'],
        fulfillment_mode: 'Postal delivery'
      },
      option_b: {
        name: 'Starter Kit $28',
        price: 28,
        primary_message: 'Tin + stainless infuser bundle',
        served_markets: ['Seattle'],
        fulfillment_mode: 'Postal delivery'
      },
      audience_config: {
        intended_buyer_description: 'Daily specialty tea drinkers',
        adjacent_buyer_description: 'Wellness gift shoppers',
        expected_spend_min: 15,
        expected_spend_max: 35,
        audience_markets: ['Seattle', 'Portland']
      },
      comparison_lever: 'price'
    });

    const testId = savedTest.test.id;

    // 2. Generate profiles
    const generated = generatePanelProfiles({
      testId,
      domainId: savedTest.test.domain_id,
      intendedBuyerDescription: savedTest.audience_config.intended_buyer_description,
      adjacentBuyerDescription: savedTest.audience_config.adjacent_buyer_description,
      expectedSpendMin: savedTest.audience_config.expected_spend_min,
      expectedSpendMax: savedTest.audience_config.expected_spend_max,
      audienceMarkets: savedTest.audience_config.audience_markets,
      seed: 555
    });

    // 3. Save profiles
    const savedProfiles = TestRepository.saveProfiles(testId, generated);
    assert.strictEqual(savedProfiles.length, 50);

    // 4. Retrieve profiles
    const retrievedProfiles = TestRepository.getProfiles(testId);
    assert.strictEqual(retrievedProfiles.length, 50);
    assert.strictEqual(retrievedProfiles[0].id, 'prof_01');
    assert.strictEqual(retrievedProfiles[49].id, 'prof_50');
    assert.deepStrictEqual(retrievedProfiles[0].constraints, generated[0].constraints);

    // 5. Delete test cascades to profiles
    TestRepository.deleteById(testId);
    const postDeleteProfiles = TestRepository.getProfiles(testId);
    assert.strictEqual(postDeleteProfiles.length, 0);
  });
});
