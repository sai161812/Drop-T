import { Router, Request, Response } from 'express';
import { 
  ProductDraftPayloadSchema, 
  ProductPublishPayloadSchema,
  CommunityFeedbackSubmissionSchema,
  SupportProposalSubmissionSchema
} from '@droptest/shared';
import { ProductRepository } from '../db/productRepository.js';
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
    const targetState = req.body.saved !== undefined ? Boolean(req.body.saved) : undefined;
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
