import {
  OptionId,
  Option,
  Profile,
  Evaluation,
  Run,
  FullTestResponse,
  AudienceSegment,
  OptionResultSummary,
  SegmentResultBreakdown,
  MarketResultBreakdown,
  ObjectionSummaryItem,
  ProfileTransition,
  TransitionType,
  TransitionMatrix,
  EligibilityChangeSummary,
  DecisionCardData,
  SingleLeverDiffData,
  ComparisonAnalysis,
  ResponseCategory,
  FactorTag
} from './types.js';
import { calculateFinancials } from './finance.js';

const priceUnknown = (test: FullTestResponse) => (test.offering.domain_specific_data as any)?.lab_price_status === 'unknown';

/**
 * Compute aggregate results and breakdowns for a single Option (A or B)
 */
export function computeOptionSummary(
  optionId: OptionId,
  option: Option,
  profiles: Profile[],
  evaluations: Evaluation[]
): OptionResultSummary {
  const optionEvaluations = evaluations.filter(e => e.option_id === optionId);
  const evalMap = new Map<string, Evaluation>();
  for (const e of optionEvaluations) {
    evalMap.set(e.profile_id, e);
  }

  let interestedTotal = 0;
  let unsureTotal = 0;
  let notInterestedTotal = 0;
  let unavailableTotal = 0;
  let eligibleCount = 0;

  const segmentBreakdowns: Record<AudienceSegment, SegmentResultBreakdown> = {
    intended: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0, total: 0, eligible: 0 },
    adjacent: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0, total: 0, eligible: 0 },
    contrasting: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0, total: 0, eligible: 0 }
  };

  const marketBreakdowns: Record<string, MarketResultBreakdown> = {};
  const objectionCounts = new Map<string, { count: number; samples: string[] }>();

  for (const profile of profiles) {
    const evaluation = evalMap.get(profile.id);
    const seg = profile.segment;
    segmentBreakdowns[seg].total++;

    if (!marketBreakdowns[profile.market]) {
      const isMarketServed = (option.served_markets || []).includes(profile.market);
      marketBreakdowns[profile.market] = {
        market: profile.market,
        interested: 0,
        unsure: 0,
        not_interested: 0,
        unavailable: 0,
        total: 0,
        eligible: 0,
        access_status: isMarketServed ? 'served' : 'unserved'
      };
    }
    marketBreakdowns[profile.market].total++;

    if (!evaluation) {
      // Evaluation missing / incomplete
      continue;
    }

    if (evaluation.access_status === 'served') {
      eligibleCount++;
      segmentBreakdowns[seg].eligible++;
      marketBreakdowns[profile.market].eligible++;
    }

    const resp = evaluation.response;
    if (resp === 'interested') {
      interestedTotal++;
      segmentBreakdowns[seg].interested++;
      marketBreakdowns[profile.market].interested++;
    } else if (resp === 'unsure') {
      unsureTotal++;
      segmentBreakdowns[seg].unsure++;
      marketBreakdowns[profile.market].unsure++;
    } else if (resp === 'not_interested') {
      notInterestedTotal++;
      segmentBreakdowns[seg].not_interested++;
      marketBreakdowns[profile.market].not_interested++;
    } else if (resp === 'unavailable') {
      unavailableTotal++;
      segmentBreakdowns[seg].unavailable++;
      marketBreakdowns[profile.market].unavailable++;
    }

    // Collect objections from hesitant / non-interested personas
    if (resp === 'unsure' || resp === 'not_interested') {
      const tags = evaluation.factor_tags || [];
      const primaryTag = tags[0] || 'other';
      const objectionText = evaluation.primary_objection || evaluation.reason;
      
      const current = objectionCounts.get(primaryTag) || { count: 0, samples: [] };
      current.count++;
      if (objectionText && current.samples.length < 3 && !current.samples.includes(objectionText)) {
        current.samples.push(objectionText);
      }
      objectionCounts.set(primaryTag, current);
    }
  }

  const dominantObjections: ObjectionSummaryItem[] = Array.from(objectionCounts.entries())
    .map(([tag, data]) => ({
      tag: tag as FactorTag,
      count: data.count,
      sample_objections: data.samples
    }))
    .sort((a, b) => b.count - a.count);

  return {
    option_id: optionId,
    option_name: option.name,
    total_profiles: profiles.length,
    eligible_count: eligibleCount,
    unserved_count: profiles.length - eligibleCount,
    interested_total: interestedTotal,
    interested_eligible: eligibleCount > 0 ? interestedTotal : 0,
    unsure_total: unsureTotal,
    not_interested_total: notInterestedTotal,
    unavailable_total: unavailableTotal,
    by_segment: segmentBreakdowns,
    by_market: marketBreakdowns,
    dominant_objections: dominantObjections
  };
}

/**
 * Compute eligibility changes when Option B modifies served markets
 */
export function computeEligibilityChanges(
  profiles: Profile[],
  optionA: Option,
  optionB: Option
): EligibilityChangeSummary[] {
  const servedA = new Set(optionA.served_markets || []);
  const servedB = new Set(optionB.served_markets || []);

  const marketMap = new Map<string, { profiles: string[]; count: number }>();
  for (const p of profiles) {
    const cur = marketMap.get(p.market) || { profiles: [], count: 0 };
    cur.profiles.push(p.id);
    cur.count++;
    marketMap.set(p.market, cur);
  }

  const results: EligibilityChangeSummary[] = [];

  for (const [market, data] of marketMap.entries()) {
    const isServedInA = servedA.has(market);
    const isServedInB = servedB.has(market);

    let changeType: 'became_eligible' | 'became_ineligible' | 'unchanged' = 'unchanged';
    let coverageNote = `Market "${market}" served in both options.`;

    if (!isServedInA && isServedInB) {
      changeType = 'became_eligible';
      coverageNote = `Market "${market}" was unserved in Option A and is now served in Option B (+${data.count} eligible profiles).`;
    } else if (isServedInA && !isServedInB) {
      changeType = 'became_ineligible';
      coverageNote = `Market "${market}" was served in Option A but excluded in Option B (-${data.count} eligible profiles).`;
    } else if (!isServedInA && !isServedInB) {
      coverageNote = `Market "${market}" is unserved in both Option A and Option B (${data.count} unavailable profiles).`;
    }

    results.push({
      market,
      status_a: isServedInA ? 'served' : 'unserved',
      status_b: isServedInB ? 'served' : 'unserved',
      profile_count: data.count,
      profiles_affected: data.profiles,
      change_type: changeType,
      coverage_note: coverageNote
    });
  }

  return results;
}

/**
 * Classify single profile transition between Option A and Option B
 */
export function classifyTransition(
  respA: ResponseCategory,
  respB: ResponseCategory,
  accessA: 'served' | 'unserved',
  accessB: 'served' | 'unserved'
): TransitionType {
  if (accessA === 'unserved' && accessB === 'served') {
    return respB === 'interested' ? 'became_interested' : 'access_opened';
  }
  if (accessA === 'served' && accessB === 'unserved') {
    return 'access_closed';
  }
  if (accessA === 'unserved' && accessB === 'unserved') {
    return 'remained_unavailable';
  }

  if (respA !== 'interested' && respB === 'interested') {
    return 'became_interested';
  }
  if (respA === 'interested' && respB !== 'interested') {
    return 'lost_interest';
  }
  if (respA === 'interested' && respB === 'interested') {
    return 'remained_interested';
  }
  return 'remained_hesitant';
}

/**
 * Compute 50 paired profile transitions between Option A and Option B
 */
export function computeProfileTransitions(
  profiles: Profile[],
  evaluationsA: Evaluation[],
  evaluationsB: Evaluation[]
): ProfileTransition[] {
  const mapA = new Map<string, Evaluation>();
  for (const e of evaluationsA) {
    mapA.set(e.profile_id, e);
  }

  const mapB = new Map<string, Evaluation>();
  for (const e of evaluationsB) {
    mapB.set(e.profile_id, e);
  }

  return profiles.map(profile => {
    const evalA = mapA.get(profile.id);
    const evalB = mapB.get(profile.id);

    const respA: ResponseCategory = evalA?.response || 'unavailable';
    const respB: ResponseCategory = evalB?.response || 'unavailable';
    const accessA = evalA?.access_status || 'unserved';
    const accessB = evalB?.access_status || 'unserved';

    const transitionType = classifyTransition(respA, respB, accessA, accessB);

    return {
      profile_id: profile.id,
      segment: profile.segment,
      market: profile.market,
      budget_min: profile.budget_min,
      budget_max: profile.budget_max,
      use_case: profile.use_case,
      constraints: profile.constraints,
      priorities: profile.priorities,
      access_mode: profile.access_mode,
      response_a: respA,
      response_b: respB,
      access_status_a: accessA,
      access_status_b: accessB,
      reason_a: evalA?.reason || 'Evaluation missing or unserved',
      reason_b: evalB?.reason || 'Evaluation missing or unserved',
      primary_objection_a: evalA?.primary_objection,
      primary_objection_b: evalB?.primary_objection,
      factor_tags_a: evalA?.factor_tags || [],
      factor_tags_b: evalB?.factor_tags || [],
      referenced_fields_a: evalA?.referenced_fields || [],
      referenced_fields_b: evalB?.referenced_fields || [],
      source_ids_a: evalA?.source_ids || [],
      source_ids_b: evalB?.source_ids || [],
      transition_type: transitionType
    };
  });
}

/**
 * Compute 4x4 Transition Matrix and segment switches
 */
export function computeTransitionMatrix(transitions: ProfileTransition[]): TransitionMatrix {
  const categories: ResponseCategory[] = ['interested', 'unsure', 'not_interested', 'unavailable'];
  
  const matrix: Record<ResponseCategory, Record<ResponseCategory, number>> = {
    interested: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0 },
    unsure: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0 },
    not_interested: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0 },
    unavailable: { interested: 0, unsure: 0, not_interested: 0, unavailable: 0 }
  };

  const segmentSwitches: Record<AudienceSegment, { gained_interested: number; lost_interested: number; net: number }> = {
    intended: { gained_interested: 0, lost_interested: 0, net: 0 },
    adjacent: { gained_interested: 0, lost_interested: 0, net: 0 },
    contrasting: { gained_interested: 0, lost_interested: 0, net: 0 }
  };

  let totalInterestedA = 0;
  let totalInterestedB = 0;

  for (const t of transitions) {
    matrix[t.response_a][t.response_b]++;

    if (t.response_a === 'interested') totalInterestedA++;
    if (t.response_b === 'interested') totalInterestedB++;

    if (t.response_a !== 'interested' && t.response_b === 'interested') {
      segmentSwitches[t.segment].gained_interested++;
    } else if (t.response_a === 'interested' && t.response_b !== 'interested') {
      segmentSwitches[t.segment].lost_interested++;
    }
  }

  for (const seg of ['intended', 'adjacent', 'contrasting'] as AudienceSegment[]) {
    segmentSwitches[seg].net = segmentSwitches[seg].gained_interested - segmentSwitches[seg].lost_interested;
  }

  const topTransitions: Array<{ from: ResponseCategory; to: ResponseCategory; count: number }> = [];
  for (const fromCat of categories) {
    for (const toCat of categories) {
      const count = matrix[fromCat][toCat];
      if (count > 0 && fromCat !== toCat) {
        topTransitions.push({ from: fromCat, to: toCat, count });
      }
    }
  }
  topTransitions.sort((a, b) => b.count - a.count);

  return {
    matrix,
    top_transitions: topTransitions,
    net_interested_change: totalInterestedB - totalInterestedA,
    segment_switches: segmentSwitches
  };
}

/**
 * Compute exact diff on single lever
 */
export function computeSingleLeverDiff(
  fullTest: FullTestResponse
): SingleLeverDiffData {
  const lever = fullTest.comparison_lever || 'price';
  const optA = fullTest.options.A;
  const optB = fullTest.options.B;

  const diffs: SingleLeverDiffData['field_diffs'] = [];

  if (optB) {
    if (lever === 'price') {
      diffs.push({
        field: 'price',
        label: 'Price per unit',
        val_a: `${fullTest.offering.currency} ${optA.price}`,
        val_b: `${fullTest.offering.currency} ${optB.price}`
      });
    } else if (lever === 'message') {
      diffs.push({
        field: 'primary_message',
        label: 'Primary messaging / Headline',
        val_a: optA.primary_message,
        val_b: optB.primary_message
      });
    } else if (lever === 'served_markets') {
      diffs.push({
        field: 'served_markets',
        label: 'Served audience markets',
        val_a: optA.served_markets,
        val_b: optB.served_markets
      });
    } else if (lever === 'creative') {
      const descA = optA.images.map(image => `${image.filename}: ${image.confirmed_visual_description || 'No confirmed description'}`).join('; ');
      const descB = optB.images.map(image => `${image.filename}: ${image.confirmed_visual_description || 'No confirmed description'}`).join('; ');
      diffs.push({
        field: 'creative_description',
        label: 'Creative & visual positioning',
        val_a: descA,
        val_b: descB
      });
    }
  }

  const varCostA = optA.variable_cost_per_sale;
  const varCostB = optB?.variable_cost_per_sale;
  const fixedCostA = optA.fixed_launch_cost;
  const fixedCostB = optB?.fixed_launch_cost;
  const hasCostVariance = (varCostA !== varCostB) || (fixedCostA !== fixedCostB);

  return {
    lever,
    field_diffs: diffs,
    cost_diff: {
      var_cost_a: varCostA,
      var_cost_b: varCostB,
      fixed_cost_a: fixedCostA,
      fixed_cost_b: fixedCostB,
      has_cost_variance: Boolean(hasCostVariance)
    }
  };
}

/**
 * Construct compact, honest decision card from verified metrics
 */
export function generateDecisionCard(
  fullTest: FullTestResponse,
  run: Run,
  summaryA: OptionResultSummary,
  summaryB?: OptionResultSummary,
  _matrix?: TransitionMatrix,
  eligibilityChanges: EligibilityChangeSummary[] = []
): DecisionCardData {
  const isComparison = (run.mode === 'comparison' || fullTest.mode === 'comparison' || (!run.mode && Boolean(summaryB))) && Boolean(summaryB);
  const expectedCount = isComparison ? 100 : 50;
  const isComplete = run.status === 'completed' && run.total_evaluations_completed === expectedCount;

  if (!isComplete) {
    return {
      is_run_complete: false,
      total_completed: run.total_evaluations_completed,
      total_expected: expectedCount,
      winner_declared: false,
      status_headline: `Simulation is incomplete (${run.total_evaluations_completed}/${expectedCount} evaluations completed).`,
      recommended_next_test: 'Resume or retry missing evaluations before drawing conclusions.',
      key_simulated_observation: `Only ${run.total_evaluations_completed} of ${expectedCount} evaluations were saved. Partial results should not be used as final launch assessment.`,
      leading_objection: 'Incomplete run state',
      location_access_caveat: 'Coverage cannot be fully evaluated with missing records.',
      missing_evidence: isComparison 
        ? 'Complete all 50 persona evaluations for both Option A and Option B.'
        : 'Complete all 50 persona evaluations for Option A.'
    };
  }

  const optA = fullTest.options.A;

  if (!isComparison || !summaryB) {
    // Single Product Mode Decision Card
    const intendedA = summaryA.by_segment.intended.interested;
    const adjacentA = summaryA.by_segment.adjacent.interested;
    const contrastingA = summaryA.by_segment.contrasting.interested;
    const totalA = summaryA.interested_total;

    const topObjection = summaryA.dominant_objections[0];
    const leadingObjectionText = topObjection
      ? `${topObjection.tag.toUpperCase()} (${topObjection.count} hesitant personas): "${topObjection.sample_objections[0] || 'Hesitation / friction'}"`
      : 'No dominant objections recorded across simulated personas';

    const locationCaveat = summaryA.unserved_count > 0
      ? `${summaryA.unserved_count} profiles unserved by current availability (${(optA.served_markets || []).join(', ')}).`
      : 'All 50 panel profiles are in served markets.';

    const financeA = calculateFinancials({
      price_unknown: priceUnknown(fullTest),
      sales_scenarios: fullTest.offering.sales_scenarios,
      currency: fullTest.offering.currency,
      period: fullTest.offering.period,
      price: optA.price,
      fixed_launch_cost: optA.fixed_launch_cost,
      variable_cost_per_sale: optA.variable_cost_per_sale,
      capacity_units: optA.capacity_units
    });

    return {
      is_run_complete: true,
      total_completed: run.total_evaluations_completed,
      total_expected: 50,
      winner_declared: false,
      status_headline: `${totalA} / 50 simulated personas showed interest in ${optA.name}`,
      recommended_next_test: topObjection
        ? `Review the top simulated friction on ${topObjection.tag} and gather real community feedback.`
        : 'Share product with real prospective buyers to test actual willingness to pay.',
      key_simulated_observation: `Intended buyers: ${intendedA}/20 interested (${summaryA.by_segment.intended.unsure} unsure, ${summaryA.by_segment.intended.not_interested} not interested). Adjacent buyers: ${adjacentA}/20 interested. Contrasting: ${contrastingA}/10 interested.`,
      leading_objection: leadingObjectionText,
      location_access_caveat: locationCaveat,
      missing_evidence: 'Real willingness-to-pay, genuine purchase conversion, and unguided browsing behavior cannot be proven by AI simulation alone.',
      finance_comparison: financeA.has_sufficient_inputs ? {
        has_finance: true,
        break_even_a: financeA.break_even_units,
        break_even_status_a: financeA.break_even_status_message,
        note: `Break-even requires ${financeA.break_even_units ?? 'N/A'} units at ${fullTest.offering.currency} ${optA.price} to cover fixed launch costs.`
      } : {
        has_finance: false,
        note: 'Add optional fixed launch and unit costs in Synthetic Lab to calculate break-even targets.'
      }
    };
  }

  // Comparison Mode
  const intendedA = summaryA.by_segment.intended.interested;
  const intendedB = summaryB.by_segment.intended.interested;
  const intendedDiff = intendedB - intendedA;

  const totalA = summaryA.interested_total;
  const totalB = summaryB.interested_total;
  const totalDiff = totalB - totalA;

  const lever = fullTest.comparison_lever || 'price';
  const optB = fullTest.options.B!;

  // Check for conflicting signals
  const hasConflictingSignal = (intendedDiff > 0 && totalDiff < 0) || 
                                (intendedDiff < 0 && totalDiff > 0) ||
                                (summaryB.unserved_count > summaryA.unserved_count && totalB > totalA);

  let winnerDeclared = false;
  let headline = '';
  let nextTest = '';
  let observation = '';

  if (hasConflictingSignal) {
    headline = `Conflicting signal: Option B changed interest patterns unevenly across segments.`;
    nextTest = `Interview 5 intended buyers and 5 adjacent buyers on "${lever}" to resolve trade-offs before launching.`;
    observation = `Intended buyers: Option B ${intendedB}/20 vs Option A ${intendedA}/20 (${intendedDiff >= 0 ? '+' : ''}${intendedDiff}). Overall: Option B ${totalB}/50 vs Option A ${totalA}/50 (${totalDiff >= 0 ? '+' : ''}${totalDiff}).`;
  } else if (intendedDiff > 2 || (intendedDiff >= 0 && totalDiff >= 4)) {
    winnerDeclared = true;
    headline = `Option B (${optB.name}) shows stronger simulated interest, gaining +${intendedDiff} intended buyers and +${totalDiff} overall.`;
    nextTest = `Test Option B's ${lever} in a real pre-order or signup page with 20 real prospects.`;
    observation = `Option B achieved ${intendedB}/20 intended interest (vs ${intendedA}/20 in A) and ${totalB}/50 overall simulated interest (vs ${totalA}/50 in A).`;
  } else if (intendedDiff < -2 || totalDiff <= -4) {
    winnerDeclared = true;
    headline = `Option A (${optA.name}) performs better; Option B lost ${Math.abs(intendedDiff)} intended buyer responses.`;
    nextTest = `Keep Option A as baseline and test an alternative lever (e.g. messaging or fulfillment) instead.`;
    observation = `Option A retained ${intendedA}/20 intended buyers vs ${intendedB}/20 in Option B.`;
  } else {
    headline = `No clear simulated advantage between Option A and Option B (within ±2 persona margin).`;
    nextTest = `Test a bolder single-lever variant with a wider price/messaging gap with real prospective buyers.`;
    observation = `Option A: ${intendedA}/20 intended (${totalA}/50 total) vs Option B: ${intendedB}/20 intended (${totalB}/50 total).`;
  }

  // Dominant objection
  const topObjection = summaryB.dominant_objections[0] || summaryA.dominant_objections[0];
  const leadingObjectionText = topObjection 
    ? `${topObjection.tag.toUpperCase()} (${topObjection.count} hesitant personas): "${topObjection.sample_objections[0] || 'Unstated friction'}"`
    : 'No dominant objection recorded across personas';

  // Location / access caveat
  const unservedMarketsB = eligibilityChanges.filter(c => c.status_b === 'unserved');
  let locationCaveat = 'All audience markets are served in Option B.';
  if (unservedMarketsB.length > 0) {
    const marketNames = unservedMarketsB.map(m => `"${m.market}" (${m.profile_count} personas)`).join(', ');
    locationCaveat = `Option B excludes: ${marketNames}. Zero demand recorded there is due to lack of access, not product preference.`;
  }

  // Missing evidence
  let missingEvidence = 'Real willingness-to-pay and actual payment conversion with real credit cards.';
  if (lever === 'creative') {
    missingEvidence = 'Real visual appeal, unguided browsing behavior, and click-through on live ads.';
  } else if (lever === 'served_markets') {
    missingEvidence = 'Real local shipping costs, pickup compliance, and delivery carrier reliability.';
  } else if (lever === 'message') {
    missingEvidence = 'Real ad copy CTR, headline dwell time, and comprehension by cold visitors.';
  }

  // Finance comparison integration
  const financeA = calculateFinancials({
    price_unknown: priceUnknown(fullTest),
    sales_scenarios: fullTest.offering.sales_scenarios,
    currency: fullTest.offering.currency,
    period: fullTest.offering.period,
    price: optA.price,
    fixed_launch_cost: optA.fixed_launch_cost,
    variable_cost_per_sale: optA.variable_cost_per_sale,
    capacity_units: optA.capacity_units
  });

  const financeB = calculateFinancials({
    price_unknown: priceUnknown(fullTest),
    sales_scenarios: fullTest.offering.sales_scenarios,
    currency: fullTest.offering.currency,
    period: fullTest.offering.period,
    price: optB.price,
    fixed_launch_cost: optB.fixed_launch_cost,
    variable_cost_per_sale: optB.variable_cost_per_sale,
    capacity_units: optB.capacity_units
  });

  let financeComp: DecisionCardData['finance_comparison'] | undefined;

  if (financeA.has_sufficient_inputs && financeB.has_sufficient_inputs) {
    financeComp = {
      has_finance: true,
      break_even_a: financeA.break_even_units,
      break_even_b: financeB.break_even_units,
      break_even_status_a: financeA.break_even_status_message,
      break_even_status_b: financeB.break_even_status_message,
      note: `Break-even: Option A needs ${financeA.break_even_units ?? 'N/A'} units vs Option B needs ${financeB.break_even_units ?? 'N/A'} units to avoid loss.`
    };
  } else {
    financeComp = {
      has_finance: false,
      note: 'Add fixed launch costs and variable costs in Setup to calculate required break-even units.'
    };
  }

  return {
    is_run_complete: true,
    total_completed: run.total_evaluations_completed,
    total_expected: 100,
    winner_declared: winnerDeclared,
    status_headline: headline,
    recommended_next_test: nextTest,
    key_simulated_observation: observation,
    leading_objection: leadingObjectionText,
    location_access_caveat: locationCaveat,
    missing_evidence: missingEvidence,
    finance_comparison: financeComp
  };
}

/**
 * Master Comparison Analysis Builder
 */
export function computeComparisonAnalysis(
  fullTest: FullTestResponse,
  run: Run,
  profiles: Profile[],
  evaluations: Evaluation[]
): ComparisonAnalysis {
  const isComparison = (run.mode === 'comparison' || fullTest.mode === 'comparison' || (!run.mode && Boolean(fullTest.options.B))) && Boolean(fullTest.options.B);
  const evaluationsA = evaluations.filter(e => e.option_id === 'A');
  const evaluationsB = isComparison ? evaluations.filter(e => e.option_id === 'B') : [];

  const summaryA = computeOptionSummary('A', fullTest.options.A, profiles, evaluations);
  const summaryB = isComparison && fullTest.options.B ? computeOptionSummary('B', fullTest.options.B, profiles, evaluations) : undefined;

  const eligibilityChanges = isComparison && fullTest.options.B 
    ? computeEligibilityChanges(profiles, fullTest.options.A, fullTest.options.B)
    : [];

  let transitions: ProfileTransition[];
  let transitionMatrix: TransitionMatrix | undefined;
  let singleLeverDiff: SingleLeverDiffData | undefined;

  if (isComparison && fullTest.options.B) {
    transitions = computeProfileTransitions(profiles, evaluationsA, evaluationsB);
    transitionMatrix = computeTransitionMatrix(transitions);
    singleLeverDiff = computeSingleLeverDiff(fullTest);
  } else {
    // In single-product mode, map 50 profiles directly
    const mapA = new Map<string, Evaluation>();
    for (const e of evaluationsA) mapA.set(e.profile_id, e);
    transitions = profiles.map(p => {
      const evalA = mapA.get(p.id);
      return {
        profile_id: p.id,
        segment: p.segment,
        market: p.market,
        budget_min: p.budget_min,
        budget_max: p.budget_max,
        use_case: p.use_case,
        constraints: p.constraints,
        priorities: p.priorities,
        access_mode: p.access_mode,
        response_a: evalA?.response || 'unavailable',
        response_b: 'unavailable',
        access_status_a: evalA?.access_status || 'unserved',
        access_status_b: 'unserved',
        reason_a: evalA?.reason || 'Evaluation missing or unserved',
        reason_b: 'Single product review',
        primary_objection_a: evalA?.primary_objection,
        factor_tags_a: evalA?.factor_tags || [],
        factor_tags_b: [],
        referenced_fields_a: evalA?.referenced_fields || [],
        referenced_fields_b: [],
        source_ids_a: evalA?.source_ids || [],
        source_ids_b: [],
        transition_type: evalA?.response === 'interested' ? 'remained_interested' : 'remained_hesitant'
      };
    });
  }

  const decisionCard = generateDecisionCard(
    fullTest,
    run,
    summaryA,
    summaryB,
    transitionMatrix,
    eligibilityChanges
  );

  const financeA = calculateFinancials({
    price_unknown: priceUnknown(fullTest),
    sales_scenarios: fullTest.offering.sales_scenarios,
    currency: fullTest.offering.currency,
    period: fullTest.offering.period,
    price: fullTest.options.A.price,
    fixed_launch_cost: fullTest.options.A.fixed_launch_cost,
    variable_cost_per_sale: fullTest.options.A.variable_cost_per_sale,
    capacity_units: fullTest.options.A.capacity_units
  });

  const financeB = isComparison && fullTest.options.B ? calculateFinancials({
    price_unknown: priceUnknown(fullTest),
    sales_scenarios: fullTest.offering.sales_scenarios,
    currency: fullTest.offering.currency,
    period: fullTest.offering.period,
    price: fullTest.options.B.price,
    fixed_launch_cost: fullTest.options.B.fixed_launch_cost,
    variable_cost_per_sale: fullTest.options.B.variable_cost_per_sale,
    capacity_units: fullTest.options.B.capacity_units
  }) : undefined;

  const snapshot = (run as any).snapshot ? (typeof (run as any).snapshot === 'string' ? JSON.parse((run as any).snapshot) : (run as any).snapshot) : null;
  const references = (run as any).references || snapshot?.references || [];
  const selectedReferences = references.filter((r: any) => r.selected !== false);

  return {
    test_id: fullTest.test.id,
    product_id: fullTest.product_id || fullTest.test.product_id,
    run_id: run.id,
    mode: isComparison ? 'comparison' : 'single',
    research_status: run.research_status || snapshot?.research_status || 'without_research',
    references,
    selected_references: selectedReferences,
    reference_summary: snapshot?.reference_summary,
    run_status: run.status,
    primary_lever: fullTest.comparison_lever || 'price',
    model_id: run.model_id,
    currency: fullTest.offering.currency || 'USD',
    period: fullTest.offering.period || 'launch_batch',
    options: {
      A: {
        name: fullTest.options.A.name,
        price: fullTest.options.A.price,
        variable_cost_per_sale: fullTest.options.A.variable_cost_per_sale,
        fixed_launch_cost: fullTest.options.A.fixed_launch_cost,
        capacity_units: fullTest.options.A.capacity_units
      },
      ...(isComparison && fullTest.options.B ? {
        B: {
          name: fullTest.options.B.name,
          price: fullTest.options.B.price,
          variable_cost_per_sale: fullTest.options.B.variable_cost_per_sale,
          fixed_launch_cost: fullTest.options.B.fixed_launch_cost,
          capacity_units: fullTest.options.B.capacity_units
        }
      } : {})
    },
    option_a_summary: summaryA,
    option_b_summary: summaryB,
    eligibility_changes: eligibilityChanges,
    transitions,
    transition_matrix: transitionMatrix,
    decision_card: decisionCard,
    single_lever_diff: singleLeverDiff,
    finance_analysis: {
      option_a: financeA,
      option_b: financeB
    }
  };
}
