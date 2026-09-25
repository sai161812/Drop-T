import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  TestDraftPayloadSchema, 
  calculateFinancials, 
  PANEL_CONSTANTS,
  PRIMARY_LEVERS,
  DOMAIN_IDS
} from '../src/index.js';

describe('DROPTEST Shared Contracts & Logic', () => {
  it('enforces fixed 50-profile constants and 20/20/10 split', () => {
    assert.strictEqual(PANEL_CONSTANTS.TOTAL_PROFILES, 50);
    assert.strictEqual(PANEL_CONSTANTS.INTENDED_COUNT, 20);
    assert.strictEqual(PANEL_CONSTANTS.ADJACENT_COUNT, 20);
    assert.strictEqual(PANEL_CONSTANTS.CONTRASTING_COUNT, 10);
    assert.strictEqual(
      PANEL_CONSTANTS.INTENDED_COUNT + PANEL_CONSTANTS.ADJACENT_COUNT + PANEL_CONSTANTS.CONTRASTING_COUNT,
      50
    );
    assert.strictEqual(PANEL_CONSTANTS.TOTAL_EVALUATIONS, 100);
  });

  it('calculates break-even and scenarios accurately', () => {
    const result = calculateFinancials({
      currency: 'INR',
      period: 'launch_batch',
      price: 699,
      variable_cost_per_sale: 299,
      fixed_launch_cost: 20000,
      capacity_units: 100,
      sales_scenarios: {
        lower_units: 30,
        central_units: 60,
        higher_units: 90
      }
    });

    assert.strictEqual(result.has_sufficient_inputs, true);
    assert.strictEqual(result.contribution_per_sale, 400); // 699 - 299
    assert.strictEqual(result.break_even_units, 50); // ceil(20000 / 400)
    assert.strictEqual(result.break_even_status_message, undefined);

    assert.ok(result.scenarios?.central);
    assert.strictEqual(result.scenarios.central.revenue, 60 * 699);
    assert.strictEqual(result.scenarios.central.variable_cost, 60 * 299);
    assert.strictEqual(result.scenarios.central.net_result, 60 * 400 - 20000); // 4000
    assert.strictEqual(result.scenarios.central.is_within_capacity, true);
  });

  it('flags when break-even is impossible due to nonpositive margin', () => {
    const result = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 50,
      variable_cost_per_sale: 60,
      fixed_launch_cost: 1000
    });

    assert.strictEqual(result.contribution_per_sale, -10);
    assert.strictEqual(result.break_even_units, null);
    assert.strictEqual(result.break_even_status_message, 'No break-even at this price and unit cost.');
  });

  it('flags when break-even exceeds stated capacity', () => {
    const result = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 100,
      variable_cost_per_sale: 50,
      fixed_launch_cost: 5000,
      capacity_units: 80 // Needs 100 units to break even
    });

    assert.strictEqual(result.contribution_per_sale, 50);
    assert.strictEqual(result.break_even_units, 100);
    assert.strictEqual(result.break_even_status_message, 'Cannot break even within entered capacity.');
  });

  it('validates test draft payload and rejects unserved market not in audience markets', () => {
    const validPayload = {
      test: {
        title: 'Organic Linen Shirt',
        domain_id: 'clothing_accessories' as const
      },
      offering: {
        short_value_prop: 'Breathable linen shirt handcrafted for warm climates',
        description: 'Made from 100% natural organic flax linen with horn buttons.',
        currency: 'INR',
        period: 'launch_batch',
        domain_specific_data: {
          item_type: 'Shirt',
          material: '100% Organic Linen',
          sizes: ['S', 'M', 'L', 'XL']
        }
      },
      option_a: {
        name: 'Baseline ₹699',
        price: 699,
        primary_message: 'Sustainable everyday comfort',
        served_markets: ['Bangalore Urban', 'Chennai Central'],
        fulfillment_mode: 'Standard shipping'
      },
      option_b: {
        name: 'Premium ₹899',
        price: 899,
        primary_message: 'Sustainable everyday luxury with gift box',
        served_markets: ['Bangalore Urban'],
        fulfillment_mode: 'Standard shipping'
      },
      audience_config: {
        intended_buyer_description: 'Young professionals seeking sustainable minimalist clothing',
        adjacent_buyer_description: 'College students looking for durable natural fabrics',
        expected_spend_min: 500,
        expected_spend_max: 1200,
        audience_markets: ['Bangalore Urban', 'Chennai Central', 'Hyderabad']
      },
      comparison_lever: 'price' as const
    };

    const parsed = TestDraftPayloadSchema.safeParse(validPayload);
    assert.strictEqual(parsed.success, true);

    // Invalid payload: Option A served market not in audience markets
    const invalidMarketsPayload = {
      ...validPayload,
      option_a: {
        ...validPayload.option_a,
        served_markets: ['Delhi NCR'] // Not in audience markets!
      }
    };

    const invalidResult = TestDraftPayloadSchema.safeParse(invalidMarketsPayload);
    assert.strictEqual(invalidResult.success, false);
  });
});
