import { FinancialInputs, FinancialCalculationResult, ScenarioCalculation } from './types.js';

/**
 * Calculates deterministic financial metrics per PRD Section 8.
 * Does not make statistical claims or infer demand from simulated panels.
 */
export function calculateFinancials(inputs: FinancialInputs): FinancialCalculationResult {
  const missingFields: string[] = [];

  if (inputs.price === undefined || isNaN(inputs.price)) {
    missingFields.push('Price (P)');
  }
  if (inputs.variable_cost_per_sale === undefined || isNaN(inputs.variable_cost_per_sale)) {
    missingFields.push('Variable cost per sale (C)');
  }
  if (inputs.fixed_launch_cost === undefined || isNaN(inputs.fixed_launch_cost)) {
    missingFields.push('Fixed launch cost (F)');
  }

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
    if (units === undefined || isNaN(units) || units < 0) {
      return undefined;
    }
    const isWithinCapacity = M === undefined || M <= 0 || units <= M;
    const revenue = units * P;
    const variableCost = units * C;
    const netResult = units * contribution - F;

    return {
      units,
      revenue,
      variable_cost: variableCost,
      net_result: netResult,
      is_within_capacity: isWithinCapacity
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
