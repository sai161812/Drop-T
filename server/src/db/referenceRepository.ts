import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { CompetitorReference, EvidenceType } from '@droptest/shared';
import { SearchService } from '../search/searchService.js';
import { ResearchRepository } from './researchRepository.js';

export class ReferenceRepository {
  /**
   * List all competitor references for a product (both automated and manual)
   */
  static listByProductId(productId: string): CompetitorReference[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM competitor_references
      WHERE product_id = ?
      ORDER BY date_checked DESC
    `).all(productId) as any[];

    return rows.map(r => this.mapRow(r));
  }

  /**
   * Get only selected references for a product (max 5)
   */
  static getSelectedByProductId(productId: string): CompetitorReference[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM competitor_references
      WHERE product_id = ? AND selected = 1
      ORDER BY date_checked DESC
      LIMIT 5
    `).all(productId) as any[];

    return rows.map(r => this.mapRow(r));
  }

  static listForAttempt(productId: string, attemptId?: string): CompetitorReference[] {
    const rows = getDatabase().prepare(`
      SELECT * FROM competitor_references
      WHERE product_id = ? AND (source_type = 'founder_supplied' OR research_attempt_id = ?)
      ORDER BY source_type = 'founder_supplied' DESC, date_checked DESC
    `).all(productId, attemptId || '') as any[];
    return rows.map(row => this.mapRow(row));
  }

  static getSelectedForAttempt(productId: string, attemptId?: string): CompetitorReference[] {
    return this.listForAttempt(productId, attemptId).filter(ref => ref.selected).slice(0, 5);
  }

  /**
   * Save a list of newly retrieved references (replacing or merging without duplicates)
   */
  static saveReferences(productId: string, references: CompetitorReference[], attemptId?: string): void {
    if (references.length === 0) return;
    const db = getDatabase();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO competitor_references (
        id, product_id, query, title, url, domain, snippet_or_fact,
        source_type, evidence_type, supported_facts, founder_note, selected, date_checked, created_at, research_attempt_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const existingSelected = this.getSelectedForAttempt(productId, attemptId);
    let selectedCount = existingSelected.length;

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const ref of references) {
        const canonicalUrl = SearchService.canonicalizeUrl(ref.url);
        // A URL is unique inside one attempt; separate pages on one domain remain valid.
        const existing = db.prepare(`
          SELECT id FROM competitor_references
          WHERE product_id = ? AND url = ? AND COALESCE(research_attempt_id, '') = COALESCE(?, '')
        `).get(productId, canonicalUrl, attemptId || null);

        if (!existing) {
          const isSelected = (ref.selected !== false && selectedCount < 5) ? 1 : 0;
          if (isSelected === 1) selectedCount++;

          insertStmt.run(
            ref.id || uuidv4(),
            productId,
            ref.query,
            ref.title,
            canonicalUrl,
            SearchService.extractDomain(canonicalUrl),
            ref.snippet_or_fact,
            ref.source_type,
            ref.evidence_type || 'retrieved_snippet',
            JSON.stringify(ref.supported_facts || []),
            ref.founder_note || null,
            isSelected,
            ref.date_checked || now,
            ref.created_at || now,
            attemptId || ref.research_attempt_id || null
          );
        }
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Add a manual competitor reference entered by the founder
   */
  static addManualReference(
    productId: string,
    data: { url: string; title: string; note: string }
  ): CompetitorReference {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const canonicalUrl = SearchService.canonicalizeUrl(data.url);
    try {
      const parsed = new URL(canonicalUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('unsupported protocol');
    } catch {
      throw Object.assign(new Error('Reference URL must be a valid HTTP(S) URL.'), { status: 400 });
    }
    const domain = SearchService.extractDomain(canonicalUrl);
    const duplicate = db.prepare('SELECT id FROM competitor_references WHERE product_id = ? AND url = ?').get(productId, canonicalUrl);
    if (duplicate) throw Object.assign(new Error('This URL is already attached to the product.'), { status: 409 });
    const currentAttempt = ResearchRepository.getLatestForProduct(productId);
    const currentSelected = this.getSelectedForAttempt(productId, currentAttempt?.id);

    // If already 5 selected, unselect the lowest-priority automated reference to keep total selected <= 5
    if (currentSelected.length >= 5) {
      const oldestAutomated = currentSelected.find(r => r.source_type === 'automated') || currentSelected[currentSelected.length - 1];
      if (oldestAutomated) {
        db.prepare('UPDATE competitor_references SET selected = 0 WHERE id = ?').run(oldestAutomated.id);
      }
    }

    const stmt = db.prepare(`
      INSERT INTO competitor_references (
        id, product_id, query, title, url, domain, snippet_or_fact,
        source_type, evidence_type, supported_facts, founder_note, selected, date_checked, created_at, research_attempt_id
      )
      VALUES (?, ?, 'founder_manual_entry', ?, ?, ?, ?, 'founder_supplied', 'founder_manual_note', ?, ?, 1, ?, ?, NULL)
    `);

    stmt.run(
      id,
      productId,
      data.title.trim(),
      canonicalUrl,
      domain,
      data.note.trim(),
      JSON.stringify([`Founder note: ${data.note.trim()}`]),
      data.note.trim(),
      now,
      now
    );

    return this.getByProductAndId(productId, id)!;
  }

  /**
   * Get single reference by ID
   */
  static getById(id: string): CompetitorReference | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM competitor_references WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  static getByProductAndId(productId: string, id: string): CompetitorReference | null {
    const row = getDatabase().prepare(
      'SELECT * FROM competitor_references WHERE product_id = ? AND id = ?'
    ).get(productId, id) as any;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Toggle selection state of a reference
   */
  static toggleSelected(productId: string, id: string, selected: boolean): boolean {
    const db = getDatabase();
    const res = db.prepare('UPDATE competitor_references SET selected = ? WHERE product_id = ? AND id = ?').run(selected ? 1 : 0, productId, id);
    return res.changes > 0;
  }

  /**
   * Delete a reference
   */
  static deleteReference(productId: string, id: string): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM competitor_references WHERE product_id = ? AND id = ?').run(productId, id);
    return res.changes > 0;
  }

  /**
   * Cleanly format compact reference summary for simulation prompts
   */
  static formatReferenceSummary(references: CompetitorReference[]): string {
    if (!references || references.length === 0) {
      return 'No external market competitors or references were attached to this review.';
    }

    const lines: string[] = ['--- MARKET COMPETITORS & COMPARABLE PRODUCTS ---'];
    references.forEach((ref, index) => {
      const refCode = `REF-${index + 1}`;
      lines.push(`[${refCode}] full_id=${ref.id} "${ref.title}" (domain: ${ref.domain})`);
      lines.push(`  Source Type: ${ref.evidence_type === 'founder_manual_note' ? 'Founder-Supplied Manual Note' : 'Retrieved Web Snippet'}`);
      if (ref.supported_facts && ref.supported_facts.length > 0) {
        lines.push(`  Supported Facts: ${ref.supported_facts.join('; ')}`);
      } else {
        lines.push(`  Facts: ${ref.snippet_or_fact}`);
      }
      if (ref.founder_note) {
        lines.push(`  Founder Note: ${ref.founder_note}`);
      }
    });

    return lines.join('\n');
  }

  static resolveSourceId(rawId: unknown, references: CompetitorReference[]): string | null {
    const value = String(rawId ?? '').trim();
    const aliasMatch = value.match(/^\[?REF-(\d+)\]?$/i);
    if (aliasMatch) return references[Number(aliasMatch[1]) - 1]?.id || null;
    return references.find(ref => ref.id.toLowerCase() === value.toLowerCase())?.id || null;
  }

  static buildComparisonSummary(product: any, references: CompetitorReference[]): string {
    if (!references.length) return 'No selected external sources. Market overlap and differences are unknown.';
    const productFacts = [product?.summary, product?.category_data?.core_use_case, product?.category_data?.main_function]
      .filter(Boolean).join(' ').toLowerCase();
    const lines = references.map((ref, index) => {
      const facts = (ref.supported_facts.length ? ref.supported_facts : [ref.snippet_or_fact]).filter(Boolean);
      const overlap = facts.find(fact => fact.toLowerCase().split(/\W+/).some(token => token.length > 4 && productFacts.includes(token)));
      return `REF-${index + 1}: overlap=${overlap || 'unknown'}; verified_difference=${facts[0] || 'unknown'}; missing_facts=pricing/specifications not present in the retrieved evidence are unknown.`;
    });
    return `Selected-source comparison (evidence only):\n${lines.join('\n')}`;
  }

  private static mapRow(row: any): CompetitorReference {
    let supportedFacts: string[] = [];
    try {
      supportedFacts = JSON.parse(row.supported_facts || '[]');
    } catch {
      supportedFacts = row.snippet_or_fact ? [row.snippet_or_fact] : [];
    }

    return {
      id: row.id,
      product_id: row.product_id,
      query: row.query,
      title: row.title,
      url: row.url,
      domain: row.domain,
      snippet_or_fact: row.snippet_or_fact,
      source_type: (row.source_type as any) || 'automated',
      evidence_type: (row.evidence_type as any) || (row.source_type === 'founder_supplied' ? 'founder_manual_note' : 'retrieved_snippet'),
      supported_facts: supportedFacts,
      founder_note: row.founder_note || undefined,
      selected: Boolean(row.selected),
      date_checked: row.date_checked,
      created_at: row.created_at || row.date_checked,
      research_attempt_id: row.research_attempt_id || undefined
    };
  }
}
