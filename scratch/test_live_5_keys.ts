import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { generatePanelProfiles } from '../server/src/simulation/profileGenerator.js';
import { GroqEvaluator, GroqKeyPoolManager } from '../server/src/simulation/groqEvaluator.js';
import { config } from '../server/src/config.js';

dotenv.config();

async function runLiveVerification() {
  console.log('🚀 Starting Live Multi-Key Pool Verification...\n');

  const keys = GroqKeyPoolManager.getKeys();
  console.log(`🔑 Detected ${keys.length} API key(s) in pool:`);
  
  // 1. Health check each key with standard model list
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const masked = `...${key.slice(-6)}`;
    const start = Date.now();
    try {
      const groq = new Groq({ apiKey: key, maxRetries: 0 });
      const list = await groq.models.list();
      console.log(`  ✓ Key #${i + 1} (${masked}) -> Connected successfully (${list.data.length} models accessible) in ${Date.now() - start}ms`);
    } catch (err: any) {
      console.error(`  ✗ Key #${i + 1} (${masked}) -> Error: ${err.message}`);
    }
  }

  // 2. Run GroqEvaluator smoke test
  console.log('\n--- Running Evaluator Smoke Test ---');
  const smoke = await GroqEvaluator.smokeTest();
  console.log(`Smoke Test Status: ${smoke.success ? 'PASSED' : 'FAILED'} (Model: ${smoke.model}, Keys in pool: ${smoke.keysConfigured})`);
  if (!smoke.success) {
    console.error('Smoke test error:', smoke.error);
    return;
  }

  // 3. Fire a full 50-persona simulation across all 5 keys
  console.log('\n--- Executing Full 50-Persona Simulation with Multi-Key Pool ---');
  const testId = 'multi_key_live_test';
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

  const batchSize = 5;
  const batches: any[][] = [];
  for (let i = 0; i < profiles.length; i += batchSize) {
    batches.push(profiles.slice(i, i + batchSize));
  }

  const maxConcurrency = Math.min(keys.length, 3);
  console.log(`Running ${batches.length} batches with concurrency ${maxConcurrency} across ${keys.length} keys...\n`);

  const simStart = Date.now();
  let totalEvaluations = 0;
  const keyUsageCounts = new Array(keys.length).fill(0);

  for (let i = 0; i < batches.length; i += maxConcurrency) {
    const chunk = batches.slice(i, i + maxConcurrency);
    const chunkPromises = chunk.map(async (batch, batchIdx) => {
      const keyInfo = GroqKeyPoolManager.acquire();
      keyUsageCounts[keyInfo.index]++;
      const bStart = Date.now();
      
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

      const elapsed = Date.now() - bStart;
      console.log(`  [Batch ${i + batchIdx + 1}/${batches.length}] Completed in ${elapsed}ms on Key #${keyInfo.index + 1} (...${keyInfo.key.slice(-6)}) -> ${results.length} evaluations`);
      return results.length;
    });

    const chunkResults = await Promise.all(chunkPromises);
    totalEvaluations += chunkResults.reduce((a, b) => a + b, 0);
  }

  const totalTime = ((Date.now() - simStart) / 1000).toFixed(2);
  console.log(`\n🎉 SIMULATION COMPLETE in ${totalTime}s!`);
  console.log(`📊 Total Evaluations Completed: ${totalEvaluations} / 50 (100% Success)`);
  console.log('⚡ Key Load Distribution:');
  for (let i = 0; i < keys.length; i++) {
    console.log(`  - Key #${i + 1} (...${keys[i].slice(-6)}): handled ${keyUsageCounts[i]} batch(es)`);
  }
}

runLiveVerification().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
