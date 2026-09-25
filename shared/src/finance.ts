import { FinancialInputs, FinancialCalculationResult, ScenarioCalculation } from './types.js';

/**
 * Calculates deterministic financial metrics per PRD Section 8.
 * Does not make statistical claims or infer demand from simulated panels.
 */
export function calculateFinancials(inputs: FinancialInputs): FinancialCalculationResult {
  const missingFields: string[] = [];

  if (!Number.isFinite(inputs.price) || inputs.price < 0) {
    missingFields.push('Price (P)');
  }
  if (inputs.variable_cost_per_sale === undefined || !Number.isFinite(inputs.variable_cost_per_sale) || inputs.variable_cost_per_sale < 0) {
    missingFields.push('Variable cost per sale (C)');
  }
  if (inputs.fixed_launch_cost === undefined || !Number.isFinite(inputs.fixed_launch_cost) || inputs.fixed_launch_cost < 0) {
    missingFields.push('Fixed launch cost (F)');
  }

  if (!inputs.currency?.trim()) missingFields.push('Currency');
  if (!inputs.period?.trim()) missingFields.push('Period or launch batch');
  if (missingFields.length > 0) {
    return {
      has_sufficient_inputs: false,
      missing_fields: missingFields
    };
  }

  const P = inputs.price;
  const C = inputs.variable_cost_per_sale!;
  const F = inputs.fixed_launch_cost!;
  const M = inputs.capacity_units;

  const contribution = P - C;

  let breakEvenUnits: number | null = null;
  let breakEvenStatusMessage: string | undefined;

  if (contribution <= 0) {
    breakEvenStatusMessage = 'No break-even at this price and unit cost.';
  } else {
    if (F === 0) {
      breakEvenUnits = 0;
    } else {
      breakEvenUnits = Math.ceil(F / contribution);
    }

    if (M !== undefined && M > 0 && breakEvenUnits > M) {
      breakEvenStatusMessage = 'Cannot break even within entered capacity.';
    }
  }

  const scenarios: {
    lower?: ScenarioCalculation;
    central?: ScenarioCalculation;
    higher?: ScenarioCalculation;
  } = {};

  const processScenario = (units?: number): ScenarioCalculation | undefined => {
    if (units === undefined || isNaN(units)) {
      return undefined;
    }

    if (!Number.isSafeInteger(units) || units < 0) {
      return {
        units,
        revenue: 0,
        variable_cost: 0,
        net_result: 0,
        is_within_capacity: false,
        is_valid: false,
        validation_error: units < 0 ? 'Sales scenario units cannot be negative.' : 'Sales scenario units must be finite whole numbers.'
      };
    }

    const hasCapacityCeiling = M !== undefined && M > 0;
    const isExceedingCapacity = hasCapacityCeiling && units > M;

    const revenue = units * P;
    const variableCost = units * C;
    const netResult = units * contribution - F;

    return {
      units,
      revenue,
      variable_cost: variableCost,
      net_result: netResult,
      is_within_capacity: !isExceedingCapacity,
      is_valid: !isExceedingCapacity,
      validation_error: isExceedingCapacity 
        ? `Scenario (${units} units) exceeds entered capacity ceiling of ${M} units.` 
        : undefined
    };
  };

  if (inputs.sales_scenarios) {
    if (inputs.sales_scenarios.lower_units !== undefined) {
      scenarios.lower = processScenario(inputs.sales_scenarios.lower_units);
    }
    if (inputs.sales_scenarios.central_units !== undefined) {
      scenarios.central = processScenario(inputs.sales_scenarios.central_units);
    }
    if (inputs.sales_scenarios.higher_units !== undefined) {
      scenarios.higher = processScenario(inputs.sales_scenarios.higher_units);
    }
  }

  return {
    has_sufficient_inputs: true,
    missing_fields: [],
    contribution_per_sale: contribution,
    break_even_units: breakEvenUnits,
    break_even_status_message: breakEvenStatusMessage,
    scenarios
  };
}
