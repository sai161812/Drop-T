import { Router, Request, Response } from 'express';
import { computeComparisonAnalysis, TestDraftPayloadSchema } from '@droptest/shared';
import { GroqEvaluator } from '../simulation/groqEvaluator.js';
import { TestRepository } from '../db/testRepository.js';
import { ProductRepository } from '../db/productRepository.js';
import { ReferenceRepository } from '../db/referenceRepository.js';
import { SearchService } from '../search/searchService.js';
import { generatePanelProfiles } from '../simulation/profileGenerator.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { config } from '../config.js';

export const runRouter = Router();
runRouter.get('/status', (_req, res) => res.json({ configured: GroqEvaluator.isConfigured(), model: config.groqModel }));
runRouter.post('/smoke-test', async (_req, res) => res.json(await GroqEvaluator.smokeTest()));

async function launch(req: AuthenticatedRequest, res: Response, retry: boolean) {
  const testId = String(req.params.id);
  const test = TestRepository.getById(testId);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  // Ownership check for product-linked tests
  let product: any = null;
  if (test.product_id) {
    product = ProductRepository.getById(test.product_id);
    if (!product || !req.user || req.user.id !== product.owner_id) {
      return res.status(403).json({ error: 'Only the product owner can run Synthetic Lab for this product.' });
    }
  }

  let run = retry ? TestRepository.getRunById(String(req.params.runId)) : TestRepository.getLatestRunByTestId(testId);
  if (retry && (!run || run.test_id !== testId)) return res.status(404).json({ error: 'Run not found for this test' });
  if (run && GroqEvaluator.isActive(run.id)) return res.status(202).json({ run });
  if (run && !retry) return res.status(409).json({ error: 'This test already has a frozen run. Retry it or save a new test.' });
  if (run?.status === 'completed') return res.json({ run });
  if (!GroqEvaluator.isConfigured()) return res.status(503).json({ error: 'Simulation is not configured on the server. Your draft is saved.' });
  
  if (!run) {
    const resolvedMode = test.mode || (test.options.B ? 'comparison' : 'single');
    const validation = TestDraftPayloadSchema.safeParse({ 
      mode: resolvedMode,
      product_id: test.product_id,
      test: test.test, 
      offering: test.offering, 
      option_a: test.options.A, 
      option_b: test.options.B, 
      audience_config: test.audience_config, 
      comparison_lever: test.comparison_lever 
    });
    if (!validation.success) return res.status(400).json({ error: 'Correct the test inputs before running.', issues: validation.error.issues });
    let profiles = TestRepository.getProfiles(testId);
    if (profiles.length === 0) {
      profiles = generatePanelProfiles({ testId, domainId: test.test.domain_id, intendedBuyerDescription: test.audience_config.intended_buyer_description, adjacentBuyerDescription: test.audience_config.adjacent_buyer_description, expectedSpendMin: test.audience_config.expected_spend_min, expectedSpendMax: test.audience_config.expected_spend_max, audienceMarkets: test.audience_config.audience_markets, seed: test.test.panel_seed ?? 12345 });
      TestRepository.saveProfiles(testId, profiles);
    }
    if (profiles.length !== 50) return res.status(409).json({ error: 'Regenerate the draft panel before running.' });

    // Handle research sources for product-linked test
    let selectedRefs: any[] = [];
    let researchStatus: 'without_research' | 'completed' | 'no_matches' | 'failed' | 'skipped' = 'without_research';

    if (test.product_id && product) {
      selectedRefs = ReferenceRepository.getSelectedByProductId(test.product_id);
      const intendedProductSnapshot = (test.offering.domain_specific_data as any)?._product_snapshot;
      const researchProduct = intendedProductSnapshot || product;
      
      // If no references exist and skip_research wasn't explicitly requested, perform automatic search
      if (selectedRefs.length === 0 && !req.body.skip_research) {
        try {
          const searchResult = await SearchService.searchComparableProducts(researchProduct);
          if (searchResult.status === 'completed' && searchResult.references.length > 0) {
            ReferenceRepository.saveReferences(product.id, searchResult.references);
            selectedRefs = ReferenceRepository.getSelectedByProductId(product.id);
            researchStatus = 'completed';
          } else if (searchResult.status === 'no_matches') {
            researchStatus = 'no_matches';
          } else if (searchResult.status === 'failed') {
            researchStatus = 'failed';
          }
        } catch {
          researchStatus = 'failed';
        }
      } else if (selectedRefs.length > 0) {
        researchStatus = 'completed';
      } else if (req.body.skip_research) {
        researchStatus = 'skipped';
      }
    }

    run = TestRepository.createRun(
      testId, 
      test.comparison_lever, 
      test.test.panel_seed ?? 12345, 
      config.groqModel, 
      resolvedMode, 
      researchStatus, 
      selectedRefs
    );
  }
  if (!TestRepository.getRunSnapshot(run.id)) return res.status(409).json({ error: 'This legacy run has no verified snapshot. Save a new test.' });
  const runId = run.id;
  void GroqEvaluator.executeRun(testId, runId).catch(() => {
    TestRepository.updateRun(runId, { status: 'partial', error_message: 'Run interrupted. Retry missing evaluations.' });
  });
  return res.status(202).json({ run: TestRepository.getRunById(runId) });
}

runRouter.post('/:id/run', (req, res) => { void launch(req, res, false); });
runRouter.post('/:id/runs/:runId/retry', (req, res) => { void launch(req, res, true); });

runRouter.get('/:id/runs/latest', (req: AuthenticatedRequest, res: Response) => {
  const testId = String(req.params.id);
  const test = TestRepository.getById(testId);
  if (test?.product_id) {
    const product = ProductRepository.getById(test.product_id);
    if (!product || !req.user || req.user.id !== product.owner_id) {
      return res.status(403).json({ error: 'Only the product owner can access Synthetic Lab for this product.' });
    }
  }
  const run = TestRepository.getLatestRunByTestId(testId);
  res.json({ run, evaluations: run ? TestRepository.getEvaluationsByRunId(run.id) : [] });
});

runRouter.get('/:id/runs/:runId', (req: AuthenticatedRequest, res: Response) => {
  const testId = String(req.params.id);
  const test = TestRepository.getById(testId);
  if (test?.product_id) {
    const product = ProductRepository.getById(test.product_id);
    if (!product || !req.user || req.user.id !== product.owner_id) {
      return res.status(403).json({ error: 'Only the product owner can access Synthetic Lab for this product.' });
    }
  }
  const run = TestRepository.getRunById(String(req.params.runId));
  if (!run || run.test_id !== testId) return res.status(404).json({ error: 'Run not found' });
  res.json({ run, evaluations: TestRepository.getEvaluationsByRunId(run.id) });
});

function analysis(req: AuthenticatedRequest, res: Response) {
  const testId = String(req.params.id);
  const test = TestRepository.getById(testId);
  if (test?.product_id) {
    const product = ProductRepository.getById(test.product_id);
    if (!product || !req.user || req.user.id !== product.owner_id) {
      return res.status(403).json({ error: 'Only the product owner can view Synthetic Lab analysis for this product.' });
    }
  }
  const run = req.params.runId ? TestRepository.getRunById(String(req.params.runId)) : TestRepository.getLatestRunByTestId(testId);
  if (!run) return res.json({ analysis: null });
  if (run.test_id !== testId) return res.status(404).json({ error: 'Run not found' });
  const snapshot = TestRepository.getRunSnapshot(run.id);
  if (!snapshot) return res.status(409).json({ error: 'This legacy run has no verified snapshot. Save a new test.' });
  const runWithSnapshot = {
    ...run,
    snapshot: snapshot as any,
    references: snapshot.references || [],
    selected_references: snapshot.references || [],
    reference_summary: snapshot.reference_summary
  };
  res.json(computeComparisonAnalysis(snapshot.test, runWithSnapshot as any, snapshot.profiles, TestRepository.getEvaluationsByRunId(run.id)));
}

runRouter.get('/:id/analysis', analysis);
runRouter.get('/:id/runs/:runId/analysis', analysis);
