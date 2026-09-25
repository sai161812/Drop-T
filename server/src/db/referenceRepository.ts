import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { CompetitorReference, EvidenceType } from '@droptest/shared';
import { SearchService } from '../search/searchService.js';

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

  /**
   * Save a list of newly retrieved references (replacing or merging without duplicates)
   */
  static saveReferences(productId: string, references: CompetitorReference[]): void {
    if (references.length === 0) return;
    const db = getDatabase();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO competitor_references (
        id, product_id, query, title, url, domain, snippet_or_fact,
        source_type, evidence_type, supported_facts, founder_note, selected, date_checked, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const existingSelected = this.getSelectedByProductId(productId);
    let selectedCount = existingSelected.length;

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const ref of references) {
        // Check if domain or url already exists for this product
        const existing = db.prepare(`
          SELECT id FROM competitor_references
          WHERE product_id = ? AND (url = ? OR domain = ?)
        `).get(productId, ref.url, ref.domain);

        if (!existing) {
          const isSelected = (ref.selected !== false && selectedCount < 5) ? 1 : 0;
          if (isSelected === 1) selectedCount++;

          insertStmt.run(
            ref.id || uuidv4(),
            productId,
            ref.query,
            ref.title,
            ref.url,
            ref.domain,
            ref.snippet_or_fact,
            ref.source_type,
            ref.evidence_type || 'retrieved_snippet',
            JSON.stringify(ref.supported_facts || []),
            ref.founder_note || null,
            isSelected,
            ref.date_checked || now,
            ref.created_at || now
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
    const domain = SearchService.extractDomain(data.url);
    const currentSelected = this.getSelectedByProductId(productId);

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
        source_type, evidence_type, supported_facts, founder_note, selected, date_checked, created_at
      )
      VALUES (?, ?, 'founder_manual_entry', ?, ?, ?, ?, 'founder_supplied', 'founder_manual_note', ?, ?, 1, ?, ?)
    `);

    stmt.run(
      id,
      productId,
      data.title.trim(),
      data.url.trim(),
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
      const refCode = `[REF-${index + 1}:${ref.id.slice(0, 8)}]`;
      lines.push(`${refCode} "${ref.title}" (domain: ${ref.domain})`);
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
      created_at: row.created_at || row.date_checked
    };
  }
}
