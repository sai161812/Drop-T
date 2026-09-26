import { getDatabase } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { generatePanelProfiles } from '../simulation/profileGenerator.js';
import { TestRepository } from './testRepository.js';

export function seedDemoLabRuns(): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  // 1. Ensure Product 1 (Organic Hemp Summer Tee) is linked to a completed test
  const p1 = db.prepare('SELECT * FROM products WHERE name = ?').get('Organic Hemp Everyday Summer Tee') as any;
  if (p1) {
    const existingP1Test = db.prepare('SELECT id FROM tests WHERE product_id = ?').get(p1.id) as any;
    if (!existingP1Test) {
      // Find a completed hemp test to link, or assign 5efb4565
      const candidateTest = db.prepare("SELECT id FROM tests WHERE title LIKE '%Hemp%' ORDER BY created_at DESC LIMIT 1").get() as any;
      const testIdToLink = candidateTest?.id || '5efb4565-c38c-4b15-b39b-ac5b8d82a9a8';
      db.prepare('UPDATE tests SET product_id = ?, title = ? WHERE id = ?').run(
        p1.id,
        'Organic Hemp Everyday Summer Tee — Synthetic Review',
        testIdToLink
      );
      console.log(`  ✓ Linked completed 50-persona test to Product 1 (${p1.name})`);
    } else {
      console.log(`  ✓ Product 1 already has linked lab test: ${existingP1Test.id}`);
    }
  }

  // 2. Ensure Product 2 (Artisanal Cold Brew Press) is linked to a completed test
  const p2 = db.prepare('SELECT * FROM products WHERE name = ?').get('Artisanal Cold Brew Press & Ceramic Tumbler') as any;
  if (p2) {
    const existingP2Test = db.prepare('SELECT id FROM tests WHERE product_id = ?').get(p2.id) as any;
    if (!existingP2Test) {
      const testId = uuidv4();
      const feedbackToken = randomBytes(24).toString('hex');
      const seed = 88888;
      const title = 'Artisanal Cold Brew Press & Ceramic Tumbler — Synthetic Review';

      // Insert Test
      db.prepare(`
        INSERT INTO tests (id, title, domain_id, feedback_token, product_id, created_at, updated_at, status, panel_seed)
        VALUES (?, ?, 'other', ?, ?, ?, ?, 'draft', ?)
      `).run(testId, title, feedbackToken, p2.id, now, now, seed);

      // Insert Offering
      const offeringId = uuidv4();
      const offeringSnapshot = {
        item_name: p2.name,
        specification_text: p2.summary,
        _product_snapshot: p2
      };
      db.prepare(`
        INSERT INTO offerings (id, test_id, short_value_prop, description, currency, period, domain_specific_data, created_at, updated_at, sales_scenarios)
        VALUES (?, ?, ?, ?, 'INR', 'launch_batch', ?, ?, ?, ?)
      `).run(
        offeringId,
        testId,
        'Compact immersion cold-brew extraction flask paired with ceramic travel tumbler',
        p2.summary,
        JSON.stringify(offeringSnapshot),
        now,
        now,
        JSON.stringify({ lower_units: 50, central_units: 120, higher_units: 200 })
      );

      // Insert Option A
      const servedMarkets = ['Bangalore', 'Mumbai', 'Pune'];
      db.prepare(`
        INSERT INTO options (id, test_id, name, price, primary_message, served_markets, fulfillment_mode, images, variable_cost_per_sale, fixed_launch_cost, capacity_units, created_at, updated_at)
        VALUES ('A', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testId,
        'Artisanal Cold Brew Press & Ceramic Tumbler Kit',
        1499,
        'Café-grade smooth cold brew steeped overnight at home without mess',
        JSON.stringify(servedMarkets),
        'Express Courier (2-3 business days)',
        p2.images || '[]',
        650,
        25000,
        250,
        now,
        now
      );

      // Insert Audience Config
      const audienceMarkets = ['Bangalore', 'Mumbai', 'Pune', 'Delhi NCR'];
      db.prepare(`
        INSERT INTO audience_configs (id, test_id, intended_buyer_description, adjacent_buyer_description, expected_spend_min, expected_spend_max, audience_markets, panel_size, intended_count, adjacent_count, contrasting_count, comparison_lever, created_at, updated_at)
        VALUES (?, ?, ?, ?, 800, 2500, ?, 50, 20, 20, 10, 'price', ?, ?)
      `).run(
        uuidv4(),
        testId,
        'Specialty coffee hobbyists and remote professionals in metro cities',
        'Gift buyers and casual iced tea or beverage consumers',
        JSON.stringify(audienceMarkets),
        now,
        now
      );

      // Generate 50 Reproducible Profiles
      const profiles = generatePanelProfiles({
        testId,
        domainId: 'other',
        intendedBuyerDescription: 'Specialty coffee hobbyists and remote professionals in metro cities',
        adjacentBuyerDescription: 'Gift buyers and casual iced tea or beverage consumers',
        expectedSpendMin: 800,
        expectedSpendMax: 2500,
        audienceMarkets,
        seed
      });
      TestRepository.saveProfiles(testId, profiles);

      // Competitor references attached
      const references = [
        {
          id: 'ref-brew-1',
          url: 'https://hario-usa.com/products/mizudashi-cold-brew-coffee-pot',
          name: 'Hario Mizudashi Cold Brew Pot (1000ml)',
          price_point: '₹1,899',
          key_difference: 'Glass carafe with plastic mesh filter; fragile and not travel-friendly',
          selected: true
        },
        {
          id: 'ref-brew-2',
          url: 'https://aeropress.com/products/aeropress-original',
          name: 'AeroPress Original Coffee Maker',
          price_point: '₹3,499',
          key_difference: 'Fast pressure extraction but requires disposable paper filters and separate tumbler',
          selected: true
        },
        {
          id: 'ref-brew-3',
          url: 'https://fellowproducts.com/products/carter-move-mug',
          name: 'Fellow Carter Move Tumbler (16oz)',
          price_point: '₹2,799',
          key_difference: 'Premium ceramic travel tumbler but lacks integrated immersion cold brew steeping basket',
          selected: true
        }
      ];

      // Insert Run
      const runId = uuidv4();
      const fullTest = TestRepository.getById(testId)!;
      const snapshot = {
        mode: 'single',
        product_id: p2.id,
        research_status: 'completed',
        test: fullTest,
        profiles,
        references,
        selected_reference_ids: references.map(r => r.id),
        reference_summary: 'Compared against 3 leading specialty coffee benchmarks (Hario Mizudashi, AeroPress, Fellow Carter Tumbler).'
      };

      db.prepare(`
        INSERT INTO runs (id, test_id, status, primary_lever, profile_seed, model_id, mode, created_at, completed_at, total_evaluations_expected, total_evaluations_completed, snapshot)
        VALUES (?, ?, 'completed', 'price', ?, 'qwen/qwen3.8-27b', 'single', ?, ?, 50, 50, ?)
      `).run(runId, testId, seed, now, now, JSON.stringify(snapshot));

      // Generate 50 Structured Evaluations
      const evaluations: any[] = [];
      for (const p of profiles) {
        const isOutsideMarket = p.market === 'Delhi NCR';

        if (isOutsideMarket) {
          evaluations.push({
            id: uuidv4(),
            run_id: runId,
            test_id: testId,
            profile_id: p.id,
            option_id: 'A',
            access_status: 'unserved',
            response: 'unavailable',
            reason: 'Market "Delhi NCR" is outside served shipping markets (Bangalore, Mumbai, Pune).',
            primary_objection: 'Outside served markets',
            factor_tags: ['access'],
            referenced_fields: ['served_markets'],
            source_ids: []
          });
        } else if (p.segment === 'intended') {
          const budgetFits = p.budget_max >= 1499;
          evaluations.push({
            id: uuidv4(),
            run_id: runId,
            test_id: testId,
            profile_id: p.id,
            option_id: 'A',
            access_status: 'served',
            response: budgetFits ? 'interested' : 'unsure',
            reason: budgetFits
              ? 'Impressed by the dual immersion flask + ceramic tumbler combo at ₹1,499 compared to buying an AeroPress (₹3,499) and Fellow mug (₹2,799) separately.'
              : 'Appealing design and cork grip, but ₹1,499 stretches my monthly coffee accessory budget slightly.',
            primary_objection: budgetFits ? null : 'Price is slightly above monthly accessory budget',
            factor_tags: budgetFits ? ['fit', 'creative'] : ['price'],
            referenced_fields: ['price', 'budget_range', 'message'],
            source_ids: ['ref-brew-1', 'ref-brew-2']
          });
        } else if (p.segment === 'adjacent') {
          evaluations.push({
            id: uuidv4(),
            run_id: runId,
            test_id: testId,
            profile_id: p.id,
            option_id: 'A',
            access_status: 'served',
            response: 'unsure',
            reason: 'Looks high quality for home coffee or tea, but wondering about dishwasher safety and cork durability.',
            primary_objection: 'Needs long-term durability and maintenance clarity for cork sleeve',
            factor_tags: ['fit', 'price'],
            referenced_fields: ['description', 'constraints'],
            source_ids: ['ref-brew-3']
          });
        } else {
          // contrasting
          evaluations.push({
            id: uuidv4(),
            run_id: runId,
            test_id: testId,
            profile_id: p.id,
            option_id: 'A',
            access_status: 'served',
            response: 'not_interested',
            reason: 'Prefers commercial instant coffee or local cafés; ₹1,499 manual immersion hardware is unnecessary complexity.',
            primary_objection: 'Prefers convenience of instant coffee or local espresso bars',
            factor_tags: ['fit'],
            referenced_fields: ['short_value_prop', 'priorities'],
            source_ids: []
          });
        }
      }

      TestRepository.saveEvaluations(evaluations);
      console.log(`  ✓ Created & seeded completed 50-persona test for Product 2 (${p2.name})`);
    } else {
      console.log(`  ✓ Product 2 already has linked lab test: ${existingP2Test.id}`);
    }
  }
}
