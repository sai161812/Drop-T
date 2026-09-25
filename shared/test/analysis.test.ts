import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  Profile,
  Evaluation,
  Option,
  Run,
  FullTestResponse,
  computeOptionSummary,
  computeEligibilityChanges,
  computeProfileTransitions,
  computeTransitionMatrix,
  generateDecisionCard,
  computeComparisonAnalysis
} from '../src/index.js';

describe('Phase 4: Comparison Analysis, Matrix & Decision Synthesis Tests', () => {
  // Mock 50 profiles: 20 intended, 20 adjacent, 10 contrasting
  const mockProfiles: Profile[] = [];
  const markets = ['Bangalore Urban', 'Chennai Central', 'Hyderabad'];
  
  for (let i = 1; i <= 50; i++) {
    const id = `prof_${String(i).padStart(2, '0')}`;
    const segment = i <= 20 ? 'intended' : (i <= 40 ? 'adjacent' : 'contrasting');
    const market = markets[(i - 1) % markets.length];
    mockProfiles.push({
      id,
      test_id: 'test_123',
      segment,
      market,
      budget_min: 30,
      budget_max: 80,
      use_case: `Use case for ${id}`,
      constraints: ['Constraint A'],
      priorities: ['Priority B'],
      access_mode: 'Standard shipping',
      created_at: new Date().toISOString()
    });
  }

  const mockOptionA: Option = {
    id: 'A',
    test_id: 'test_123',
    name: 'Option A $60',
    price: 60,
    primary_message: 'Breathable linen shirt',
    served_markets: ['Bangalore Urban', 'Chennai Central'],
    fulfillment_mode: 'Standard shipping',
    images: [],
    fixed_launch_cost: 1000,
    variable_cost_per_sale: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockOptionB: Option = {
    id: 'B',
    test_id: 'test_123',
    name: 'Option B $45',
    price: 45,
    primary_message: 'Breathable linen shirt on sale',
    served_markets: ['Bangalore Urban', 'Hyderabad'], // Chennai excluded, Hyderabad added
    fulfillment_mode: 'Standard shipping',
    images: [],
    fixed_launch_cost: 1000,
    variable_cost_per_sale: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockFullTest: FullTestResponse = {
    test: {
      id: 'test_123',
      title: 'Linen Shirt Test',
      domain_id: 'clothing_accessories',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'ready'
    },
    offering: {
      id: 'off_123',
      test_id: 'test_123',
      short_value_prop: 'Breathable organic linen shirt',
      description: 'Handcrafted flax shirt',
      currency: 'USD',
      period: 'launch_batch',
      domain_specific_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    options: {
      A: mockOptionA,
      B: mockOptionB
    },
    audience_config: {
      id: 'aud_123',
      test_id: 'test_123',
      intended_buyer_description: 'Daily office commuters',
      adjacent_buyer_description: 'Weekend casual buyers',
      expected_spend_min: 30,
      expected_spend_max: 80,
      audience_markets: markets,
      panel_size: 50,
      intended_count: 20,
      adjacent_count: 20,
      contrasting_count: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    comparison_lever: 'price'
  };

  it('computes option summary with visible denominators and segment breakdowns', () => {
    // Generate mock evaluations for Option A
    const evalsA: Evaluation[] = mockProfiles.map(p => {
      const isServed = mockOptionA.served_markets.includes(p.market);
      if (!isServed) {
        return {
          id: `eval_a_${p.id}`,
          run_id: 'run_1',
          test_id: 'test_123',
          profile_id: p.id,
          option_id: 'A',
          access_status: 'unserved',
          response: 'unavailable',
          reason: 'Outside served markets',
          factor_tags: ['access'],
          referenced_fields: ['served_markets'],
          created_at: new Date().toISOString()
        };
      }
      return {
        id: `eval_a_${p.id}`,
        run_id: 'run_1',
        test_id: 'test_123',
        profile_id: p.id,
        option_id: 'A',
        access_status: 'served',
        response: p.segment === 'intended' ? 'interested' : 'unsure',
        reason: 'Good fit for workwear',
        factor_tags: ['price', 'fit'],
        referenced_fields: ['price', 'budget_max'],
        created_at: new Date().toISOString()
      };
    });

    const summary = computeOptionSummary('A', mockOptionA, mockProfiles, evalsA);
    assert.strictEqual(summary.total_profiles, 50);
    assert.strictEqual(summary.option_id, 'A');
    
    // Check eligible vs unserved counts
    const expectedServed = mockProfiles.filter(p => mockOptionA.served_markets.includes(p.market)).length;
    const expectedUnserved = 50 - expectedServed;
    assert.strictEqual(summary.eligible_count, expectedServed);
    assert.strictEqual(summary.unserved_count, expectedUnserved);
    assert.strictEqual(summary.unavailable_total, expectedUnserved);

    // Segment sums
    const segSum = summary.by_segment.intended.total + summary.by_segment.adjacent.total + summary.by_segment.contrasting.total;
    assert.strictEqual(segSum, 50);
    assert.strictEqual(summary.by_segment.intended.total, 20);
    assert.strictEqual(summary.by_segment.adjacent.total, 20);
    assert.strictEqual(summary.by_segment.contrasting.total, 10);
  });

  it('accurately tracks market eligibility changes when Option B modifies served markets', () => {
    const changes = computeEligibilityChanges(mockProfiles, mockOptionA, mockOptionB);
    
    // Chennai Central was served in A, unserved in B -> became_ineligible
    const chennai = changes.find(c => c.market === 'Chennai Central');
    assert.ok(chennai);
    assert.strictEqual(chennai.change_type, 'became_ineligible');
    assert.strictEqual(chennai.status_a, 'served');
    assert.strictEqual(chennai.status_b, 'unserved');
    assert.ok(chennai.profile_count > 0);

    // Hyderabad was unserved in A, served in B -> became_eligible
    const hyderabad = changes.find(c => c.market === 'Hyderabad');
    assert.ok(hyderabad);
    assert.strictEqual(hyderabad.change_type, 'became_eligible');
    assert.strictEqual(hyderabad.status_a, 'unserved');
    assert.strictEqual(hyderabad.status_b, 'served');
    assert.ok(hyderabad.profile_count > 0);

    // Bangalore Urban served in both -> unchanged
    const bangalore = changes.find(c => c.market === 'Bangalore Urban');
    assert.ok(bangalore);
    assert.strictEqual(bangalore.change_type, 'unchanged');
    assert.strictEqual(bangalore.status_a, 'served');
    assert.strictEqual(bangalore.status_b, 'served');
  });

  it('computes paired profile transitions and transition matrix accurately', () => {
    const evalsA: Evaluation[] = mockProfiles.map(p => ({
      id: `eval_a_${p.id}`,
      run_id: 'run_1',
      test_id: 'test_123',
      profile_id: p.id,
      option_id: 'A',
      access_status: 'served',
      response: 'unsure',
      reason: 'Price is high',
      primary_objection: 'Price $60 is near budget top',
      factor_tags: ['price'],
      referenced_fields: ['price'],
      created_at: new Date().toISOString()
    }));

    const evalsB: Evaluation[] = mockProfiles.map(p => ({
      id: `eval_b_${p.id}`,
      run_id: 'run_1',
      test_id: 'test_123',
      profile_id: p.id,
      option_id: 'B',
      access_status: 'served',
      response: p.segment === 'intended' ? 'interested' : 'unsure',
      reason: 'Price $45 is much more comfortable',
      factor_tags: ['price', 'fit'],
      referenced_fields: ['price'],
      created_at: new Date().toISOString()
    }));

    const transitions = computeProfileTransitions(mockProfiles, evalsA, evalsB);
    assert.strictEqual(transitions.length, 50);

    // All intended profiles should have transitioned from unsure -> interested (became_interested)
    const intendedTransitions = transitions.filter(t => t.segment === 'intended');
    assert.strictEqual(intendedTransitions.length, 20);
    assert.ok(intendedTransitions.every(t => t.transition_type === 'became_interested'));
    assert.ok(intendedTransitions.every(t => t.response_a === 'unsure' && t.response_b === 'interested'));

    const matrix = computeTransitionMatrix(transitions);
    assert.strictEqual(matrix.matrix.unsure.interested, 20);
    assert.strictEqual(matrix.net_interested_change, 20);
    assert.strictEqual(matrix.segment_switches.intended.gained_interested, 20);
    assert.strictEqual(matrix.segment_switches.intended.lost_interested, 0);
    assert.strictEqual(matrix.segment_switches.intended.net, 20);
  });

  it('generates decision card warning and refuses to declare winner on incomplete run', () => {
    const incompleteRun: Run = {
      id: 'run_inc',
      test_id: 'test_123',
      status: 'partial',
      primary_lever: 'price',
      profile_seed: 12345,
      total_evaluations_expected: 100,
      total_evaluations_completed: 40,
      created_at: new Date().toISOString()
    };

    const summaryA = computeOptionSummary('A', mockOptionA, mockProfiles, []);
    const summaryB = computeOptionSummary('B', mockOptionB, mockProfiles, []);
    const matrix = computeTransitionMatrix([]);
    const eligibilityChanges = computeEligibilityChanges(mockProfiles, mockOptionA, mockOptionB);

    const card = generateDecisionCard(
      mockFullTest,
      incompleteRun,
      summaryA,
      summaryB,
      matrix,
      eligibilityChanges
    );

    assert.strictEqual(card.is_run_complete, false);
    assert.strictEqual(card.winner_declared, false);
    assert.ok(card.status_headline.includes('incomplete (40/100'));
    assert.ok(card.key_simulated_observation.includes('Only 40 of 100'));
  });

  it('computes full comparison analysis with break-even financial comparison', () => {
    const completeRun: Run = {
      id: 'run_done',
      test_id: 'test_123',
      status: 'completed',
      primary_lever: 'price',
      profile_seed: 12345,
      total_evaluations_expected: 100,
      total_evaluations_completed: 100,
      created_at: new Date().toISOString()
    };

    const allEvals: Evaluation[] = [
      ...mockProfiles.map(p => ({
        id: `eval_a_${p.id}`,
        run_id: 'run_done',
        test_id: 'test_123',
        profile_id: p.id,
        option_id: 'A' as const,
        access_status: 'served' as const,
        response: 'unsure' as const,
        reason: 'Price $60 is tight',
        primary_objection: 'Budget limit',
        factor_tags: ['price' as const],
        referenced_fields: ['price'],
        created_at: new Date().toISOString()
      })),
      ...mockProfiles.map(p => ({
        id: `eval_b_${p.id}`,
        run_id: 'run_done',
        test_id: 'test_123',
        profile_id: p.id,
        option_id: 'B' as const,
        access_status: 'served' as const,
        response: (p.segment === 'intended' ? 'interested' : 'unsure') as any,
        reason: 'Price $45 is great',
        factor_tags: ['price' as const],
        referenced_fields: ['price'],
        created_at: new Date().toISOString()
      }))
    ];

    const analysis = computeComparisonAnalysis(mockFullTest, completeRun, mockProfiles, allEvals);

    assert.strictEqual(analysis.test_id, 'test_123');
    assert.strictEqual(analysis.run_id, 'run_done');
    assert.strictEqual(analysis.decision_card.is_run_complete, true);
    assert.strictEqual(analysis.decision_card.winner_declared, true);
    assert.ok(analysis.decision_card.key_simulated_observation.includes('20/20 intended interest'));
    
    // Check financial break-even calculation
    // Option A: Price 60, VarCost 20, Margin 40, Fixed 1000 -> Break-even = ceil(1000/40) = 25
    // Option B: Price 45, VarCost 20, Margin 25, Fixed 1000 -> Break-even = ceil(1000/25) = 40
    assert.strictEqual(analysis.finance_analysis.option_a.break_even_units, 25);
    assert.strictEqual(analysis.finance_analysis.option_b.break_even_units, 40);
    assert.strictEqual(analysis.decision_card.finance_comparison?.has_finance, true);
    assert.strictEqual(analysis.decision_card.finance_comparison?.break_even_a, 25);
    assert.strictEqual(analysis.decision_card.finance_comparison?.break_even_b, 40);
  });
});
