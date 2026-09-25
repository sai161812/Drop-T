import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateFinancials } from '../src/index.js';

describe('Phase 5: Deterministic Finance Calculations & Scenario Engine Tests', () => {
  it('confirms exact PRD fixture: F=₹6000, C=₹350, PA=₹699 (18 units) & PB=₹899 (11 units)', () => {
    // Option A
    const resultA = calculateFinancials({
      currency: 'INR',
      period: 'launch_batch',
      price: 699,
      variable_cost_per_sale: 350,
      fixed_launch_cost: 6000
    });

    assert.strictEqual(resultA.has_sufficient_inputs, true);
    assert.strictEqual(resultA.contribution_per_sale, 349); // 699 - 350
    assert.strictEqual(resultA.break_even_units, 18); // ceil(6000 / 349) = ceil(17.1919) = 18
    assert.strictEqual(resultA.break_even_status_message, undefined);

    // Option B
    const resultB = calculateFinancials({
      currency: 'INR',
      period: 'launch_batch',
      price: 899,
      variable_cost_per_sale: 350,
      fixed_launch_cost: 6000
    });

    assert.strictEqual(resultB.has_sufficient_inputs, true);
    assert.strictEqual(resultB.contribution_per_sale, 549); // 899 - 350
    assert.strictEqual(resultB.break_even_units, 11); // ceil(6000 / 549) = ceil(10.9289) = 11
    assert.strictEqual(resultB.break_even_status_message, undefined);
  });

  it('handles zero fixed cost accurately (0 break-even units)', () => {
    const result = calculateFinancials({
      currency: 'USD',
      period: 'first_month',
      price: 100,
      variable_cost_per_sale: 40,
      fixed_launch_cost: 0
    });

    assert.strictEqual(result.contribution_per_sale, 60);
    assert.strictEqual(result.break_even_units, 0);
    assert.strictEqual(result.break_even_status_message, undefined);
  });

  it('flags zero or negative contribution as no break-even possible', () => {
    // Zero contribution
    const zeroMargin = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 50,
      variable_cost_per_sale: 50,
      fixed_launch_cost: 1000
    });
    assert.strictEqual(zeroMargin.contribution_per_sale, 0);
    assert.strictEqual(zeroMargin.break_even_units, null);
    assert.strictEqual(zeroMargin.break_even_status_message, 'No break-even at this price and unit cost.');

    // Negative contribution
    const negativeMargin = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 50,
      variable_cost_per_sale: 65,
      fixed_launch_cost: 1000
    });
    assert.strictEqual(negativeMargin.contribution_per_sale, -15);
    assert.strictEqual(negativeMargin.break_even_units, null);
    assert.strictEqual(negativeMargin.break_even_status_message, 'No break-even at this price and unit cost.');
  });

  it('computes non-integer break-even using ceiling without rounding down', () => {
    const result = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 65,
      variable_cost_per_sale: 30, // Contribution = 35
      fixed_launch_cost: 1000 // 1000 / 35 = 28.5714 -> ceil = 29
    });

    assert.strictEqual(result.contribution_per_sale, 35);
    assert.strictEqual(result.break_even_units, 29);
  });

  it('flags when break-even exceeds entered capacity ceiling', () => {
    const result = calculateFinancials({
      currency: 'INR',
      period: 'launch_batch',
      price: 1000,
      variable_cost_per_sale: 500, // Contribution = 500
      fixed_launch_cost: 50000, // Break-even = 100 units
      capacity_units: 80 // Capacity = 80 units
    });

    assert.strictEqual(result.break_even_units, 100);
    assert.strictEqual(result.break_even_status_message, 'Cannot break even within entered capacity.');
  });

  it('processes valid sales scenarios and rejects negative or above-capacity counts without clamping', () => {
    const result = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 50,
      variable_cost_per_sale: 20, // Contribution = 30
      fixed_launch_cost: 600, // Break-even = 20 units
      capacity_units: 100,
      sales_scenarios: {
        lower_units: 10, // Revenue 500, VarCost 200, Net = 300 - 600 = -300
        central_units: 30, // Revenue 1500, VarCost 600, Net = 900 - 600 = +300
        higher_units: -5 // Invalid negative scenario!
      }
    });

    assert.strictEqual(result.scenarios?.lower?.units, 10);
    assert.strictEqual(result.scenarios?.lower?.revenue, 500);
    assert.strictEqual(result.scenarios?.lower?.variable_cost, 200);
    assert.strictEqual(result.scenarios?.lower?.net_result, -300);
    assert.strictEqual(result.scenarios?.lower?.is_valid, true);

    assert.strictEqual(result.scenarios?.central?.units, 30);
    assert.strictEqual(result.scenarios?.central?.revenue, 1500);
    assert.strictEqual(result.scenarios?.central?.variable_cost, 600);
    assert.strictEqual(result.scenarios?.central?.net_result, 300);
    assert.strictEqual(result.scenarios?.central?.is_valid, true);

    // Negative scenario rejected
    assert.strictEqual(result.scenarios?.higher?.is_valid, false);
    assert.ok(result.scenarios?.higher?.validation_error?.includes('cannot be negative'));

    // Scenario exceeding capacity
    const capacityOverflow = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 50,
      variable_cost_per_sale: 20,
      fixed_launch_cost: 600,
      capacity_units: 50,
      sales_scenarios: {
        higher_units: 80 // Exceeds capacity 50!
      }
    });

    assert.strictEqual(capacityOverflow.scenarios?.higher?.is_valid, false);
    assert.strictEqual(capacityOverflow.scenarios?.higher?.is_within_capacity, false);
    assert.ok(capacityOverflow.scenarios?.higher?.validation_error?.includes('exceeds entered capacity ceiling'));
  });

  it('supports independent A/B production and fixed cost structures', () => {
    // Option A: Lower price, lower production cost, lower batch tooling
    const optA = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 25,
      variable_cost_per_sale: 10,
      fixed_launch_cost: 1500
    });

    // Option B: Higher price, higher production cost (gift box packaging), higher tooling
    const optB = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 40,
      variable_cost_per_sale: 15,
      fixed_launch_cost: 2500
    });

    assert.strictEqual(optA.contribution_per_sale, 15);
    assert.strictEqual(optA.break_even_units, 100); // 1500 / 15

    assert.strictEqual(optB.contribution_per_sale, 25);
    assert.strictEqual(optB.break_even_units, 100); // 2500 / 25
  });

  it('returns explicit missing-input guidance when costs are omitted', () => {
    const missingBoth = calculateFinancials({
      currency: 'USD',
      period: 'launch_batch',
      price: 50
    });

    assert.strictEqual(missingBoth.has_sufficient_inputs, false);
    assert.ok(missingBoth.missing_fields.includes('Variable cost per sale (C)'));
    assert.ok(missingBoth.missing_fields.includes('Fixed launch cost (F)'));
    assert.strictEqual(missingBoth.contribution_per_sale, undefined);
    assert.strictEqual(missingBoth.break_even_units, undefined);
  });
});
