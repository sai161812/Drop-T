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

// Domain traits matrices
interface DomainTraitMatrix {
  intended: {
    use_cases: string[];
    constraints: string[][];
    priorities: string[][];
    access_modes: string[];
  };
  adjacent: {
    use_cases: string[];
    constraints: string[][];
    priorities: string[][];
    access_modes: string[];
  };
  contrasting: {
    use_cases: string[];
    constraints: string[][];
    priorities: string[][];
    access_modes: string[];
  };
}

const DOMAIN_TRAITS: Record<DomainId, DomainTraitMatrix> = {
  clothing_accessories: {
    intended: {
      use_cases: [
        'Daily warm-weather office and smart casual wear',
        'Minimalist capsule wardrobe everyday staple',
        'Breathable work-from-home and travel apparel',
        'Sustainable natural-fiber replacement for synthetic shirts',
        'Hot-climate weekend cafe and social wear',
        'Durable timeless linen everyday workwear',
        'Eco-conscious wardrobe foundation for warm seasons',
        'Lightweight layering for warm climate commute'
      ],
      constraints: [
        ['Requires accurate size measurements', 'Prefers straightforward return exchange policy'],
        ['Sensitive to fabric stiffness or coarse weave', 'Requires easy home machine laundering'],
        ['Prefers pre-shrunk fabric to avoid shrinkage', 'Must fit relaxed over shoulders'],
        ['Values eco-friendly packaging', 'Limited tolerance for synthetic blend impurities'],
        ['Prefers neutral colorways', 'Needs clear wash care guide'],
        ['Requires dependable shipping timeline', 'Prefers discreet label branding'],
        ['Must resist color fading across wash cycles', 'Prefers breathable collar structure'],
        ['Needs wrinkle-release steam tolerance', 'Prefers plastic-free dispatch box']
      ],
      priorities: [
        ['100% natural organic fabric quality', 'Breathability in hot humid climates'],
        ['Durability and neat button stitch craftsmanship', 'Neutral minimalist aesthetic'],
        ['Soft hand-feel against skin', 'Transparent manufacturing origin'],
        ['Wrinkle drape and breathability', 'Reliable standard shipping'],
        ['Consistent chest and shoulder sizing', 'Eco-friendly non-toxic dye certification'],
        ['Versatile styling across work and weekend', 'Fair-trade maker compensation'],
        ['Long-term fabric longevity', 'Honest transparent pricing'],
        ['Neat internal seam finishing', 'Minimal carbon footprint in transit']
      ],
      access_modes: ['Postal delivery', 'Standard shipping', 'Direct parcel', 'Tracked courier']
    },
    adjacent: {
      use_cases: [
        'Thoughtful sustainable birthday / holiday gift for a colleague',
        'Weekend leisure and resort / beach vacation wear',
        'Occasional summer wedding or outdoor garden event outfit',
        'Eco-conscious university graduate starting first professional job',
        'Seasonal wardrobe refresh for warm spring holidays',
        'High-quality gift for a partner valuing organic fabrics',
        'Smart-casual Friday wear for hybrid consulting',
        'Breathable travel shirt for extended overseas trip'
      ],
      constraints: [
        ['Strict budget limit', 'Requires gift packaging presentation'],
        ['Infrequent linen wearer needing clear wash care instructions', 'Needs versatile styling with jeans or chinos'],
        ['Unsure about sizing when buying for someone else', 'Needs reliable estimated dispatch timeline'],
        ['Values return flexibility if fit does not suit', 'Prefers classic versatile colorways'],
        ['Needs expedited delivery window for upcoming date', 'Prefers hassle-free size exchange'],
        ['Budget conscious relative to mainstream retail brands', 'Requires gift note inclusion'],
        ['Limited experience with pure linen care', 'Prefers pre-washed soft texture out of box'],
        ['Requires verified courier tracking', 'Needs universal fit sizing guidance']
      ],
      priorities: [
        ['Gift-worthy presentation box', 'Versatile multi-occasion styling'],
        ['Affordability without synthetic polyester look', 'Brand reputation for ethical craft'],
        ['Comfortable lightweight feel', 'Clear visual size chart'],
        ['Aesthetic craft appeal', 'Speedy delivery confirmation'],
        ['Easy pairing with existing trousers', 'Positive buyer reviews on longevity'],
        ['Presentation elegance', 'Smooth responsive customer support'],
        ['Value for money compared to mall luxury brands', 'Clear dispatch timeline'],
        ['Versatility for casual and semi-formal wear', 'Secure payment options']
      ],
      access_modes: ['Postal delivery', 'Standard shipping', 'Gift dispatch', 'Tracked parcel']
    },
    contrasting: {
      use_cases: [
        'Looking for ultra-cheap high-frequency fast fashion shirts',
        'Requires heavy wrinkle-free polyester athletic gym apparel',
        'Prefers heavily branded graphic street apparel with bold logos',
        'Prefers dry-clean only tailored formal business suits',
        'Wants $10 disposable event t-shirts',
        'Prefers heavy waterproof synthetic outerwear',
        'Seeking high-compression synthetic athletic performance tops',
        'Prefers loud neon designer branded clubwear'
      ],
      constraints: [
        ['Dislikes linen wrinkle texture', 'Strictly unwilling to spend on organic certifications'],
        ['Prefers stretch spandex or synthetic moisture-wicking materials', 'Averse to neutral earth tones'],
        ['Accustomed to sub-$10 marketplace bargain pricing', 'Dislikes subtle minimalist styling'],
        ['Requires immediate same-day local retail store try-on', 'Prefers iron-free synthetic blends'],
        ['Demands rigid non-wrinkling synthetic fibers', 'Zero interest in sustainability claims'],
        ['Prefers huge printed graphic chest logos', 'Unwilling to pay standard handcrafted premium'],
        ['Requires commercial mall chain availability', 'Dislikes unlined natural weave feel'],
        ['Prefers ultra-thick synthetic double-knit', 'Rejects hand-wash or gentle cycle garments']
      ],
      priorities: [
        ['Lowest possible unit purchase price', 'Zero wrinkle maintenance'],
        ['Prominent brand logo visibility', 'High stretch / synthetic feel'],
        ['Immediate mall availability', 'Heavy fabric structure'],
        ['Bargain bulk multi-packs', 'Machine dryer friendly without care'],
        ['Maximum synthetic stretch recovery', 'Loud visible brand badges'],
        ['Dirt cheap clearance discount pricing', 'Wrinkle-free stiff formal look'],
        ['Extreme stain-resistant synthetic coating', 'Immediate cash-on-delivery pickup'],
        ['Disposable single-season utility', 'Sub-$15 bulk pricing']
      ],
      access_modes: ['Retail pickup', 'Standard shipping', 'Supermarket rack', 'Discount outlet']
    }
  },

  local_food_beverages: {
    intended: {
      use_cases: [
        'Daily morning chilled iced coffee before remote work meetings',
        'Afternoon specialty pick-me-up beverage for focus',
        'Stocking home refrigerator with fresh small-batch weekly concentrate',
        'Clean zero-sugar morning caffeine routine',
        'Post-workout clean energizer beverage',
        'Weekday artisanal coffee ritual without espresso machine hassle',
        'High-productivity morning brew for creative studio team',
        'Weekly curated specialty single-origin batch subscription'
      ],
      constraints: [
        ['Requires refrigeration within 2 hours of receipt', 'Weekend-only morning receiving window'],
        ['Sensitive to harsh coffee acidity or excessive bitterness', 'Consumes bottle within 7-day shelf life'],
        ['Prefers glass bottle packaging over single-use plastic', 'Needs clear dilution guide'],
        ['Must be reliably fresh and delivered cold', 'Prefers contactless morning doorstep drop'],
        ['Requires morning delivery before 8:00 AM', 'Allergic to artificial preservatives or flavorings'],
        ['Needs consistent roast profile week-to-week', 'Prefers returnable bottle deposit system'],
        ['Limited refrigerator door space', 'Requires clear brew date stamped on label'],
        ['Prefers low-acidity cold steep technique', 'Requires dependable recurring weekly schedule']
      ],
      priorities: [
        ['Smooth single-origin flavor notes (hazelnut/chocolate)', 'Low acidity and natural sweetness'],
        ['Fresh brew date transparency', 'Chilled doorstep morning delivery reliability'],
        ['Concentrate yield (6+ glasses per bottle)', 'Zero added preservatives or refined sugars'],
        ['Local roaster craft quality', 'Convenient weekly refill schedule'],
        ['Roast date freshness within 48h', 'Glass bottle sustainability'],
        ['Aromatic body without dairy masking', 'Dependable recurring delivery'],
        ['Clear dilution ratio recommendations', 'Direct ethical farm bean sourcing'],
        ['Rich chocolate undertones', 'Consistent cold brew extraction strength']
      ],
      access_modes: ['Chilled doorstep delivery', 'Neighborhood cafe pickup', 'Local drop', 'Morning courier']
    },
    adjacent: {
      use_cases: [
        'Weekend brunch beverage host for visiting friends',
        'Clean pre-workout energizer for morning gym sessions',
        'Artisan treat for Sunday home bakery breakfast',
        'Office team shared specialty cold brew treat on Fridays',
        'Monthly social gathering cold cocktail mixer',
        'Occasional specialty coffee indulgence on quiet Sundays',
        'Afternoon dessert pairing with fresh pastries',
        'Gourmet culinary gift for a foodie friend'
      ],
      constraints: [
        ['Infrequent weekly drinker needing smaller portions', 'Budget conscious compared to standard tea'],
        ['Requires cafe pickup near weekend transit route', 'Needs versatile pairing with oat milk and dairy'],
        ['Needs advance order reminder', 'Prefers tamper-evident sealed cap'],
        ['Limited refrigerator door space', 'Shares bottle with non-coffee enthusiasts'],
        ['Prefers easy single-serving bottles over concentrates', 'Needs simple recipe card for mixing'],
        ['Requires weekend afternoon pickup slot', 'Wants 14-day refrigerated shelf life'],
        ['Budget sensitive for non-daily beverage luxury', 'Needs clear dairy/vegan pairing guide'],
        ['Needs easy transport to picnic or friend’s dinner', 'Prefers leakproof twist cap']
      ],
      priorities: [
        ['Versatility when mixing with milk or tonic', 'Aesthetic bottle design on dining table'],
        ['Clear caffeine potency indication', 'Affordable per-serving cost'],
        ['Convenient neighborhood pickup counter', 'Friendly local artisan service'],
        ['Good balance with sweet pastries', 'Clear expiration date'],
        ['Accessible non-bitter flavor for casual drinkers', 'Eye-catching label aesthetic'],
        ['Convenient weekend collection window', 'Fair per-bottle pricing'],
        ['Smooth taste with plant milk', 'Clear step-by-step dilution instructions'],
        ['Fresh artisan branding story', 'Easy bottle recapping']
      ],
      access_modes: ['Neighborhood cafe pickup', 'Local delivery', 'Weekend market counter', 'Doorstep drop']
    },
    contrasting: {
      use_cases: [
        'Prefers hot sweet instant chicory coffee from supermarket pouches',
        'Drinks pre-packaged high-sugar energy drinks or canned soda',
        'Prefers commercial drive-thru flavored sugary caramel frappuccinos',
        'Strictly tea or herbal infusion drinker',
        'Wants $0.20 instant vending machine hot coffee',
        'Consumes synthetic pre-workout taurine caffeine powder',
        'Prefers 12-month shelf-stable commercial canned coffee',
        'Strictly avoids caffeine entirely'
      ],
      constraints: [
        ['Averse to black cold brew flavor profile', 'Unwilling to pay specialty micro-batch premium'],
        ['Lacks refrigerator storage', 'Prefers hot boiled beverages only'],
        ['Dislikes waiting for scheduled local delivery windows', 'Wants sweetened dairy premixes'],
        ['Accustomed to ₹10 instant sachet pricing', 'Prefers commercial shelf-stable cans'],
        ['Refuses to pay more than $1.00 for a cup of coffee', 'Demands heavy added sugar and condensed milk'],
        ['Averse to unpasteurized short shelf-life items', 'Requires nationwide gas station availability'],
        ['Dislikes earthy or specialty fruity coffee acidity', 'Prefers instant powder boiling mug prep'],
        ['Demands artificial vanilla caramel syrups', 'Zero tolerance for premium pricing']
      ],
      priorities: [
        ['Lowest possible price per cup', 'Instant boiling water preparation'],
        ['High sugar / dairy sweetness', 'Unlimited pantry shelf life'],
        ['Everyday corner store availability', 'Heavy chicory milk strength'],
        ['Familiar commercial brand taste', 'Zero refrigeration requirements'],
        ['Maximum sugar syrup content', 'Instant single-serve sachet convenience'],
        ['Sub-$0.50 per serving cost', 'Heavy commercial artificial flavorings'],
        ['Drive-thru instant service speed', 'Ambient pantry storage'],
        ['Everyday supermarket bargain multi-pack', 'Zero brewing equipment required']
      ],
      access_modes: ['Supermarket purchase', 'Corner pickup', 'Vending kiosk', 'Gas station market']
    }
  },

  digital_products_services: {
    intended: {
      use_cases: [
        'Automating weekly client receipt & vendor PDF extraction into Google Sheets',
        'Eliminating manual data entry for 20+ monthly supplier tax invoices',
        'Exporting structured line-item CSV files for accounting software import',
        'Solo agency founder streamlining monthly bookkeeping',
        'Freelance consultant organizing monthly business travel expense reports',
        'E-commerce shop owner matching vendor invoices with warehouse receipts',
        'Small architecture practice digitizing subcontractor expense invoices',
        'Digital agency lead converting PDF invoices into tidy client spreadsheets'
      ],
      constraints: [
        ['Must support local invoice/tax formats (e.g. GST/VAT/Sales Tax)', 'Zero tolerance for column misalignments'],
        ['Requires simple browser or spreadsheet export without complex API coding', 'Needs reliable 24h support response'],
        ['Limited time to learn complex enterprise tools', 'Requires secure handling of financial data'],
        ['Prefers flexible monthly billing without lock-in', 'Must handle scanned PDF images'],
        ['Requires accurate currency and date parsing', 'Needs 1-click Google Drive / Dropbox sync'],
        ['Must preserve multi-page invoice line items', 'Requires clear monthly usage quota tracking'],
        ['Budget sensitive if charged per seat', 'Must work smoothly on Chrome and Mac/Windows'],
        ['Requires privacy guarantee against data reselling', 'Needs instant CSV spreadsheet download']
      ],
      priorities: [
        ['High OCR/parsing accuracy on diverse invoice layouts', 'Fast 1-click spreadsheet export'],
        ['Simple clean dashboard interface', 'Reasonable monthly subscription price'],
        ['Data privacy and no selling of invoice data', 'Multi-currency and tax breakdown detection'],
        ['Time saved (5+ hours per month)', 'Responsive email support'],
        ['Clean line-item table parsing without manual fixes', 'Transparent monthly plan pricing'],
        ['Quick 5-minute setup without developer assistance', 'Accurate tax and total calculation'],
        ['Clean downloadable audit history', 'Reliable cloud uptime and fast document processing'],
        ['Intuitive self-service export options', 'Clear privacy & security documentation']
      ],
      access_modes: ['Web application', 'Cloud dashboard', 'Browser extension', 'Web portal']
    },
    adjacent: {
      use_cases: [
        'Freelance bookkeeper managing invoices for 3 small business clients',
        'Virtual assistant organizing monthly expense receipts for executives',
        'Operations lead archiving vendor software subscription receipts',
        'E-commerce shop owner reconciling monthly courier invoices',
        'Property manager scanning repair bills for multiple rental properties',
        'Event organizer compiling vendor invoices for seasonal festivals',
        'Community manager tracking monthly grant and sponsorship receipts',
        'Part-time contractor preparing annual tax deduction backup files'
      ],
      constraints: [
        ['Needs multi-client workspace separation', 'Budget sensitive if billed per user seat'],
        ['Needs batch export of 50+ files at once', 'Requires CSV and PDF download bundle'],
        ['Needs simple shareable client reports', 'Prefers flat rate over per-page metered pricing'],
        ['Occasional irregular monthly invoice volume', 'Needs simple user onboarding'],
        ['Prefers pay-as-you-go credit bundle over recurring fee', 'Requires client-ready PDF summaries'],
        ['Needs simple multi-folder organization', 'Requires fast drag-and-drop batch upload'],
        ['Non-technical user needing zero-configuration interface', 'Needs email-in invoice forwarding'],
        ['Budget limited to modest monthly spend', 'Needs simple receipt search by date']
      ],
      priorities: [
        ['Batch multi-file upload speed', 'Affordable plan for low-to-medium volumes'],
        ['Accurate total and line-item extraction', 'Quick export to Excel / Sheets'],
        ['Intuitive interface for non-technical users', 'Reliable uptime'],
        ['Organized search and archive history', 'Clear documentation'],
        ['Flexible pricing without long annual lock-in', 'Client-shareable report generation'],
        ['Fast upload processing time', 'Simple receipt tagging and categorization'],
        ['Straightforward export templates', 'Responsive self-service help docs'],
        ['Affordable entry tier pricing', 'Easy account cancellation if volume slows']
      ],
      access_modes: ['Web application', 'Cloud dashboard', 'Web portal', 'Email ingestion']
    },
    contrasting: {
      use_cases: [
        'Enterprise IT seeking SAP / Oracle NetSuite ERP multi-entity connector with SSO',
        'Individual with 1 personal receipt every two months needing a free app',
        'Developer wanting raw open-source Python OCR CLI tool to host on local server',
        'Corporation requiring on-premise air-gapped server installation with SLA',
        'Student seeking free unlimited homework scanner',
        'Large enterprise bank requiring SOC-2 Type II audit report and custom contract',
        'Linux developer demanding CLI-only terminal utility with zero web UI',
        'Mass automated scraper parsing millions of public PDF tables daily'
      ],
      constraints: [
        ['Mandatory SOC-2 / enterprise compliance certification', 'Refuses cloud SaaS without custom DPA'],
        ['Zero budget for business software tools', 'Requires command-line Linux scriptability'],
        ['Requires custom bespoke ERP integration workflows', 'Unwilling to use web browser interface'],
        ['Expects 24/7 dedicated enterprise phone account manager', 'Requires thousands of documents daily'],
        ['Zero willingness to pay recurring SaaS subscription', 'Requires offline local machine processing'],
        ['Demands on-premise Kubernetes Helm chart deployment', 'Refuses multi-tenant cloud architectures'],
        ['Demands custom enterprise MSA legal terms', 'Requires bespoke custom training for internal ERP codes'],
        ['Expects 100% free open-source GitHub repository', 'Refuses any cloud API token requirement']
      ],
      priorities: [
        ['Enterprise single sign-on (SAML/Okta)', 'On-premise deployment capability'],
        ['Zero recurring cost / 100% free open-source', 'Full source code access'],
        ['Custom ERP API webhooks', 'Dedicated enterprise account rep'],
        ['Air-gapped security isolation', 'Unlimited enterprise volume'],
        ['Custom on-premise compliance audit', 'Zero cloud third-party vendor dependency'],
        ['Free open-source MIT license', 'Terminal CLI pipe support'],
        ['Bespoke SLA guarantee (99.99%)', 'Custom multi-million document batch engine'],
        ['Offline data sovereignty', 'Zero web subscription commitments']
      ],
      access_modes: ['On-premise API', 'Enterprise portal', 'CLI', 'Self-hosted Docker']
    }
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
    const traits = domainTraits[segment];

    for (let i = 0; i < count; i++) {
      const id = `prof_${profileIndex.toString().padStart(2, '0')}`;
      profileIndex++;

      // Stratified market allocation: cycle evenly through configured audience markets with deterministic jitter
      const marketIndex = (i + Math.floor(prng() * audienceMarkets.length)) % audienceMarkets.length;
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
