import { Router, Request, Response } from 'express';
import { 
  TestDraftPayloadSchema, 
  evaluateEligibility, 
  calculatePanelEligibilityStats,
  EligibilityResult
} from '@droptest/shared';
import { TestRepository } from '../db/testRepository.js';
import { generatePanelProfiles } from '../simulation/profileGenerator.js';
import { getDatabase } from '../db/database.js';
import { z } from 'zod';

export const testRouter = Router();

// GET /api/tests - List all tests
testRouter.get('/', (_req: Request, res: Response) => {
  try {
    const tests = TestRepository.listAll();
    res.json({ tests });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list tests', message: error.message });
  }
});

// POST /api/tests/preview-panel - Generate and preview 50 profiles in-memory from draft inputs
testRouter.post('/preview-panel', (req: Request, res: Response) => {
  try {
    const input = z.object({ domain_id: z.enum(['clothing_accessories', 'local_food_beverages', 'digital_products_services']), audience_markets: z.array(z.string().trim().min(1).max(100)).min(1).max(4), expected_spend_min: z.number().finite().nonnegative(), expected_spend_max: z.number().finite().nonnegative(), intended_buyer_description: z.string().max(500), adjacent_buyer_description: z.string().max(500), seed: z.number().int().min(0).max(2147483647).optional() }).safeParse(req.body);
    if (!input.success || input.data.expected_spend_max < input.data.expected_spend_min) return res.status(400).json({ error: 'Enter valid audience markets and spend bounds to preview the panel.' });
    const { 
      domain_id, 
      intended_buyer_description = '', 
      adjacent_buyer_description = '', 
      expected_spend_min = 10, 
      expected_spend_max = 50, 
      audience_markets = ['All Online'],
      option_a = { name: 'Option A', served_markets: audience_markets },
      option_b = { name: 'Option B', served_markets: audience_markets },
      seed = 12345
    } = req.body;

    if (!audience_markets || audience_markets.length === 0) {
      return res.status(400).json({ error: 'Audience markets list cannot be empty' });
    }

    const profiles = generatePanelProfiles({
      testId: 'preview_draft',
      domainId: domain_id || 'clothing_accessories',
      intendedBuyerDescription: intended_buyer_description,
      adjacentBuyerDescription: adjacent_buyer_description,
      expectedSpendMin: Number(expected_spend_min),
      expectedSpendMax: Number(expected_spend_max),
      audienceMarkets: audience_markets,
      seed: Number(seed)
    });

    const statsA = calculatePanelEligibilityStats(profiles, option_a);
    const statsB = calculatePanelEligibilityStats(profiles, option_b);

    const profileEligibility: Record<string, { a: EligibilityResult; b: EligibilityResult }> = {};
    for (const p of profiles) {
      profileEligibility[p.id] = {
        a: evaluateEligibility(p, option_a),
        b: evaluateEligibility(p, option_b)
      };
    }

    res.json({
      profiles,
      stats_a: statsA,
      stats_b: statsB,
      profile_eligibility: profileEligibility,
      seed
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to preview panel', message: error.message });
  }
});

// GET /api/tests/:id - Get test by ID
testRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve test', message: error.message });
  }
});

// GET /api/tests/:id/panel - Get saved 50-profile panel with Option A & Option B eligibility
testRouter.get('/:id/panel', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    let profiles = TestRepository.getProfiles(testId);

    // If no profiles generated yet, generate and save them automatically
    if (profiles.length === 0) {
      profiles = generatePanelProfiles({
        testId,
        domainId: test.test.domain_id,
        intendedBuyerDescription: test.audience_config.intended_buyer_description,
        adjacentBuyerDescription: test.audience_config.adjacent_buyer_description,
        expectedSpendMin: test.audience_config.expected_spend_min,
        expectedSpendMax: test.audience_config.expected_spend_max,
        audienceMarkets: test.audience_config.audience_markets,
        seed: test.test.panel_seed ?? 12345
      });
      TestRepository.saveProfiles(testId, profiles);
    }

    const statsA = calculatePanelEligibilityStats(profiles, test.options.A);
    const statsB = calculatePanelEligibilityStats(profiles, test.options.B);

    const profileEligibility: Record<string, { a: EligibilityResult; b: EligibilityResult }> = {};
    for (const p of profiles) {
      profileEligibility[p.id] = {
        a: evaluateEligibility(p, test.options.A),
        b: evaluateEligibility(p, test.options.B)
      };
    }

    res.json({
      profiles,
      stats_a: statsA,
      stats_b: statsB,
      profile_eligibility: profileEligibility
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve panel profiles', message: error.message });
  }
});

// POST /api/tests/:id/panel/generate - Regenerate and save 50-profile panel for a test
testRouter.post('/:id/panel/generate', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const seed = req.body.seed !== undefined ? Number(req.body.seed) : Math.floor(Math.random() * 1000000);
    if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) return res.status(400).json({ error: 'Invalid panel seed' });
    if (TestRepository.getLatestRunByTestId(testId)) return res.status(409).json({ error: 'This panel is frozen. Create a new test to regenerate it.' });

    const generatedProfiles = generatePanelProfiles({
      testId,
      domainId: test.test.domain_id,
      intendedBuyerDescription: test.audience_config.intended_buyer_description,
      adjacentBuyerDescription: test.audience_config.adjacent_buyer_description,
      expectedSpendMin: test.audience_config.expected_spend_min,
      expectedSpendMax: test.audience_config.expected_spend_max,
      audienceMarkets: test.audience_config.audience_markets,
      seed
    });

    const savedProfiles = TestRepository.saveProfiles(testId, generatedProfiles);
    getDatabase().prepare('UPDATE tests SET panel_seed = ? WHERE id = ?').run(seed, testId);

    const statsA = calculatePanelEligibilityStats(savedProfiles, test.options.A);
    const statsB = calculatePanelEligibilityStats(savedProfiles, test.options.B);

    const profileEligibility: Record<string, { a: EligibilityResult; b: EligibilityResult }> = {};
    for (const p of savedProfiles) {
      profileEligibility[p.id] = {
        a: evaluateEligibility(p, test.options.A),
        b: evaluateEligibility(p, test.options.B)
      };
    }

    res.json({
      profiles: savedProfiles,
      stats_a: statsA,
      stats_b: statsB,
      profile_eligibility: profileEligibility,
      seed
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate panel profiles', message: error.message });
  }
});

// POST /api/tests - Create or save test draft
testRouter.post('/', (req: Request, res: Response) => {
  try {
    const parseResult = TestDraftPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parseResult.error.issues
      });
    }

    const saved = TestRepository.saveDraft(parseResult.data);
    res.status(200).json(saved);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.status === 409 ? error.message : 'Failed to save test draft' });
  }
});

testRouter.get('/:id/feedback-stats', (req, res) => {
  const id = String(req.params.id);
  const test = TestRepository.getById(id);
  if (!test) return res.status(404).json({ error: 'Test not found' });
  const stats = TestRepository.getHumanFeedback(id);
  res.json({ ...stats, feedback_token: test.test.feedback_token && TestRepository.getByFeedbackToken(test.test.feedback_token) ? test.test.feedback_token : undefined });
});

// DELETE /api/tests/:id - Delete test by ID
testRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const testId = String(req.params.id);
    const success = TestRepository.deleteById(testId);
    if (!success) {
      return res.status(404).json({ error: 'Test not found or already deleted' });
    }
    res.json({ success: true, id: testId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete test', message: error.message });
  }
});
