import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  TestDraftPayloadSchema, 
  calculateFinancials, 
  PANEL_CONSTANTS,
  PRIMARY_LEVERS,
  DOMAIN_IDS,
  HumanResponseSubmissionSchema,
  HUMAN_CHOICES,
  ProductDraftPayloadSchema,
  ProductPublishPayloadSchema
} from '../src/index.js';

describe('DROPTEST Shared Contracts & Logic', () => {
  it('accepts a bounded partial product draft but requires explicit category and availability facts to publish', () => {
    const draft = ProductDraftPayloadSchema.safeParse({ name: 'Draft only' });
    assert.equal(draft.success, true);
    if (draft.success) assert.equal(draft.data.summary, '');

    const base: any = {
      name: 'Sample apparel', category: 'clothing_accessories', stage: 'idea',
      summary: 'A sufficiently clear description of this everyday apparel proposal.',
      intended_buyer: 'People buying everyday apparel', feedback_question: 'What would you change?',
      price: null, currency: 'INR', availability_markets: ['Bengaluru'], fulfillment_mode: 'Courier delivery',
      images: [], category_data: {
        material: 'not_decided', fit: 'not_decided', sizes: 'not_decided',
        visual_description: 'A relaxed everyday garment with a simple, functional cut.'
      }, status: 'published'
    };
    assert.equal(ProductPublishPayloadSchema.safeParse(base).success, true);
    assert.equal(ProductPublishPayloadSchema.safeParse({ ...base, availability_markets: [] }).success, false);
    assert.equal(ProductPublishPayloadSchema.safeParse({ ...base, category_data: { material: 'cotton', fit: '', sizes: [], unrelated: 'bypass' } }).success, false);
  });

  it('supports digital and generic other category adapters and suppresses unknown-price finance', () => {
    const unknown = calculateFinancials({ currency: 'INR', period: 'launch_batch', price: 0, price_unknown: true, variable_cost_per_sale: 1, fixed_launch_cost: 10 });
    assert.equal(unknown.has_sufficient_inputs, false);
    assert.ok(unknown.missing_fields.includes('Price (not set; pricing analysis suppressed)'));
    assert.equal(DOMAIN_IDS.includes('other'), true);
  });

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
        primary_message: 'Sustainable everyday comfort',
        served_markets: ['Bangalore Urban', 'Chennai Central'],
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

  it('validates human feedback choices and sanitizes submission payload', () => {
    assert.deepStrictEqual(HUMAN_CHOICES, ['A', 'B', 'neither', 'unsure']);

    // Valid choices
    for (const choice of HUMAN_CHOICES) {
      const res = HumanResponseSubmissionSchema.safeParse({ choice });
      assert.strictEqual(res.success, true);
    }

    // Reason sanitization (stripping HTML)
    const resWithHtml = HumanResponseSubmissionSchema.safeParse({
      choice: 'A',
      reason: '  <strong>Great product!</strong> <script>alert(1)</script>  ',
      client_token: 'tok_123'
    });
    assert.strictEqual(resWithHtml.success, true);
    if (resWithHtml.success) {
      assert.strictEqual(resWithHtml.data.reason, 'Great product! alert(1)');
      assert.strictEqual(resWithHtml.data.client_token, 'tok_123');
    }

    // Invalid choice rejection
    const invalidChoice = HumanResponseSubmissionSchema.safeParse({ choice: 'C' });
    assert.strictEqual(invalidChoice.success, false);
  });
});
