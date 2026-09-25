import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { ResearchAttempt, ResearchAttemptStatus } from '@droptest/shared';
import { getDatabase } from './database.js';

function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = stable(value[key]);
      return out;
    }, {} as Record<string, any>);
  }
  return value;
}

export class ResearchRepository {
  static fingerprint(input: any): string {
    const relevant = {
      name: input?.name,
      category: input?.category,
      summary: input?.summary,
      price: input?.price,
      currency: input?.currency,
      intended_buyer: input?.intended_buyer,
      availability_markets: input?.availability_markets,
      fulfillment_mode: input?.fulfillment_mode,
      category_data: input?.category_data
    };
    return createHash('sha256').update(JSON.stringify(stable(relevant))).digest('hex');
  }

  static start(productId: string, fingerprint: string, query: string, provider: string): ResearchAttempt {
    const attempt: ResearchAttempt = {
      id: uuidv4(), product_id: productId, input_fingerprint: fingerprint,
      query, provider, status: 'pending', started_at: new Date().toISOString()
    };
    getDatabase().prepare(`INSERT INTO research_attempts
      (id, product_id, input_fingerprint, query, provider, status, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(attempt.id, productId, fingerprint, query, provider, attempt.status, attempt.started_at);
    return attempt;
  }

  static finish(id: string, status: ResearchAttemptStatus, provider: string, error?: string, comparison?: string): ResearchAttempt {
    const completedAt = new Date().toISOString();
    getDatabase().prepare(`UPDATE research_attempts SET status = ?, provider = ?, error_message = ?, comparison_summary = ?, completed_at = ? WHERE id = ?`)
      .run(status, provider, error || null, comparison || null, completedAt, id);
    return this.getById(id)!;
  }

  static recordSkipped(productId: string, fingerprint: string, query: string): ResearchAttempt {
    const attempt = this.start(productId, fingerprint, query, 'none');
    return this.finish(attempt.id, 'skipped', 'none');
  }

  static getById(id: string): ResearchAttempt | null {
    const row = getDatabase().prepare('SELECT * FROM research_attempts WHERE id = ?').get(id) as any;
    return row ? this.map(row) : null;
  }

  static getLatest(productId: string, fingerprint: string): ResearchAttempt | null {
    const row = getDatabase().prepare(`SELECT * FROM research_attempts
      WHERE product_id = ? AND input_fingerprint = ? ORDER BY started_at DESC, rowid DESC LIMIT 1`)
      .get(productId, fingerprint) as any;
    return row ? this.map(row) : null;
  }

  static getLatestForProduct(productId: string): ResearchAttempt | null {
    const row = getDatabase().prepare('SELECT * FROM research_attempts WHERE product_id = ? ORDER BY started_at DESC, rowid DESC LIMIT 1')
      .get(productId) as any;
    return row ? this.map(row) : null;
  }

  private static map(row: any): ResearchAttempt {
    return {
      id: row.id, product_id: row.product_id, input_fingerprint: row.input_fingerprint,
      query: row.query, provider: row.provider, status: row.status,
      error_message: row.error_message || undefined,
      comparison_summary: row.comparison_summary || undefined,
      started_at: row.started_at, completed_at: row.completed_at || undefined
    };
  }
}
