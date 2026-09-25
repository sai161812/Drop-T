import { Router, Request, Response } from 'express';
import { 
  TestDraftPayloadSchema, 
  PartialProductLabDraftPayloadSchema,
  evaluateEligibility, 
  calculatePanelEligibilityStats,
  EligibilityResult
} from '@droptest/shared';
import { TestRepository } from '../db/testRepository.js';
import { ProductRepository } from '../db/productRepository.js';
import { generatePanelProfiles } from '../simulation/profileGenerator.js';
import { getDatabase } from '../db/database.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware.js';
import { z } from 'zod';

export const testRouter = Router();

// GET /api/tests - List only the current founder's product-linked tests.
testRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const tests = TestRepository.listByOwner(req.user!.id);
    res.json({ tests });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list tests', message: error.message });
  }
});

// POST /api/tests/preview-panel - Generate and preview 50 profiles in-memory from draft inputs
testRouter.post('/preview-panel', (req: Request, res: Response) => {
  try {
    const input = z.object({ 
      domain_id: z.enum(['clothing_accessories', 'local_food_beverages', 'digital_products_services', 'other']), 
      audience_markets: z.array(z.string().trim().min(1).max(100)).min(1).max(4), 
      expected_spend_min: z.number().finite().nonnegative(), 
      expected_spend_max: z.number().finite().nonnegative(), 
      intended_buyer_description: z.string().max(500), 
      adjacent_buyer_description: z.string().max(500), 
      seed: z.number().int().min(0).max(2147483647).optional() 
    }).safeParse(req.body);
    
    if (!input.success || input.data.expected_spend_max < input.data.expected_spend_min) {
      return res.status(400).json({ error: 'Enter valid audience markets and spend bounds to preview the panel.' });
    }

    const { 
      domain_id, 
      intended_buyer_description = '', 
      adjacent_buyer_description = '', 
      expected_spend_min = 10, 
      expected_spend_max = 50, 
      audience_markets = ['All Online'],
      option_a = { name: 'Option A', served_markets: audience_markets },
      option_b,
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
    const statsB = option_b ? calculatePanelEligibilityStats(profiles, option_b) : undefined;

    const profileEligibility: Record<string, { a: EligibilityResult; b?: EligibilityResult }> = {};
    for (const p of profiles) {
      profileEligibility[p.id] = {
        a: evaluateEligibility(p, option_a),
        ...(option_b ? { b: evaluateEligibility(p, option_b) } : {})
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
testRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Ownership check for product-linked tests
    if (test.product_id) {
      const product = ProductRepository.getById(test.product_id);
      if (!product || !req.user || req.user.id !== product.owner_id) {
        return res.status(403).json({ error: 'Only the product owner can access this Synthetic Lab test.' });
      }
    }

    res.json(test);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve test', message: error.message });
  }
});

// GET /api/tests/:id/panel - Get saved 50-profile panel with Option A & Option B eligibility
testRouter.get('/:id/panel', (req: AuthenticatedRequest, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Ownership check for product-linked tests
    if (test.product_id) {
      const product = ProductRepository.getById(test.product_id);
      if (!product || !req.user || req.user.id !== product.owner_id) {
        return res.status(403).json({ error: 'Only the product owner can access this Synthetic Lab test.' });
      }
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
    const statsB = test.options.B ? calculatePanelEligibilityStats(profiles, test.options.B) : undefined;

    const profileEligibility: Record<string, { a: EligibilityResult; b?: EligibilityResult }> = {};
    for (const p of profiles) {
      profileEligibility[p.id] = {
        a: evaluateEligibility(p, test.options.A),
        ...(test.options.B ? { b: evaluateEligibility(p, test.options.B) } : {})
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
testRouter.post('/:id/panel/generate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Ownership check for product-linked tests
    if (test.product_id) {
      const product = ProductRepository.getById(test.product_id);
      if (!product || !req.user || req.user.id !== product.owner_id) {
        return res.status(403).json({ error: 'Only the product owner can access this Synthetic Lab test.' });
      }
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
    const statsB = test.options.B ? calculatePanelEligibilityStats(savedProfiles, test.options.B) : undefined;

    const profileEligibility: Record<string, { a: EligibilityResult; b?: EligibilityResult }> = {};
    for (const p of savedProfiles) {
      profileEligibility[p.id] = {
        a: evaluateEligibility(p, test.options.A),
        ...(test.options.B ? { b: evaluateEligibility(p, test.options.B) } : {})
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
testRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const fullResult = TestDraftPayloadSchema.safeParse(req.body);
    const partialResult = fullResult.success ? null : PartialProductLabDraftPayloadSchema.safeParse(req.body);
    const parseResult = fullResult.success ? fullResult : partialResult?.success ? partialResult : fullResult;
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parseResult.error.issues
      });
    }

    const topLevelProductId = parseResult.data.product_id;
    const nestedProductId = parseResult.data.test.product_id;
    if (topLevelProductId && nestedProductId && topLevelProductId !== nestedProductId) {
      return res.status(400).json({ error: 'Conflicting linked product IDs' });
    }
    const productId = topLevelProductId || nestedProductId;

    if (parseResult.data.test.id) {
      const existing = TestRepository.getById(parseResult.data.test.id);
      if (existing) {
        if (!existing.product_id) {
          // Preserve the established immutable response for completed legacy
          // records without allowing an unclaimed editable draft to be claimed.
          if (TestRepository.getLatestRunByTestId(existing.test.id)) {
            const saved = TestRepository.saveDraft(parseResult.data);
            return res.status(200).json(saved);
          }
          return res.status(403).json({ error: 'Legacy tests are unclaimed and cannot be updated through the public draft API.' });
        }
        const existingProduct = ProductRepository.getById(existing.product_id);
        if (!existingProduct || !req.user || req.user.id !== existingProduct.owner_id) {
          return res.status(403).json({ error: 'Only the existing product owner can update this Synthetic Lab test.' });
        }
        if (!topLevelProductId || !nestedProductId || topLevelProductId !== existing.product_id || nestedProductId !== existing.product_id) {
          return res.status(409).json({ error: 'The linked product cannot be omitted or changed on an existing test.' });
        }
      }
    }
    let productSnapshot: Record<string, unknown> | null = null;
    if (productId) {
      const product = ProductRepository.getById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Linked product not found' });
      }
      if (!req.user || req.user.id !== product.owner_id) {
        return res.status(403).json({ error: 'Only the product owner can save a Synthetic Lab test for this product.' });
      }
      productSnapshot = {
        id: product.id, name: product.name, category: product.category, stage: product.stage,
        summary: product.summary, intended_buyer: product.intended_buyer, feedback_question: product.feedback_question,
        price: product.price, currency: product.currency, availability_markets: product.availability_markets,
        fulfillment_mode: product.fulfillment_mode, images: product.images, category_data: product.category_data,
        updated_at: product.updated_at
      };
    }

    const savePayload: any = productSnapshot ? {
      ...parseResult.data,
      offering: {
        ...parseResult.data.offering,
        domain_specific_data: { ...parseResult.data.offering.domain_specific_data, _product_snapshot: productSnapshot }
      }
    } : parseResult.data;
    const saved = TestRepository.saveDraft(savePayload);
    res.status(200).json(saved);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.status === 409 ? error.message : 'Failed to save test draft' });
  }
});

testRouter.get('/:id/feedback-stats', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const test = TestRepository.getById(id);
  if (!test) return res.status(404).json({ error: 'Test not found' });
  if (!test.product_id) return res.status(403).json({ error: 'Legacy feedback statistics are available only through a deliberate public feedback token.' });
  const product = ProductRepository.getById(test.product_id);
  if (!product || product.owner_id !== req.user!.id) {
    return res.status(403).json({ error: 'Only the product owner can view private feedback statistics.' });
  }
  const stats = TestRepository.getHumanFeedback(id);
  res.json({ ...stats, feedback_token: test.test.feedback_token && TestRepository.getByFeedbackToken(test.test.feedback_token) ? test.test.feedback_token : undefined });
});

// DELETE /api/tests/:id - Delete test by ID
testRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const testId = String(req.params.id);
    const test = TestRepository.getById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found or already deleted' });
    }

    if (test.product_id) {
      const product = ProductRepository.getById(test.product_id);
      if (!product || !req.user || req.user.id !== product.owner_id) {
        return res.status(403).json({ error: 'Only the product owner can delete this Synthetic Lab test.' });
      }
    }

    const success = TestRepository.deleteById(testId);
    res.json({ success, id: testId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete test', message: error.message });
  }
});
