import { createApp } from '../server/src/app.js';
import { initDatabase } from '../server/src/db/database.js';
import { runSeed } from '../server/src/db/seed.js';
import { TestRepository } from '../server/src/db/testRepository.js';
import { GroqEvaluator } from '../server/src/simulation/groqEvaluator.js';
import { generatePanelProfiles } from '../server/src/simulation/profileGenerator.js';

async function testExecuteRun() {
  initDatabase();
  runSeed();

  console.log('🚀 Testing GroqEvaluator.executeRun directly for 50 personas...\n');

  // Create test
  const testId = `test_run_verify_${Date.now()}`;
  const audienceMarkets = ['North America', 'Europe', 'India'];
  
  TestRepository.saveDraft({
    mode: 'single',
    test: {
      id: testId,
      title: '💧 PureGlow Smart Water Bottle Verification',
      domain_id: 'other',
      status: 'draft'
    },
    offering: {
      short_value_prop: 'UV-C LED cap purification and real-time hydration tracking',
      description: 'Self-cleaning double-walled stainless bottle with 280nm UV-C LED sterilization.',
      currency: 'USD',
      period: 'launch_batch',
      domain_specific_data: { specification_text: '280nm UV-C LED cap' }
    },
    option_a: {
      name: 'Standard Model $79',
      price: 79,
      primary_message: 'Pure, bacteria-free hydration with automated tracking',
      served_markets: audienceMarkets,
      fulfillment_mode: 'Direct shipping',
      images: []
    },
    audience_config: {
      intended_buyer_description: 'Fitness enthusiasts and health-conscious commuters',
      adjacent_buyer_description: 'Outdoor hikers and remote workers',
      expected_spend_min: 40,
      expected_spend_max: 120,
      audience_markets: audienceMarkets
    },
    comparison_lever: 'price'
  });

  const profiles = generatePanelProfiles({
    testId,
    domainId: 'other',
    intendedBuyerDescription: 'Fitness enthusiasts and health-conscious commuters',
    adjacentBuyerDescription: 'Outdoor hikers and remote workers',
    expectedSpendMin: 40,
    expectedSpendMax: 120,
    audienceMarkets,
    seed: 12345
  });
  TestRepository.saveProfiles(testId, profiles);
  console.log(`Saved test and ${profiles.length} profiles to database.`);

  const start = Date.now();
  const result = await GroqEvaluator.executeRun(testId);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`\n🎉 executeRun Result in ${elapsed}s:`);
  console.log(`  - Run ID: ${result.run.id}`);
  console.log(`  - Status: ${result.run.status}`);
  console.log(`  - Evaluations Completed: ${result.evaluations.length} / 50`);
  console.log(`  - Error Message: ${result.run.error_message || 'None (Clean)'}`);

  if (result.run.status === 'completed' && result.evaluations.length === 50) {
    console.log('\n✅ 100% SUCCESS: 50 / 50 EVALUATIONS COMPLETED CLEANLY!');
  } else {
    console.error('\n❌ Incomplete run:', result.run);
  }
}

testExecuteRun().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
