import { 
  Profile, 
  AudienceSegment, 
  DomainId, 
  PANEL_CONSTANTS 
} from '@droptest/shared';

// Deterministic PRNG (Mulberry32)
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ProfileGeneratorParams {
  testId: string;
  domainId: DomainId;
  intendedBuyerDescription: string;
  adjacentBuyerDescription: string;
  expectedSpendMin: number;
  expectedSpendMax: number;
  audienceMarkets: string[];
  seed?: number;
}

// Inspectable domain traits independent of the demonstration products.
const DOMAIN_TRAITS: Record<DomainId, { constraints: string[][]; priorities: string[][]; access_modes: string[] }> = {
  clothing_accessories: {
    constraints: [['Needs clear sizing or dimensions'], ['Limited storage for occasional-use items'], ['Needs care instructions'], ['Wants material details'], ['Needs delivery terms'], ['Prefers versatile items'], ['Needs return information'], ['Has a fixed spending limit']],
    priorities: [['Comfort', 'Practical fit'], ['Durability', 'Care effort'], ['Value', 'Useful details'], ['Appearance', 'Material'], ['Versatility', 'Availability'], ['Quality information', 'Price'], ['Convenience', 'Clear sizing'], ['Distinctive design', 'Usability']],
    access_modes: ['Shipping if offered', 'Pickup if offered', 'Either supplied fulfillment mode']
  },
  local_food_beverages: {
    constraints: [['Needs ingredients and allergen information'], ['Needs portion details'], ['Has limited pickup availability'], ['Needs storage guidance'], ['Wants availability window confirmed'], ['Has a fixed spending limit'], ['Needs preparation information'], ['Wants fulfillment terms']],
    priorities: [['Taste description', 'Ingredients'], ['Convenience', 'Availability'], ['Portion value', 'Price'], ['Preparation details', 'Freshness information'], ['Dietary suitability', 'Transparency'], ['Ease of ordering', 'Fulfillment'], ['Variety', 'Use occasion'], ['Packaging information', 'Storage needs']],
    access_modes: ['Pickup if offered', 'Delivery if offered', 'Either supplied fulfillment mode']
  },
  digital_products_services: {
    constraints: [['Needs supported platforms confirmed'], ['Limited time to learn a new tool'], ['Needs language support information'], ['Wants clear billing terms'], ['Needs privacy information'], ['Has an existing alternative'], ['Needs support availability'], ['Has a fixed spending limit']],
    priorities: [['Core use case', 'Ease of use'], ['Time required', 'Clarity'], ['Price', 'Billing terms'], ['Compatibility', 'Reliability information'], ['Support', 'Accessibility'], ['Data handling', 'Transparency'], ['Useful outcome', 'Workflow fit'], ['Trial evidence', 'Switching effort']],
    access_modes: ['Online access if supported', 'Supported platform required', 'Language support required']
  }
};

/**
 * Generates exactly 50 distinct, reproducible profiles for a test.
 * Preserves the fixed 20/20/10 segment split and uses the user's 1-4 audience markets.
 * Budget bands are derived strictly from expected_spend_min/max, independent of candidate prices.
 * Meaningful attribute combinations are verified for uniqueness across the panel.
 */
export function generatePanelProfiles(params: ProfileGeneratorParams): Profile[] {
  const {
    testId,
    domainId,
    expectedSpendMin,
    expectedSpendMax,
    audienceMarkets,
    seed = 12345
  } = params;

  if (!audienceMarkets || audienceMarkets.length === 0) {
    throw new Error('Cannot generate profiles: audience markets list is empty');
  }

  const prng = createPRNG(seed);
  const domainTraits = DOMAIN_TRAITS[domainId] || DOMAIN_TRAITS.clothing_accessories;

  const profiles: Profile[] = [];
  const createdAt = new Date().toISOString();

  // Spend span for budget bands
  const spendMin = Math.max(0, expectedSpendMin);
  const spendMax = Math.max(spendMin, expectedSpendMax);
  const spendSpan = spendMax - spendMin;

  const segmentsConfig: { segment: AudienceSegment; count: number }[] = [
    { segment: 'intended', count: PANEL_CONSTANTS.INTENDED_COUNT },     // 20
    { segment: 'adjacent', count: PANEL_CONSTANTS.ADJACENT_COUNT },     // 20
    { segment: 'contrasting', count: PANEL_CONSTANTS.CONTRASTING_COUNT } // 10
  ];

  let profileIndex = 1;
  const attributeSignatures = new Set<string>();

  for (const { segment, count } of segmentsConfig) {
    const audience = segment === 'intended' ? params.intendedBuyerDescription : segment === 'adjacent' ? params.adjacentBuyerDescription : 'Outside the declared positioning (' + params.intendedBuyerDescription + '); evaluate a different use context without assuming dislike';
    const contexts = ['regular personal use', 'occasional use', 'replacement of an existing alternative', 'a first trial', 'shared use', 'a specific upcoming need', 'convenience when time is limited', 'comparison with a familiar alternative'];
    const traits = { ...domainTraits, use_cases: contexts.map(context => audience + '. Perspective: ' + context + '.') };

    for (let i = 0; i < count; i++) {
      const id = `prof_${profileIndex.toString().padStart(2, '0')}`;
      profileIndex++;

      // Stratified market allocation: cycle evenly through configured audience markets with deterministic jitter
      const marketIndex = (profileIndex - 2) % audienceMarkets.length;
      const market = audienceMarkets[marketIndex];

      // Budget tier generation (independent of candidate prices PA or PB)
      let budgetMin: number;
      let budgetMax: number;

      // Small deterministic pseudo-random variance for distinct budget points
      const jitter1 = (prng() * 0.1 - 0.05) * spendSpan;
      const jitter2 = (prng() * 0.1 - 0.05) * spendSpan;

      if (segment === 'intended') {
        // Realistic range centered around expected spend
        const tier = i % 3;
        if (tier === 0) { // Value conscious
          budgetMin = Math.round(spendMin + 0.05 * spendSpan + jitter1);
          budgetMax = Math.round(spendMin + 0.55 * spendSpan + jitter2);
        } else if (tier === 1) { // Median
          budgetMin = Math.round(spendMin + 0.25 * spendSpan + jitter1);
          budgetMax = Math.round(spendMin + 0.85 * spendSpan + jitter2);
        } else { // Generous
          budgetMin = Math.round(spendMin + 0.40 * spendSpan + jitter1);
          budgetMax = Math.round(spendMax + jitter2);
        }
      } else if (segment === 'adjacent') {
        // Slightly wider or conservative budget
        const tier = i % 3;
        if (tier === 0) {
          budgetMin = Math.round(spendMin + jitter1);
          budgetMax = Math.round(spendMin + 0.50 * spendSpan + jitter2);
        } else if (tier === 1) {
          budgetMin = Math.round(spendMin + 0.20 * spendSpan + jitter1);
          budgetMax = Math.round(spendMin + 0.70 * spendSpan + jitter2);
        } else {
          budgetMin = Math.round(spendMin + 0.35 * spendSpan + jitter1);
          budgetMax = Math.round(spendMin + 0.90 * spendSpan + jitter2);
        }
      } else {
        // Contrasting segment: either strictly bargain or outlier
        const tier = i % 2;
        if (tier === 0) {
          budgetMin = Math.max(0, Math.round(spendMin * 0.5 + jitter1));
          budgetMax = Math.round(spendMin + 0.3 * spendSpan + jitter2);
        } else {
          budgetMin = Math.round(spendMin + 0.5 * spendSpan + jitter1);
          budgetMax = Math.round(spendMax * 1.5 + jitter2);
        }
      }

      budgetMin = Math.max(0, budgetMin);
      if (budgetMax <= budgetMin) {
        budgetMax = budgetMin + Math.max(5, Math.round(spendSpan * 0.15) || 5);
      }

      // Stride-based varied trait assembly using co-prime offsets for combinatorial uniqueness
      let useCaseIdx = (i * 3 + Math.floor(prng() * 3)) % traits.use_cases.length;
      let constraintIdx = (i * 5 + 1) % traits.constraints.length;
      let priorityIdx = (i * 7 + 2) % traits.priorities.length;
      const accessModeIdx = (i + marketIndex) % traits.access_modes.length;

      let selectedUseCase = traits.use_cases[useCaseIdx];
      let selectedConstraints = traits.constraints[constraintIdx];
      let selectedPriorities = traits.priorities[priorityIdx];
      const accessMode = traits.access_modes[accessModeIdx];

      // Guarantee meaningful attribute combination uniqueness across the panel
      let signature = `${segment}::${market}::${selectedUseCase}::${selectedConstraints.join('|')}::${selectedPriorities.join('|')}`;
      let attempt = 0;
      while (attributeSignatures.has(signature) && attempt < 100) {
        attempt++;
        const nextUseCaseIdx = (useCaseIdx + Math.floor(attempt / 3)) % traits.use_cases.length;
        const nextConstraintIdx = (constraintIdx + attempt) % traits.constraints.length;
        const nextPriorityIdx = (priorityIdx + attempt * 2) % traits.priorities.length;
        selectedUseCase = traits.use_cases[nextUseCaseIdx];
        selectedConstraints = traits.constraints[nextConstraintIdx];
        selectedPriorities = traits.priorities[nextPriorityIdx];
        signature = `${segment}::${market}::${selectedUseCase}::${selectedConstraints.join('|')}::${selectedPriorities.join('|')}`;
      }
      if (attributeSignatures.has(signature)) throw new Error('Unable to create distinct panel profiles');
      attributeSignatures.add(signature);

      profiles.push({
        id,
        test_id: testId,
        segment,
        market,
        budget_min: budgetMin,
        budget_max: budgetMax,
        use_case: selectedUseCase,
        constraints: selectedConstraints,
        priorities: selectedPriorities,
        access_mode: accessMode,
        created_at: createdAt
      });
    }
  }

  return profiles;
}
