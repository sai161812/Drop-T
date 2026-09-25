// Deliberately opt-in: makes real Groq requests using only the bundled demo templates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';
import { GroqEvaluator } from '../src/simulation/groqEvaluator.js';
import { generatePanelProfiles } from '../src/simulation/profileGenerator.js';
import { DOMAIN_PRESETS } from '../../client/src/config/templates.js';
import { computeComparisonAnalysis, TestDraftPayloadSchema } from '@droptest/shared';

const outputDir = path.resolve('.cache/prd-live');
fs.mkdirSync(outputDir, { recursive: true });
initDatabase(path.join(outputDir, `verification-${Date.now()}.sqlite`));
const report: Record<string, unknown> = { checked_at: new Date().toISOString(), model: config.groqModel, runs: [] };
try {
  assert.ok(GroqEvaluator.isConfigured(), 'Groq is not configured');
  const smoke = await GroqEvaluator.smokeTest();
  assert.ok(smoke.success, smoke.error);
  assert.equal(smoke.sampleEvaluation?.profile_id, 'prof_smoke');
  report.smoke = 'passed';
  console.log('Live smoke: passed with a parsed profile record.');
  for (const preset of Object.values(DOMAIN_PRESETS)) {
    const payload = TestDraftPayloadSchema.parse({ ...preset.payload, panel_seed: 7461 });
    const test = TestRepository.saveDraft(payload);
    const profiles = generatePanelProfiles({ testId: test.test.id, domainId: test.test.domain_id, intendedBuyerDescription: test.audience_config.intended_buyer_description, adjacentBuyerDescription: test.audience_config.adjacent_buyer_description, expectedSpendMin: test.audience_config.expected_spend_min, expectedSpendMax: test.audience_config.expected_spend_max, audienceMarkets: test.audience_config.audience_markets, seed: 7461 });
    TestRepository.saveProfiles(test.test.id, profiles);
    console.log(`Live ${preset.id}: evaluating 50 profiles against A and B.`);
    const result = await GroqEvaluator.executeRun(test.test.id, undefined, { maxConcurrency: 1 });
    const analysis = computeComparisonAnalysis(test, result.run, profiles, result.evaluations);
    const record = { domain: preset.id, test_id: test.test.id, run_id: result.run.id, status: result.run.status, count: result.evaluations.length, unique_pairs: new Set(result.evaluations.map(e => `${e.profile_id}:${e.option_id}`)).size, completed: analysis.decision_card.is_run_complete };
    (report.runs as unknown[]).push(record);
    console.log(JSON.stringify(record));
    assert.equal(record.status, 'completed');
    assert.equal(record.unique_pairs, 100);
    assert.equal(record.completed, true);
    for (const evaluation of result.evaluations) {
      const profile = profiles.find(p => p.id === evaluation.profile_id)!;
      assert.equal(evaluation.response === 'unavailable', !test.options[evaluation.option_id].served_markets.includes(profile.market));
      assert.ok(evaluation.reason.length > 0);
    }
  }
  report.result = 'passed';
} catch (error) {
  report.result = 'failed';
  report.error = error instanceof Error ? error.message : String(error);
  console.error(report.error);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(outputDir, 'latest-report.json'), JSON.stringify(report, null, 2));
  closeDatabase();
}
