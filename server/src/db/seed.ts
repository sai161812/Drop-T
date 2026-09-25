import { getDatabase } from './database.js';
import { AuthRepository } from './authRepository.js';
import { ProductRepository } from './productRepository.js';

export function seedDemoData(): void {
  const db = getDatabase();

  // 1. Seed Demo Users
  const demoUsers = [
    {
      email: 'founder@ecothreads.in',
      password: 'password123',
      role: 'startup' as const,
      display_name: 'Aarav Sharma',
      startup_name: 'EcoThreads Apparel',
      startup_description: 'Sustainable organic flax linen essentials crafted for mindful everyday comfort.'
    },
    {
      email: 'founder@artisanbake.in',
      password: 'password123',
      role: 'startup' as const,
      display_name: 'Maya Patel',
      startup_name: 'Artisan Breads & Co',
      startup_description: 'Small-batch 36-hour slow-fermented organic sourdough bakery.'
    },
    {
      email: 'sponsor@indiagrowth.vc',
      password: 'password123',
      role: 'sponsor' as const,
      display_name: 'Vikram Mehta (India Growth Angels)'
    },
    {
      email: 'riya@gmail.com',
      password: 'password123',
      role: 'user' as const,
      display_name: 'Riya Verma'
    }
  ];

  for (const u of demoUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?)').get(u.email);
    if (!existing) {
      AuthRepository.createUser(u);
    }
  }

  // 2. Seed Initial T-Shirt Product for EcoThreads Founder
  const founder = AuthRepository.getUserByEmail('founder@ecothreads.in');
  if (founder) {
    const existingProduct = db.prepare('SELECT id FROM products WHERE owner_id = ?').get(founder.id);
    if (!existingProduct) {
      ProductRepository.create(founder.id, {
        name: 'Organic Flax Linen Minimalist T-Shirt',
        category: 'clothing_accessories',
        stage: 'preparing_to_launch',
        summary: 'Breathable, hypoallergenic 100% natural organic flax linen shirt designed for casual everyday wear in warm climates.',
        intended_buyer: 'Young eco-conscious working professionals (25-35) looking for sustainable minimalist apparel.',
        feedback_question: 'Would you pay ₹699 for an unbleached organic flax shirt with lifetime seam repairs?',
        price: 699,
        currency: 'INR',
        availability_markets: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout'],
        fulfillment_mode: 'Standard postal shipping with recycled kraft packaging',
        images: [],
        category_data: {
          item_type: 'Shirt / T-Shirt',
          material: '100% Organic Flax Linen',
          sizes: ['S', 'M', 'L', 'XL'],
          fit: 'Relaxed Regular Fit'
        },
        status: 'published'
      });
    }
  }

  // 3. Seed Artisan Sourdough Product for Artisan Bake Founder
  const bakeFounder = AuthRepository.getUserByEmail('founder@artisanbake.in');
  if (bakeFounder) {
    const existingProduct = db.prepare('SELECT id FROM products WHERE owner_id = ?').get(bakeFounder.id);
    if (!existingProduct) {
      ProductRepository.create(bakeFounder.id, {
        name: 'Country Style Artisan Sourdough Loaf',
        category: 'local_food_beverages',
        stage: 'prototype',
        summary: 'Naturally leavened 36-hour fermented crusty sourdough loaf with wild sourdough culture and unbleached stoneground flour.',
        intended_buyer: 'Food enthusiasts and families in central Bangalore seeking gut-friendly artisan bread.',
        feedback_question: 'Would you subscribe to a weekly doorstep morning delivery on Tuesday and Friday mornings?',
        price: 220,
        currency: 'INR',
        availability_markets: ['Indiranagar', 'Koramangala'],
        fulfillment_mode: 'Local morning cycle delivery in reusable cotton bread bags',
        images: [],
        category_data: {
          item_name: 'Country Sourdough Loaf',
          portion: '750g baked weight',
          ingredients_allergens: 'Stoneground wheat flour, water, sea salt, wild starter culture. Contains gluten.',
          pickup_delivery_mode: 'Morning home delivery within 5 km of bakery'
        },
        status: 'published'
      });
    }
  }
}
