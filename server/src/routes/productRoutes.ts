import { Router, Request, Response } from 'express';
import { 
  ProductDraftPayloadSchema, 
  ProductPublishPayloadSchema 
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
