import { Router, Request, Response } from 'express';
import { computeComparisonAnalysis } from '@droptest/shared';
import { GroqEvaluator } from '../simulation/groqEvaluator.js';
import { TestRepository } from '../db/testRepository.js';
import { generatePanelProfiles } from '../simulation/profileGenerator.js';
import { config } from '../config.js';

export const runRouter = Router();

// GET /api/simulation/status - Check Groq configuration status
runRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: GroqEvaluator.isConfigured(),
    model: config.groqModel,
    vision_model: config.groqVisionModel
  });
});

// POST /api/simulation/smoke-test - Run one short real smoke request
runRouter.post('/smoke-test', async (_req: Request, res: Response) => {
  try {
    const result = await GroqEvaluator.smokeTest();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Smoke test failed'
    });
  }
});

// POST /api/tests/:id/run - Start a new simulation run
runRouter.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Ensure 50 profiles exist in database for this test
    let profiles = TestRepository.getProfiles(testId);
    if (profiles.length === 0) {
      profiles = generatePanelProfiles({
        testId,
        domainId: test.test.domain_id,
        intendedBuyerDescription: test.audience_config.intended_buyer_description,
        adjacentBuyerDescription: test.audience_config.adjacent_buyer_description,
        expectedSpendMin: test.audience_config.expected_spend_min,
        expectedSpendMax: test.audience_config.expected_spend_max,
        audienceMarkets: test.audience_config.audience_markets,
        seed: 12345
      });
      TestRepository.saveProfiles(testId, profiles);
    }

    // Execute run
    const result = await GroqEvaluator.executeRun(testId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Simulation run failed', message: error.message });
  }
});

// GET /api/tests/:id/runs/latest - Get latest run for a test
runRouter.get('/:id/runs/latest', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const run = TestRepository.getLatestRunByTestId(testId);
    if (!run) {
      return res.json({ run: null, evaluations: [] });
    }

    const evaluations = TestRepository.getEvaluationsByRunId(run.id);
    res.json({ run, evaluations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve latest run', message: error.message });
  }
});

// GET /api/tests/:id/runs/:runId - Get specific run details
runRouter.get('/:id/runs/:runId', (req: Request, res: Response) => {
  try {
    const runId = String(req.params.runId);
    const run = TestRepository.getRunById(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const evaluations = TestRepository.getEvaluationsByRunId(runId);
    res.json({ run, evaluations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve run', message: error.message });
  }
});

// GET /api/tests/:id/runs/:runId/analysis - Get full comparison analysis for a specific run
runRouter.get('/:id/runs/:runId/analysis', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const runId = String(req.params.runId);

    const fullTest = TestRepository.getById(testId);
    if (!fullTest) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const run = TestRepository.getRunById(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const profiles = TestRepository.getProfiles(testId);
    const evaluations = TestRepository.getEvaluationsByRunId(runId);

    const analysis = computeComparisonAnalysis(fullTest, run, profiles, evaluations);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to compute comparison analysis', message: error.message });
  }
});

// GET /api/tests/:id/analysis - Get full comparison analysis for the latest run
runRouter.get('/:id/analysis', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);

    const fullTest = TestRepository.getById(testId);
    if (!fullTest) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const run = TestRepository.getLatestRunByTestId(testId);
    if (!run) {
      return res.json({ analysis: null, message: 'No runs recorded for this test' });
    }

    const profiles = TestRepository.getProfiles(testId);
    const evaluations = TestRepository.getEvaluationsByRunId(run.id);

    const analysis = computeComparisonAnalysis(fullTest, run, profiles, evaluations);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to compute comparison analysis', message: error.message });
  }
});

// POST /api/tests/:id/runs/:runId/retry - Retry incomplete evaluations for a run
runRouter.post('/:id/runs/:runId/retry', async (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const runId = String(req.params.runId);

    const run = TestRepository.getRunById(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const result = await GroqEvaluator.executeRun(testId, runId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retry run evaluations', message: error.message });
  }
});
