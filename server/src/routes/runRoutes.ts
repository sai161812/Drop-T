import { Router, Request, Response } from 'express';
import { computeComparisonAnalysis, TestDraftPayloadSchema } from '@droptest/shared';
import { GroqEvaluator } from '../simulation/groqEvaluator.js';
import { TestRepository } from '../db/testRepository.js';
import { generatePanelProfiles } from '../simulation/profileGenerator.js';
import { config } from '../config.js';

export const runRouter = Router();
runRouter.get('/status', (_req, res) => res.json({ configured: GroqEvaluator.isConfigured(), model: config.groqModel }));
runRouter.post('/smoke-test', async (_req, res) => res.json(await GroqEvaluator.smokeTest()));

function launch(req: Request, res: Response, retry: boolean) {
  const testId = String(req.params.id);
  const test = TestRepository.getById(testId);
  if (!test) return res.status(404).json({ error: 'Test not found' });
  let run = retry ? TestRepository.getRunById(String(req.params.runId)) : TestRepository.getLatestRunByTestId(testId);
  if (retry && (!run || run.test_id !== testId)) return res.status(404).json({ error: 'Run not found for this test' });
  if (run && GroqEvaluator.isActive(run.id)) return res.status(202).json({ run });
  if (run && !retry) return res.status(409).json({ error: 'This test already has a frozen run. Retry it or save a new test.' });
  if (run?.status === 'completed') return res.json({ run });
  if (!GroqEvaluator.isConfigured()) return res.status(503).json({ error: 'Simulation is not configured on the server. Your draft is saved.' });
  if (!run) {
    const validation = TestDraftPayloadSchema.safeParse({ test: test.test, offering: test.offering, option_a: test.options.A, option_b: test.options.B, audience_config: test.audience_config, comparison_lever: test.comparison_lever });
    if (!validation.success) return res.status(400).json({ error: 'Correct the test inputs before running.', issues: validation.error.issues });
    let profiles = TestRepository.getProfiles(testId);
    if (profiles.length === 0) {
      profiles = generatePanelProfiles({ testId, domainId: test.test.domain_id, intendedBuyerDescription: test.audience_config.intended_buyer_description, adjacentBuyerDescription: test.audience_config.adjacent_buyer_description, expectedSpendMin: test.audience_config.expected_spend_min, expectedSpendMax: test.audience_config.expected_spend_max, audienceMarkets: test.audience_config.audience_markets, seed: test.test.panel_seed ?? 12345 });
      TestRepository.saveProfiles(testId, profiles);
    }
    if (profiles.length !== 50) return res.status(409).json({ error: 'Regenerate the draft panel before running.' });
    run = TestRepository.createRun(testId, test.comparison_lever, test.test.panel_seed ?? 12345, config.groqModel);
  }
  if (!TestRepository.getRunSnapshot(run.id)) return res.status(409).json({ error: 'This legacy run has no verified snapshot. Save a new test.' });
  const runId = run.id;
  void GroqEvaluator.executeRun(testId, runId).catch(() => {
    TestRepository.updateRun(runId, { status: 'partial', error_message: 'Run interrupted. Retry missing evaluations.' });
  });
  return res.status(202).json({ run: TestRepository.getRunById(runId) });
}
runRouter.post('/:id/run', (req, res) => launch(req, res, false));
runRouter.post('/:id/runs/:runId/retry', (req, res) => launch(req, res, true));
runRouter.get('/:id/runs/latest', (req, res) => {
  const run = TestRepository.getLatestRunByTestId(String(req.params.id));
  res.json({ run, evaluations: run ? TestRepository.getEvaluationsByRunId(run.id) : [] });
});
runRouter.get('/:id/runs/:runId', (req, res) => {
  const run = TestRepository.getRunById(String(req.params.runId));
  if (!run || run.test_id !== String(req.params.id)) return res.status(404).json({ error: 'Run not found' });
  res.json({ run, evaluations: TestRepository.getEvaluationsByRunId(run.id) });
});
function analysis(req: Request, res: Response) {
  const testId = String(req.params.id);
  const run = req.params.runId ? TestRepository.getRunById(String(req.params.runId)) : TestRepository.getLatestRunByTestId(testId);
  if (!run) return res.json({ analysis: null });
  if (run.test_id !== testId) return res.status(404).json({ error: 'Run not found' });
  const snapshot = TestRepository.getRunSnapshot(run.id);
  if (!snapshot) return res.status(409).json({ error: 'This legacy run has no verified snapshot. Save a new test.' });
  res.json(computeComparisonAnalysis(snapshot.test, run, snapshot.profiles, TestRepository.getEvaluationsByRunId(run.id)));
}
runRouter.get('/:id/analysis', analysis);
runRouter.get('/:id/runs/:runId/analysis', analysis);
