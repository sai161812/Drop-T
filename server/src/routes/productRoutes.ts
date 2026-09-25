import { Router, Request, Response } from 'express';
import { 
  ProductDraftPayloadSchema, 
  ProductPublishPayloadSchema,
  CommunityFeedbackSubmissionSchema,
  SupportProposalSubmissionSchema,
  ManualReferencePayloadSchema
} from '@droptest/shared';
import { ProductRepository } from '../db/productRepository.js';
import { TestRepository } from '../db/testRepository.js';
import { ReferenceRepository } from '../db/referenceRepository.js';
import { SearchService } from '../search/searchService.js';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/authMiddleware.js';

export const productRouter = Router();

// GET /api/products - Public Feed of Published Products (Newest-first)
productRouter.get('/', (req: Request, res: Response) => {
  try {
    const category = req.query.category ? String(req.query.category) : undefined;
    const query = req.query.q ? String(req.query.q) : undefined;

    const products = ProductRepository.listPublished(category, query);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load product feed', message: err.message });
  }
});

// GET /api/products/my - Products owned by authenticated startup
productRouter.get('/my', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = ProductRepository.listByOwner(req.user!.id);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load your products', message: err.message });
  }
});

// GET /api/products/saved/all - Products saved by authenticated user (All roles)
productRouter.get('/saved/all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = ProductRepository.listSavedByUser(req.user!.id);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load saved products', message: err.message });
  }
});

// GET /api/products/proposals/incoming - Support proposals received for founder's products (Owner only)
productRouter.get('/proposals/incoming', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const proposals = ProductRepository.getReceivedProposals(req.user!.id);
    res.json({ proposals });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load incoming support proposals', message: err.message });
  }
});

// GET /api/products/:id - Full public detail of a product
productRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const detail = ProductRepository.getPublicDetail(productId, req.user?.id);

    if (!detail) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If draft, only owner can view
    if (detail.status === 'draft') {
      if (!req.user || req.user.id !== detail.owner_id) {
        return res.status(404).json({ error: 'Product not found' });
      }
    }

    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve product details', message: err.message });
  }
});

// POST /api/products - Create a new product (draft or published)
productRouter.post('/', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const isPublishing = req.body.status === 'published';
    const schema = isPublishing ? ProductPublishPayloadSchema : ProductDraftPayloadSchema;
    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: isPublishing ? 'Please fill all required fields before publishing' : 'Invalid product inputs',
        issues: parseResult.error.issues
      });
    }

    const created = ProductRepository.create(req.user!.id, parseResult.data);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create product', message: err.message });
  }
});

// PUT /api/products/:id - Update product (Owner only)
productRouter.put('/:id', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const isPublishing = req.body.status === 'published';
    const schema = isPublishing ? ProductPublishPayloadSchema : ProductDraftPayloadSchema;
    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: isPublishing ? 'Please fill all required fields before publishing' : 'Invalid product inputs',
        issues: parseResult.error.issues
      });
    }

    const updated = ProductRepository.update(productId, req.user!.id, parseResult.data);
    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to update product'
    });
  }
});

// DELETE /api/products/:id - Delete product (Owner only)
productRouter.delete('/:id', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const success = ProductRepository.delete(productId, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    res.json({ success: true, id: productId });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to delete product'
    });
  }
});

// POST /api/products/:id/save - Toggle Save / Unsave product (All roles)
productRouter.post('/:id/save', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    if (req.body.saved !== undefined && typeof req.body.saved !== 'boolean') {
      return res.status(400).json({ error: 'saved must be a boolean' });
    }
    const targetState = req.body.saved;
    const result = ProductRepository.toggleSave(req.user!.id, productId, targetState);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to update saved state'
    });
  }
});

// POST /api/products/:id/feedback - Submit or edit structured feedback (All roles)
productRouter.post('/:id/feedback', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const parseResult = CommunityFeedbackSubmissionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid feedback submission',
        issues: parseResult.error.issues
      });
    }

    const result = ProductRepository.upsertFeedback(req.user!.id, productId, parseResult.data);
    res.json({
      success: true,
      feedback: result.feedback,
      feedback_summary: result.feedback_summary
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to record feedback'
    });
  }
});

// GET /api/products/:id/feedback/breakdown - Detailed feedback breakdown (Owner only)
productRouter.get('/:id/feedback/breakdown', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const breakdown = ProductRepository.getFounderFeedbackBreakdown(productId, req.user!.id);
    res.json(breakdown);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to load feedback breakdown'
    });
  }
});

// POST /api/products/:id/support - Submit or edit a support proposal (Sponsor / Startup only)
productRouter.post('/:id/support', requireAuth, requireRole(['sponsor', 'startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const parseResult = SupportProposalSubmissionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid support proposal',
        issues: parseResult.error.issues
      });
    }

    const proposal = ProductRepository.upsertSupportProposal(req.user!.id, productId, parseResult.data);
    res.json({
      success: true,
      proposal
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to submit support proposal'
    });
  }
});

// GET /api/products/:id/lab - Get product-linked lab test or prefill payload (Owner only)
productRouter.get('/:id/lab', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can access this Synthetic Lab.' });
    }

    const startNewReview = req.query.review === 'new';
    const existingTest = startNewReview ? null : TestRepository.findTestByProductId(productId);
    if (existingTest) {
      const run = TestRepository.getLatestRunByTestId(existingTest.test.id);
      return res.json({
        product,
        test: existingTest,
        run,
        is_prefilled: false
      });
    }

    // Map domain_id
    const domainId = product.category as any;
    const markets = Array.isArray(product.availability_markets) ? product.availability_markets : [];
    const price = product.price ?? 0;
    const categoryData = product.category_data || {};
    const labSpecifics = product.category === 'digital_products_services'
      ? {
          lab_price_status: product.price === null ? 'unknown' : 'known',
          core_use_case: categoryData.core_use_case || categoryData.main_function || 'not_decided',
          platform_language: [categoryData.platform, categoryData.language].filter(Boolean).join(' / ') || categoryData.platform_language || 'not_decided',
          pricing_type: ['one_time', 'subscription'].includes(categoryData.pricing_type) ? categoryData.pricing_type : 'not_decided',
          service_support_availability: categoryData.service_support_availability
        }
        : product.category === 'other'
        ? { lab_price_status: product.price === null ? 'unknown' : 'known', specification_text: categoryData.specification_text || categoryData.specs || 'not_decided' }
        : product.category === 'local_food_beverages'
          ? {
              lab_price_status: product.price === null ? 'unknown' : 'known',
              item_name: categoryData.item_name || product.name,
              portion: categoryData.portion || 'not_decided',
              ingredients_allergens: categoryData.ingredients_allergens || 'not_decided',
              pickup_delivery_mode: categoryData.pickup_delivery_mode || 'not_decided',
              availability_window: categoryData.availability_window
            }
          : {
              lab_price_status: product.price === null ? 'unknown' : 'known',
              item_type: categoryData.item_type || product.name,
              material: categoryData.material || 'not_decided',
              fit: categoryData.fit || 'not_decided',
              sizes: Array.isArray(categoryData.sizes) ? categoryData.sizes : []
            };

    const prefilledPayload = {
      mode: 'single' as const,
      product_id: product.id,
      test: {
        product_id: product.id,
        title: `${product.name} — Synthetic Review`,
        domain_id: domainId
      },
      offering: {
        short_value_prop: product.summary.slice(0, 150),
        description: product.summary,
        currency: product.currency || 'INR',
        period: 'launch_batch',
        domain_specific_data: labSpecifics
      },
      option_a: {
        name: product.name,
        price,
        primary_message: product.summary.slice(0, 200),
        served_markets: markets,
        fulfillment_mode: product.fulfillment_mode === 'not_decided' ? '' : product.fulfillment_mode,
        images: product.images || []
      },
      audience_config: {
        intended_buyer_description: product.intended_buyer || '',
        adjacent_buyer_description: '',
        expected_spend_min: 0,
        expected_spend_max: 0,
        audience_markets: []
      },
      comparison_lever: 'price' as const
    };

    res.json({
      product,
      test: null,
      run: null,
      prefilled_payload: prefilledPayload,
      is_prefilled: true
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load Synthetic Lab for product' });
  }
});

// GET /api/products/:id/lab/preflight - Preflight inspection for Synthetic Lab (Owner only)
productRouter.get('/:id/lab/preflight', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can access preflight.' });
    }

    const missingPrice = product.price === null;
    const missingMarkets = product.availability_markets === 'not_decided' || (Array.isArray(product.availability_markets) && product.availability_markets.length === 0);
    const missingBuyer = !product.intended_buyer || product.intended_buyer.trim().length === 0;
    const searchStatus = SearchService.getProviderStatus();
    const existingRefs = ReferenceRepository.getSelectedByProductId(productId);

    res.json({
      product_id: product.id,
      product_name: product.name,
      trial_price_allowed: true,
      concept_fit_mode: missingPrice,
      missing_price: missingPrice,
      missing_markets: missingMarkets,
      missing_served_markets: missingMarkets,
      missing_audience_markets: true,
      missing_buyer: missingBuyer,
      suggested_markets: [],
      suggested_spend_min: null,
      suggested_spend_max: null,
      missing_audience_budget: true,
      missing_adjacent_group: true,
      search_provider_status: searchStatus,
      selected_references_count: existingRefs.length,
      research_status: existingRefs.length > 0 ? 'completed' : 'without_research',
      research_label: existingRefs.length > 0 ? `Market Research Ready (${existingRefs.length} references)` : 'Direct Simulation (No Research)',
      mode: 'single',
      expected_evaluations: 50,
      optional_manufacturing_costs: 'Optional — does not block simulation'
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Preflight check failed' });
  }
});

// GET /api/products/:id/research/status - Check search provider status
productRouter.get('/:id/research/status', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can inspect research status.' });
    }

    const status = SearchService.getProviderStatus();
    const query = SearchService.buildSearchQuery(product);
    res.json({ status, suggested_query: query });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to get research status' });
  }
});

// POST /api/products/:id/research/search - Find comparable products via automatic web search
productRouter.post('/:id/research/search', requireAuth, requireRole(['startup']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can run research for this product.' });
    }

    const customQuery = req.body.query ? String(req.body.query) : undefined;
    const searchResult = await SearchService.searchComparableProducts(product, customQuery);

    if (searchResult.status === 'completed' && searchResult.references.length > 0) {
      ReferenceRepository.saveReferences(product.id, searchResult.references);
    }

    const currentReferences = ReferenceRepository.listByProductId(product.id);

    res.json({
      status: searchResult.status,
      query: searchResult.query,
      provider: searchResult.provider,
      error: searchResult.error,
      references: currentReferences,
      selected_count: currentReferences.filter(r => r.selected).length
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Search execution failed' });
  }
});

// GET /api/products/:id/research/references - List all references for a product
productRouter.get('/:id/research/references', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can access references.' });
    }

    const references = ReferenceRepository.listByProductId(productId);
    res.json({ references });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to retrieve references' });
  }
});

// POST /api/products/:id/research/references/manual - Founder manually adds a competitor URL + note
productRouter.post('/:id/research/references/manual', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can add references.' });
    }

    const parseResult = ManualReferencePayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid manual reference details', issues: parseResult.error.issues });
    }

    const created = ReferenceRepository.addManualReference(productId, parseResult.data);
    res.status(201).json({ reference: created });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to add manual reference' });
  }
});

// PATCH /api/products/:id/research/references/:refId - Toggle selection (max 5)
productRouter.patch('/:id/research/references/:refId', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const refId = String(req.params.refId);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can modify references.' });
    }

    if (req.body.selected !== undefined && typeof req.body.selected !== 'boolean') {
      return res.status(400).json({ error: 'selected must be a boolean' });
    }
    const selected = req.body.selected ?? true;
    const reference = ReferenceRepository.getByProductAndId(productId, refId);
    if (!reference) return res.status(404).json({ error: 'Reference not found for this product' });
    if (selected) {
      const currentSelected = ReferenceRepository.getSelectedByProductId(productId);
      if (currentSelected.length >= 5 && !currentSelected.some(r => r.id === refId)) {
        return res.status(400).json({ error: 'You can select up to 5 references for simulation.' });
      }
    }

    const success = ReferenceRepository.toggleSelected(productId, refId, selected);
    if (!success) return res.status(404).json({ error: 'Reference not found' });

    res.json({ success: true, reference: ReferenceRepository.getByProductAndId(productId, refId) });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update reference selection' });
  }
});

// DELETE /api/products/:id/research/references/:refId - Delete a reference
productRouter.delete('/:id/research/references/:refId', requireAuth, requireRole(['startup']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = String(req.params.id);
    const refId = String(req.params.refId);
    const product = ProductRepository.getById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the product owner can delete references.' });
    }

    if (!ReferenceRepository.getByProductAndId(productId, refId)) {
      return res.status(404).json({ error: 'Reference not found for this product' });
    }
    const success = ReferenceRepository.deleteReference(productId, refId);
    if (!success) return res.status(404).json({ error: 'Reference not found' });

    res.json({ success: true, id: refId });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to delete reference' });
  }
});
