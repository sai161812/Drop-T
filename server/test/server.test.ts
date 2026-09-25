import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { initDatabase, closeDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';

describe('DROPTEST Server & Database Repository Tests', () => {
  before(() => {
    initDatabase(':memory:');
  });

  after(() => {
    closeDatabase();
  });

  it('saves and retrieves a test draft with A/B options and audience config', () => {
    const payload = {
      test: {
        title: 'Artisan Cold Brew Coffee',
        domain_id: 'local_food_beverages' as const
      },
      offering: {
        short_value_prop: 'Slow-steeped single-origin Arabica cold brew',
        description: 'Steeped for 18 hours with notes of dark chocolate and roasted hazelnut.',
        currency: 'USD',
        period: 'launch_batch',
        domain_specific_data: {
          item_name: 'Hazelnut Cold Brew 500ml',
          portion: '500ml glass bottle',
          pickup_delivery_mode: 'Local pickup & delivery'
        }
      },
      option_a: {
        name: 'Standard Bottle $4.50',
        price: 4.50,
        primary_message: 'Freshly brewed daily for pickup',
        served_markets: ['Downtown', 'Northside'],
        fulfillment_mode: 'Pickup only',
        variable_cost_per_sale: 1.50,
        fixed_launch_cost: 300,
        capacity_units: 500
      },
      option_b: {
        name: 'Doorstep Delivery $6.00',
        price: 6.00,
        primary_message: 'Chilled doorstep morning delivery',
        served_markets: ['Downtown'],
        fulfillment_mode: 'Doorstep delivery',
        variable_cost_per_sale: 2.25,
        fixed_launch_cost: 300,
        capacity_units: 500
      },
      audience_config: {
        intended_buyer_description: 'Remote workers needing afternoon specialty iced coffee',
        adjacent_buyer_description: 'Weekend cafe regulars wanting home stock',
        expected_spend_min: 3.50,
        expected_spend_max: 8.00,
        audience_markets: ['Downtown', 'Northside', 'West End']
      },
      comparison_lever: 'price' as const
    };

    const saved = TestRepository.saveDraft(payload);
    assert.ok(saved.test.id);
    assert.strictEqual(saved.test.title, 'Artisan Cold Brew Coffee');
    assert.strictEqual(saved.options.A.price, 4.50);
    assert.strictEqual(saved.options.B.price, 6.00);
    assert.strictEqual(saved.audience_config.panel_size, 50);
    assert.strictEqual(saved.audience_config.intended_count, 20);
    assert.strictEqual(saved.audience_config.adjacent_count, 20);
    assert.strictEqual(saved.audience_config.contrasting_count, 10);

    const retrieved = TestRepository.getById(saved.test.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.test.id, saved.test.id);
    assert.strictEqual(retrieved.options.A.name, 'Standard Bottle $4.50');
    assert.strictEqual(retrieved.options.B.served_markets.length, 1);
    assert.strictEqual(retrieved.options.B.served_markets[0], 'Downtown');
  });

  it('records human feedback separately from simulated results', () => {
    const tests = TestRepository.listAll();
    const testId = tests[0].id;

    TestRepository.recordHumanResponse(testId, 'A', 'I prefer picking it up myself');
    TestRepository.recordHumanResponse(testId, 'B', 'Doorstep delivery is worth the extra price');
    TestRepository.recordHumanResponse(testId, 'A', 'Better price point');

    const feedback = TestRepository.getHumanFeedback(testId);
    assert.strictEqual(feedback.total, 3);
    assert.strictEqual(feedback.counts.A, 2);
    assert.strictEqual(feedback.counts.B, 1);
    assert.strictEqual(feedback.counts.neither, 0);
    assert.strictEqual(feedback.counts.unsure, 0);
  });

  it('deletes a draft test cleanly', () => {
    const tests = TestRepository.listAll();
    const testId = tests[0].id;
    const deleted = TestRepository.deleteById(testId);
    assert.strictEqual(deleted, true);

    const check = TestRepository.getById(testId);
    assert.strictEqual(check, null);
  });
});

