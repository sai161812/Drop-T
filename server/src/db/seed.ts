import { initDatabase, getDatabase } from './database.js';
import { AuthRepository } from './authRepository.js';
import { ProductRepository } from './productRepository.js';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_ACCOUNTS } from '@droptest/shared';

export const seedDemoData = runSeed;

export function runSeed(): void {
  initDatabase();

  const db = getDatabase();
  const now = new Date().toISOString();

  console.log('🌱 Starting idempotent seed...');

  // 1. Ensure 4 Accounts exist
  const userMap: Record<string, any> = {};

  for (const acc of DEMO_ACCOUNTS) {
    let user: any = AuthRepository.getUserByEmail(acc.email);
    if (!user) {
      try {
        user = AuthRepository.createUser(acc);
        console.log(`  ✓ Created account: ${acc.email} (${acc.role})`);
      } catch {
        user = AuthRepository.getUserByEmail(acc.email);
      }
    } else {
      console.log(`  ✓ Account already exists: ${acc.email} (${acc.role})`);
    }
    userMap[acc.email] = user;
  }

  // 2. Ensure 2 Realistic Products exist
  const founderA = userMap['founder.a@droptest.local'];
  const founderB = userMap['founder.b@droptest.local'];
  const shopper = userMap['shopper@droptest.local'];
  const sponsor = userMap['sponsor@droptest.local'];

  if (!founderA || !founderB || !shopper || !sponsor) {
    console.warn('Seed accounts incomplete, skipping product creation');
    return;
  }

  // Product 1: T-Shirt (Startup A)
  const p1Name = 'Organic Hemp Everyday Summer Tee';
  let product1 = db.prepare('SELECT * FROM products WHERE owner_id = ? AND name = ?').get(founderA.id, p1Name) as any;
  if (!product1) {
    try {
      product1 = ProductRepository.create(founderA.id, {
        name: p1Name,
        category: 'clothing_accessories',
        stage: 'preparing_to_launch',
        status: 'published',
        summary: 'Ultra-breathable 100% organic Himalayan hemp tee tailored for hot and humid Indian summers with natural antimicrobial and anti-odor properties.',
        intended_buyer: 'Eco-conscious young urban professionals aged 22-35 living in Bangalore, Mumbai, and Delhi looking for durable sustainable everyday casualwear.',
        feedback_question: 'Would you prefer a relaxed regular fit or an athletic slim fit for daily wear?',
        price: 999,
        currency: 'INR',
        availability_markets: ['Bangalore', 'Mumbai', 'Delhi NCR'],
        fulfillment_mode: 'Standard courier delivery',
        category_data: {
          item_type: 'T-Shirt',
          material: '100% Organic Himalayan Hemp',
          fit: 'Relaxed Regular Fit',
          sizes: ['S', 'M', 'L', 'XL']
        },
        images: [
          {
            id: uuidv4(),
            filename: 'hemp_summer_tee.jpg',
            url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            mime_type: 'image/jpeg',
            size_bytes: 142800,
            confirmed_visual_description: 'Sage green crewneck organic hemp t-shirt displayed against natural linen background'
          }
        ]
      });
      console.log(`  ✓ Created & published Product 1: "${p1Name}" (Startup A)`);
    } catch {
      product1 = db.prepare('SELECT * FROM products WHERE owner_id = ? AND name = ?').get(founderA.id, p1Name) as any;
    }
  } else {
    console.log(`  ✓ Product 1 already exists: "${p1Name}"`);
  }

  // Product 2: Brew Press is equipment, not a food/beverage item.
  const p2Name = 'Artisanal Cold Brew Press & Ceramic Tumbler';
  let product2 = db.prepare('SELECT * FROM products WHERE owner_id = ? AND name = ?').get(founderB.id, p2Name) as any;
  if (!product2) {
    try {
      product2 = ProductRepository.create(founderB.id, {
        name: p2Name,
        category: 'other',
        stage: 'prototype',
        status: 'published',
        summary: 'Compact immersion cold-brew extraction flask paired with a double-walled ceramic travel tumbler featuring natural cork insulation grip.',
        intended_buyer: 'Specialty coffee hobbyists and remote professionals in metro cities who want café-grade cold brew at home without complex bulky equipment.',
        feedback_question: 'What brew capacity do you prioritize for your daily routine (500ml vs 1000ml)?',
        price: 1499,
        currency: 'INR',
        availability_markets: ['Bangalore', 'Mumbai', 'Pune'],
        fulfillment_mode: 'Express Courier (2-3 business days)',
        category_data: {
          specification_text: 'Cold-brew immersion press and double-walled ceramic travel tumbler with cork grip; intended for reusable home and travel coffee preparation.'
        },
        images: [
          {
            id: uuidv4(),
            filename: 'cold_brew_press.jpg',
            url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
            mime_type: 'image/jpeg',
            size_bytes: 198400,
            confirmed_visual_description: 'Matte black double-walled ceramic tumbler with raw cork band next to cold brew glass carafe'
          }
        ]
      });
      console.log(`  ✓ Created & published Product 2: "${p2Name}" (Startup B)`);
    } catch {
      product2 = db.prepare('SELECT * FROM products WHERE owner_id = ? AND name = ?').get(founderB.id, p2Name) as any;
    }
  } else {
    // Correct only the original demo fixture signature. This avoids reclassifying
    // an edited product and does not modify its engagement or linked lab data.
    try {
      const existing = ProductRepository.getById(product2.id);
      const oldDetails = existing?.category_data || {};
      if (existing?.category === 'local_food_beverages' && oldDetails.shelf_life === 'Permanent brewware' && oldDetails.storage_temp === 'Ambient temperature') {
        ProductRepository.update(existing.id, founderB.id, {
          category: 'other',
          category_data: { specification_text: `${existing.summary} Previous product details: ${JSON.stringify(oldDetails)}` }
        });
      }
    } catch { /* Leave an unrecognized or edited legacy fixture untouched. */ }
    console.log(`  ✓ Product 2 already exists: "${p2Name}"`);
  }

  // Community interactions are deliberately not seeded. Seed accounts and
  // products only, so startup never rewrites real saves, responses, or offers.
  console.log('Demo accounts and products are ready; live engagement was preserved.');
  return;

  // Historical engagement fixture block retained below only as migration-era
  // context; unreachable and never applied to current data.
  if (product1) {
    try {
      // Shopper saves and gives feedback on Product 1
      ProductRepository.toggleSave(shopper.id, product1.id, true);
      ProductRepository.upsertFeedback(shopper.id, product1.id, {
        choice: 'yes',
        factor: 'price',
        reason: '[SEEDED DEMO] Love the sustainable material, ₹999 price point is very competitive for pure hemp.'
      });

      // Sponsor offers support on Product 1
      ProductRepository.upsertSupportProposal(sponsor.id, product1.id, {
        amount: 500,
        currency: 'INR',
        message: '[SEEDED DEMO] Love the sustainable apparel focus. Excited to offer initial backing for your launch batch.'
      });

      // Startup B founder saves and gives feedback on Product 1
      ProductRepository.toggleSave(founderB.id, product1.id, true);
      ProductRepository.upsertFeedback(founderB.id, product1.id, {
        choice: 'maybe',
        factor: 'quality_details',
        reason: '[SEEDED DEMO] Great initiative! Would love to see fabric GSM specs for durability.'
      });
    } catch (e) {
      // Ignore conflict on parallel runs
    }
  }

  console.log('✅ Idempotent seed completed successfully!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
