import { Profile, Option, AccessStatus, ResponseCategory } from './types.js';

export interface EligibilityResult {
  is_eligible: boolean;
  access_status: AccessStatus;
  response_if_unserved?: ResponseCategory;
  reason_if_unserved?: string;
}

/**
 * Computes deterministic access status for a profile against an option.
 * If the profile's market is not in the option's served markets list,
 * it is strictly marked 'unserved' and 'unavailable' with an explicit coverage reason.
 * No model call or heuristic may override this.
 */
export function evaluateEligibility(profile: Profile, option: Option | { name: string; served_markets: string[] }): EligibilityResult {
  const isServed = option.served_markets.includes(profile.market);

  if (isServed) {
    return {
      is_eligible: true,
      access_status: 'served'
    };
  }

  const coverageList = option.served_markets.length > 0 
    ? option.served_markets.join(', ') 
    : 'None';

  return {
    is_eligible: false,
    access_status: 'unserved',
    response_if_unserved: 'unavailable',
    reason_if_unserved: `Market "${profile.market}" is outside "${option.name}" served markets (${coverageList}).`
  };
}

/**
 * Computes eligibility statistics across a 50-profile panel for an option.
 */
export function calculatePanelEligibilityStats(
  profiles: Profile[],
  option: Option | { name: string; served_markets: string[] }
): {
  total: number;
  eligible_count: number;
  unserved_count: number;
  eligible_by_segment: {
    intended: { eligible: number; total: number };
    adjacent: { eligible: number; total: number };
    contrasting: { eligible: number; total: number };
  };
  eligible_by_market: Record<string, { eligible: number; total: number }>;
} {
  let eligibleCount = 0;
  let unservedCount = 0;

  const eligibleBySegment = {
    intended: { eligible: 0, total: 0 },
    adjacent: { eligible: 0, total: 0 },
    contrasting: { eligible: 0, total: 0 }
  };

  const eligibleByMarket: Record<string, { eligible: number; total: number }> = {};

  for (const prof of profiles) {
    // Segment totals
    eligibleBySegment[prof.segment].total++;

    // Market totals
    if (!eligibleByMarket[prof.market]) {
      eligibleByMarket[prof.market] = { eligible: 0, total: 0 };
    }
    eligibleByMarket[prof.market].total++;

    const res = evaluateEligibility(prof, option);
    if (res.is_eligible) {
      eligibleCount++;
      eligibleBySegment[prof.segment].eligible++;
      eligibleByMarket[prof.market].eligible++;
    } else {
      unservedCount++;
    }
  }

  return {
    total: profiles.length,
    eligible_count: eligibleCount,
    unserved_count: unservedCount,
    eligible_by_segment: eligibleBySegment,
    eligible_by_market: eligibleByMarket
  };
}
