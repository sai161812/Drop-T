import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { 
  Product, 
  ProductPublicSummary, 
  ProductPublicDetail, 
  ProductDraftPayloadSchema, 
  ProductCategory, 
  ProductStage, 
  ProductStatus,
  CommunityFeedbackChoice,
  CommunityFeedbackFactor,
  ProductFeedback,
  FounderFeedbackBreakdown,
  FounderFeedbackItem,
  PublicUser
} from '@droptest/shared';
import { AuthRepository } from './authRepository.js';

export class ProductRepository {
  /**
   * Create a new product (draft or published)
   */
  static create(ownerId: string, payload: any): Product {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO products (
        id, owner_id, name, category, stage, summary, intended_buyer, feedback_question,
        price, currency, availability_markets, fulfillment_mode, images, category_data,
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      ownerId,
      payload.name.trim(),
      payload.category,
      payload.stage,
      payload.summary.trim(),
      payload.intended_buyer?.trim() || '',
      payload.feedback_question?.trim() || 'What should we change before launch?',
      payload.price !== undefined && payload.price !== null ? payload.price : null,
      payload.currency || 'INR',
      JSON.stringify(payload.availability_markets ?? 'not_decided'),
      payload.fulfillment_mode || 'not_decided',
      JSON.stringify(payload.images || []),
      JSON.stringify(payload.category_data || {}),
      payload.status || 'draft',
      now,
      now
    );

    return this.getRawById(id)!;
  }

  /**
   * Update an existing product (Owner only)
   */
  static update(productId: string, ownerId: string, payload: any): Product {
    const db = getDatabase();
    const existing = this.getRawById(productId);
    if (!existing) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }
    if (existing.owner_id !== ownerId) {
      throw Object.assign(new Error('You do not have permission to edit this product'), { status: 403 });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, stage = ?, summary = ?, intended_buyer = ?, feedback_question = ?,
          price = ?, currency = ?, availability_markets = ?, fulfillment_mode = ?, images = ?,
          category_data = ?, status = ?, updated_at = ?
      WHERE id = ? AND owner_id = ?
    `);

    stmt.run(
      payload.name !== undefined ? payload.name.trim() : existing.name,
      payload.category !== undefined ? payload.category : existing.category,
      payload.stage !== undefined ? payload.stage : existing.stage,
      payload.summary !== undefined ? payload.summary.trim() : existing.summary,
      payload.intended_buyer !== undefined ? payload.intended_buyer.trim() : existing.intended_buyer,
      payload.feedback_question !== undefined ? payload.feedback_question.trim() : existing.feedback_question,
      payload.price !== undefined ? payload.price : existing.price,
      payload.currency !== undefined ? payload.currency : existing.currency,
      payload.availability_markets !== undefined ? JSON.stringify(payload.availability_markets) : JSON.stringify(existing.availability_markets),
      payload.fulfillment_mode !== undefined ? payload.fulfillment_mode : existing.fulfillment_mode,
      payload.images !== undefined ? JSON.stringify(payload.images) : JSON.stringify(existing.images),
      payload.category_data !== undefined ? JSON.stringify(payload.category_data) : JSON.stringify(existing.category_data),
      payload.status !== undefined ? payload.status : existing.status,
      now,
      productId,
      ownerId
    );

    return this.getRawById(productId)!;
  }

  /**
   * Delete product by ID (Owner only)
   */
  static delete(productId: string, ownerId: string): boolean {
    const db = getDatabase();
    const existing = this.getRawById(productId);
    if (!existing) return false;
    if (existing.owner_id !== ownerId) {
      throw Object.assign(new Error('You do not have permission to delete this product'), { status: 403 });
    }

    const res = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return res.changes > 0;
  }

  /**
   * Get raw Product record
   */
  static getRawById(id: string): Product | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      owner_id: row.owner_id,
      name: row.name,
      category: row.category as ProductCategory,
      stage: row.stage as ProductStage,
      summary: row.summary,
      intended_buyer: row.intended_buyer,
      feedback_question: row.feedback_question,
      price: row.price !== null ? row.price : null,
      currency: row.currency,
      availability_markets: JSON.parse(row.availability_markets || '"not_decided"'),
      fulfillment_mode: row.fulfillment_mode,
      images: JSON.parse(row.images || '[]'),
      category_data: JSON.parse(row.category_data || '{}'),
      status: row.status as ProductStatus,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Get full public detail of product with owner info, save count, feedback summary, and user interactions
   */
  static getPublicDetail(productId: string, currentUserId?: string): ProductPublicDetail | null {
    const db = getDatabase();
    const product = this.getRawById(productId);
    if (!product) return null;

    // Get owner public details
    const ownerUser = AuthRepository.getUserById(product.owner_id);
    if (!ownerUser) return null;
    const owner: PublicUser = AuthRepository.toPublicUser(ownerUser);

    // Get save count
    const saveCountRow = db.prepare('SELECT COUNT(*) as count FROM product_saves WHERE product_id = ?').get(productId) as { count: number };
    const saveCount = saveCountRow?.count || 0;

    // Check if current user saved
    let isSaved = false;
    if (currentUserId) {
      const userSaveRow = db.prepare('SELECT 1 FROM product_saves WHERE product_id = ? AND user_id = ?').get(productId, currentUserId);
      isSaved = Boolean(userSaveRow);
    }

    // Get feedback counts and factors
    const feedbackRows = db.prepare('SELECT choice, factor, reason, author_id FROM product_feedback WHERE product_id = ?').all(productId) as any[];
    const counts = { yes: 0, maybe: 0, no: 0 };
    const factorCounts: Record<CommunityFeedbackFactor, number> = {
      price: 0,
      design_fit: 0,
      quality_details: 0,
      availability_delivery: 0,
      usefulness: 0,
      other: 0
    };
    let userFeedback: { choice: CommunityFeedbackChoice; factor: CommunityFeedbackFactor; reason?: string } | undefined;

    for (const f of feedbackRows) {
      if (f.choice === 'yes') counts.yes++;
      else if (f.choice === 'maybe') counts.maybe++;
      else if (f.choice === 'no') counts.no++;

      if (f.factor && factorCounts[f.factor as CommunityFeedbackFactor] !== undefined) {
        factorCounts[f.factor as CommunityFeedbackFactor]++;
      }

      if (currentUserId && f.author_id === currentUserId) {
        userFeedback = {
          choice: f.choice,
          factor: f.factor,
          reason: f.reason || undefined
        };
      }
    }

    // Get current user's proposal if any
    let userProposal: { id: string; amount: number; currency: string; message: string; created_at: string } | undefined;
    if (currentUserId) {
      const propRow = db.prepare('SELECT id, amount, currency, message, created_at FROM support_proposals WHERE product_id = ? AND sender_id = ?').get(productId, currentUserId) as any;
      if (propRow) {
        userProposal = {
          id: propRow.id,
          amount: propRow.amount,
          currency: propRow.currency,
          message: propRow.message,
          created_at: propRow.created_at
        };
      }
    }

    return {
      ...product,
      owner,
      save_count: saveCount,
      is_saved: isSaved,
      feedback_summary: {
        total: feedbackRows.length,
        counts,
        factor_counts: factorCounts,
        user_feedback: userFeedback
      },
      user_proposal: userProposal
    };
  }

  /**
   * List published products in newest-first order with optional category & search filter
   */
  static listPublished(category?: string, query?: string): ProductPublicSummary[] {
    const db = getDatabase();
    let sql = `
      SELECT p.*, u.display_name as owner_name, u.startup_name,
             (SELECT COUNT(*) FROM product_saves ps WHERE ps.product_id = p.id) as save_count,
             (SELECT COUNT(*) FROM product_feedback pf WHERE pf.product_id = p.id) as feedback_count
      FROM products p
      JOIN users u ON p.owner_id = u.id
      WHERE p.status = 'published'
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (query && query.trim().length > 0) {
      sql += ` AND (lower(p.name) LIKE ? OR lower(p.summary) LIKE ? OR lower(u.startup_name) LIKE ?)`;
      const q = `%${query.trim().toLowerCase()}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map(r => ({
      id: r.id,
      owner_id: r.owner_id,
      owner_name: r.owner_name,
      startup_name: r.startup_name || undefined,
      name: r.name,
      category: r.category as ProductCategory,
      stage: r.stage as ProductStage,
      summary: r.summary,
      price: r.price !== null ? r.price : null,
      currency: r.currency,
      images: JSON.parse(r.images || '[]'),
      save_count: r.save_count || 0,
      feedback_count: r.feedback_count || 0,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  }

  /**
   * List all products owned by a founder (both draft & published)
   */
  static listByOwner(ownerId: string): (Product & { save_count: number; feedback_count: number })[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT p.*,
             (SELECT COUNT(*) FROM product_saves ps WHERE ps.product_id = p.id) as save_count,
             (SELECT COUNT(*) FROM product_feedback pf WHERE pf.product_id = p.id) as feedback_count
      FROM products p
      WHERE p.owner_id = ?
      ORDER BY p.updated_at DESC
    `).all(ownerId) as any[];

    return rows.map(r => ({
      id: r.id,
      owner_id: r.owner_id,
      name: r.name,
      category: r.category as ProductCategory,
      stage: r.stage as ProductStage,
      summary: r.summary,
      intended_buyer: r.intended_buyer,
      feedback_question: r.feedback_question,
      price: r.price !== null ? r.price : null,
      currency: r.currency,
      availability_markets: JSON.parse(r.availability_markets || '"not_decided"'),
      fulfillment_mode: r.fulfillment_mode,
      images: JSON.parse(r.images || '[]'),
      category_data: JSON.parse(r.category_data || '{}'),
      status: r.status as ProductStatus,
      created_at: r.created_at,
      updated_at: r.updated_at,
      save_count: r.save_count || 0,
      feedback_count: r.feedback_count || 0
    }));
  }

  /**
   * Save or unsave a product for a user.
   * Returns whether it is saved and the new save count.
   */
  static toggleSave(userId: string, productId: string, targetState?: boolean): { is_saved: boolean; save_count: number } {
    const db = getDatabase();
    const product = this.getRawById(productId);
    if (!product) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }

    const existing = db.prepare('SELECT 1 FROM product_saves WHERE user_id = ? AND product_id = ?').get(userId, productId);
    let isSaved: boolean;

    if (targetState === undefined) {
      isSaved = !existing;
    } else {
      isSaved = targetState;
    }

    if (isSaved && !existing) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO product_saves (id, user_id, product_id, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, product_id) DO NOTHING
      `).run(uuidv4(), userId, productId, now);
    } else if (!isSaved && existing) {
      db.prepare('DELETE FROM product_saves WHERE user_id = ? AND product_id = ?').run(userId, productId);
    }

    const countRow = db.prepare('SELECT COUNT(*) as count FROM product_saves WHERE product_id = ?').get(productId) as { count: number };
    return {
      is_saved: isSaved,
      save_count: countRow?.count || 0
    };
  }

  /**
   * List all products saved by a specific user (newest saved first)
   */
  static listSavedByUser(userId: string): ProductPublicSummary[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT p.*, u.display_name as owner_name, u.startup_name,
             (SELECT COUNT(*) FROM product_saves ps WHERE ps.product_id = p.id) as save_count,
             (SELECT COUNT(*) FROM product_feedback pf WHERE pf.product_id = p.id) as feedback_count
      FROM product_saves user_saves
      JOIN products p ON user_saves.product_id = p.id
      JOIN users u ON p.owner_id = u.id
      WHERE user_saves.user_id = ? AND p.status = 'published'
      ORDER BY user_saves.created_at DESC
    `).all(userId) as any[];

    return rows.map(r => ({
      id: r.id,
      owner_id: r.owner_id,
      owner_name: r.owner_name,
      startup_name: r.startup_name || undefined,
      name: r.name,
      category: r.category as ProductCategory,
      stage: r.stage as ProductStage,
      summary: r.summary,
      price: r.price !== null ? r.price : null,
      currency: r.currency,
      images: JSON.parse(r.images || '[]'),
      save_count: r.save_count || 0,
      feedback_count: r.feedback_count || 0,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  }

  /**
   * Upsert a structured feedback response from an account.
   * Editing an existing response alters the distribution without increasing total respondent count.
   */
  static upsertFeedback(
    authorId: string, 
    productId: string, 
    payload: { choice: CommunityFeedbackChoice; factor: CommunityFeedbackFactor; reason?: string }
  ): { feedback: ProductFeedback; feedback_summary: ProductPublicDetail['feedback_summary'] } {
    const db = getDatabase();
    const product = this.getRawById(productId);
    if (!product) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id, created_at FROM product_feedback WHERE author_id = ? AND product_id = ?').get(authorId, productId) as any;

    let feedbackId: string;
    let createdAt: string;

    if (existing) {
      feedbackId = existing.id;
      createdAt = existing.created_at;
      db.prepare(`
        UPDATE product_feedback 
        SET choice = ?, factor = ?, reason = ?, updated_at = ?
        WHERE author_id = ? AND product_id = ?
      `).run(payload.choice, payload.factor, payload.reason || null, now, authorId, productId);
    } else {
      feedbackId = uuidv4();
      createdAt = now;
      db.prepare(`
        INSERT INTO product_feedback (id, author_id, product_id, choice, factor, reason, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(feedbackId, authorId, productId, payload.choice, payload.factor, payload.reason || null, now, now);
    }

    // Compute fresh summary
    const feedbackRows = db.prepare('SELECT choice, factor, reason, author_id FROM product_feedback WHERE product_id = ?').all(productId) as any[];
    const counts = { yes: 0, maybe: 0, no: 0 };
    const factorCounts: Record<CommunityFeedbackFactor, number> = {
      price: 0,
      design_fit: 0,
      quality_details: 0,
      availability_delivery: 0,
      usefulness: 0,
      other: 0
    };

    for (const f of feedbackRows) {
      if (f.choice === 'yes') counts.yes++;
      else if (f.choice === 'maybe') counts.maybe++;
      else if (f.choice === 'no') counts.no++;

      if (f.factor && factorCounts[f.factor as CommunityFeedbackFactor] !== undefined) {
        factorCounts[f.factor as CommunityFeedbackFactor]++;
      }
    }

    const feedback: ProductFeedback = {
      id: feedbackId,
      author_id: authorId,
      product_id: productId,
      choice: payload.choice,
      factor: payload.factor,
      reason: payload.reason || undefined,
      created_at: createdAt,
      updated_at: now
    };

    return {
      feedback,
      feedback_summary: {
        total: feedbackRows.length,
        counts,
        factor_counts: factorCounts,
        user_feedback: {
          choice: payload.choice,
          factor: payload.factor,
          reason: payload.reason || undefined
        }
      }
    };
  }

  /**
   * Get full founder feedback breakdown with respondent identity, role, and reasons.
   * Product owner only.
   */
  static getFounderFeedbackBreakdown(productId: string, ownerId: string): FounderFeedbackBreakdown {
    const db = getDatabase();
    const product = this.getRawById(productId);
    if (!product) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }
    if (product.owner_id !== ownerId) {
      throw Object.assign(new Error('Only the product owner can access detailed feedback breakdown'), { status: 403 });
    }

    const rows = db.prepare(`
      SELECT pf.id, pf.choice, pf.factor, pf.reason, pf.created_at, pf.updated_at,
             u.id as author_id, u.display_name, u.role, u.startup_name
      FROM product_feedback pf
      JOIN users u ON pf.author_id = u.id
      WHERE pf.product_id = ?
      ORDER BY pf.updated_at DESC
    `).all(productId) as any[];

    const counts = { yes: 0, maybe: 0, no: 0 };
    const factorCounts: Record<CommunityFeedbackFactor, number> = {
      price: 0,
      design_fit: 0,
      quality_details: 0,
      availability_delivery: 0,
      usefulness: 0,
      other: 0
    };

    const responses: FounderFeedbackItem[] = [];

    for (const r of rows) {
      if (r.choice === 'yes') counts.yes++;
      else if (r.choice === 'maybe') counts.maybe++;
      else if (r.choice === 'no') counts.no++;

      if (r.factor && factorCounts[r.factor as CommunityFeedbackFactor] !== undefined) {
        factorCounts[r.factor as CommunityFeedbackFactor]++;
      }

      responses.push({
        id: r.id,
        author: {
          id: r.author_id,
          display_name: r.display_name,
          role: r.role,
          startup_name: r.startup_name || undefined
        },
        choice: r.choice,
        factor: r.factor,
        reason: r.reason || undefined,
        created_at: r.created_at,
        updated_at: r.updated_at
      });
    }

    return {
      total: rows.length,
      counts,
      factor_counts: factorCounts,
      responses
    };
  }
}
