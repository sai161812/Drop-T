import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { generatePanelProfiles } from '../server/src/simulation/profileGenerator.js';
import { GroqEvaluator, GroqKeyPoolManager } from '../server/src/simulation/groqEvaluator.js';

dotenv.config();

async function test20B() {
  console.log('🚀 Testing 50-persona simulation on openai/gpt-oss-20b...\n');

  const testId = 'test_20b';
  const profiles = generatePanelProfiles({
    testId,
    domainId: 'other',
    intendedBuyerDescription: 'Fitness enthusiasts and health-conscious professionals wanting clean water',
    adjacentBuyerDescription: 'Hikers and travelers looking for portable UV purification',
    expectedSpendMin: 40,
    expectedSpendMax: 120,
    audienceMarkets: ['North America', 'Europe', 'India'],
    seed: 12345
  });

  const option = {
    name: '💧 PureGlow Smart Water Bottle',
    price: 79,
    primary_message: '280nm UV-C LED sterilization and Bluetooth intake tracking',
    served_markets: ['North America', 'Europe', 'India'],
    fulfillment_mode: 'Direct tracked shipping',
    images: []
  };

  const domainLabel = 'other';
  const offeringContext = JSON.stringify({
    short_value_prop: 'UV-C LED cap purification and real-time hydration volume tracking',
    description: 'Self-cleaning double-walled stainless bottle with 280nm UV-C LED sterilization and Bluetooth intake tracking.',
    currency: 'USD',
    period: 'launch_batch',
    domain_specific_data: { specification_text: '280nm UV-C LED cap' }
  });

  const batchSize = 10;
  const batches: any[][] = [];
  for (let i = 0; i < profiles.length; i += batchSize) {
    batches.push(profiles.slice(i, i + batchSize));
  }

  console.log(`Evaluating 50 personas in ${batches.length} batches of 10 with model openai/gpt-oss-20b...`);
  const start = Date.now();
  let completed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const keyInfo = GroqKeyPoolManager.acquire();
    const bStart = Date.now();

    try {
      const results = await GroqEvaluator.evaluateBatchWithGroq(
        batch,
        option,
        domainLabel,
        offeringContext,
        1,
        25000,
        'USD',
        '',
        [],
        keyInfo.key
      );
      completed += results.length;
      console.log(`[Batch ${i + 1}/${batches.length}] Completed in ${Date.now() - bStart}ms on Key #${keyInfo.index + 1} -> +${results.length} evaluations (Total: ${completed}/50)`);
    } catch (err: any) {
      console.error(`[Batch ${i + 1}] Error:`, err.message);
    }
  }

  console.log(`\n🎉 Total completed: ${completed}/50 in ${((Date.now() - start) / 1000).toFixed(2)}s`);
}

test20B();
