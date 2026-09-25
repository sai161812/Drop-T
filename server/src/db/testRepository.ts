import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { 
  Test, 
  Offering, 
  Option, 
  AudienceConfig, 
  TestDraftPayload, 
  FullTestResponse,
  PrimaryLever,
  HumanResponse,
  HumanChoice,
  Profile
} from '@droptest/shared';

export class TestRepository {
  /**
   * Save or update a test draft and its associated models
   */
  static saveDraft(payload: TestDraftPayload): FullTestResponse {
    const db = getDatabase();
    const now = new Date().toISOString();
    const testId = payload.test.id || uuidv4();

    // Check if test exists
    const existingTestStmt = db.prepare('SELECT id FROM tests WHERE id = ?');
    const existingTest = existingTestStmt.get(testId);

    if (existingTest) {
      // Update existing test
      const updateTestStmt = db.prepare(`
        UPDATE tests 
        SET title = ?, domain_id = ?, updated_at = ? 
        WHERE id = ?
      `);
      updateTestStmt.run(payload.test.title, payload.test.domain_id, now, testId);
    } else {
      // Insert new test
      const insertTestStmt = db.prepare(`
        INSERT INTO tests (id, title, domain_id, created_at, updated_at, status)
        VALUES (?, ?, ?, ?, ?, 'draft')
      `);
      insertTestStmt.run(testId, payload.test.title, payload.test.domain_id, now, now);
    }

    // Save/Update Offering
    const offeringId = uuidv4();
    const existingOffering = db.prepare('SELECT id FROM offerings WHERE test_id = ?').get(testId) as { id: string } | undefined;
    
    if (existingOffering) {
      const updateOfferingStmt = db.prepare(`
        UPDATE offerings 
        SET short_value_prop = ?, description = ?, currency = ?, period = ?, domain_specific_data = ?, updated_at = ?
        WHERE test_id = ?
      `);
      updateOfferingStmt.run(
        payload.offering.short_value_prop,
        payload.offering.description,
        payload.offering.currency,
        payload.offering.period,
        JSON.stringify(payload.offering.domain_specific_data || {}),
        now,
        testId
      );
    } else {
      const insertOfferingStmt = db.prepare(`
        INSERT INTO offerings (id, test_id, short_value_prop, description, currency, period, domain_specific_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertOfferingStmt.run(
        offeringId,
        testId,
        payload.offering.short_value_prop,
        payload.offering.description,
        payload.offering.currency,
        payload.offering.period,
        JSON.stringify(payload.offering.domain_specific_data || {}),
        now,
        now
      );
    }

    // Save/Update Option A
    this.upsertOption(testId, 'A', payload.option_a, now);

    // Save/Update Option B
    this.upsertOption(testId, 'B', payload.option_b, now);

    // Save/Update AudienceConfig
    const existingAudience = db.prepare('SELECT id FROM audience_configs WHERE test_id = ?').get(testId) as { id: string } | undefined;
    if (existingAudience) {
      const updateAudienceStmt = db.prepare(`
        UPDATE audience_configs
        SET intended_buyer_description = ?, adjacent_buyer_description = ?, expected_spend_min = ?,
            expected_spend_max = ?, audience_markets = ?, comparison_lever = ?, updated_at = ?
        WHERE test_id = ?
      `);
      updateAudienceStmt.run(
        payload.audience_config.intended_buyer_description,
        payload.audience_config.adjacent_buyer_description,
        payload.audience_config.expected_spend_min,
        payload.audience_config.expected_spend_max,
        JSON.stringify(payload.audience_config.audience_markets),
        payload.comparison_lever,
        now,
        testId
      );
    } else {
      const insertAudienceStmt = db.prepare(`
        INSERT INTO audience_configs (
          id, test_id, intended_buyer_description, adjacent_buyer_description, 
          expected_spend_min, expected_spend_max, audience_markets, panel_size,
          intended_count, adjacent_count, contrasting_count, comparison_lever, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 50, 20, 20, 10, ?, ?, ?)
      `);
      insertAudienceStmt.run(
        uuidv4(),
        testId,
        payload.audience_config.intended_buyer_description,
        payload.audience_config.adjacent_buyer_description,
        payload.audience_config.expected_spend_min,
        payload.audience_config.expected_spend_max,
        JSON.stringify(payload.audience_config.audience_markets),
        payload.comparison_lever,
        now,
        now
      );
    }

    const result = this.getById(testId);
    if (!result) {
      throw new Error('Failed to retrieve test after saving');
    }
    return result;
  }

  private static upsertOption(
    testId: string, 
    optionId: 'A' | 'B', 
    data: TestDraftPayload['option_a'] | TestDraftPayload['option_b'], 
    now: string
  ): void {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM options WHERE test_id = ? AND id = ?').get(testId, optionId);

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE options
        SET name = ?, price = ?, primary_message = ?, served_markets = ?,
            fulfillment_mode = ?, images = ?, variable_cost_per_sale = ?,
            fixed_launch_cost = ?, capacity_units = ?, updated_at = ?
        WHERE test_id = ? AND id = ?
      `);
      updateStmt.run(
        data.name,
        data.price,
        data.primary_message,
        JSON.stringify(data.served_markets),
        data.fulfillment_mode,
        JSON.stringify(data.images || []),
        data.variable_cost_per_sale ?? null,
        data.fixed_launch_cost ?? null,
        data.capacity_units ?? null,
        now,
        testId,
        optionId
      );
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO options (
          id, test_id, name, price, primary_message, served_markets,
          fulfillment_mode, images, variable_cost_per_sale, fixed_launch_cost, capacity_units, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(
        optionId,
        testId,
        data.name,
        data.price,
        data.primary_message,
        JSON.stringify(data.served_markets),
        data.fulfillment_mode,
        JSON.stringify(data.images || []),
        data.variable_cost_per_sale ?? null,
        data.fixed_launch_cost ?? null,
        data.capacity_units ?? null,
        now,
        now
      );
    }
  }

  /**
   * Get full test by ID
   */
  static getById(id: string): FullTestResponse | null {
    const db = getDatabase();
    const testRow = db.prepare('SELECT * FROM tests WHERE id = ?').get(id) as any;
    if (!testRow) return null;

    const offeringRow = db.prepare('SELECT * FROM offerings WHERE test_id = ?').get(id) as any;
    const optionRows = db.prepare('SELECT * FROM options WHERE test_id = ?').all(id) as any[];
    const audienceRow = db.prepare('SELECT * FROM audience_configs WHERE test_id = ?').get(id) as any;

    if (!offeringRow || !audienceRow) return null;

    const optionA = optionRows.find(r => r.id === 'A');
    const optionB = optionRows.find(r => r.id === 'B');

    if (!optionA || !optionB) return null;

    const test: Test = {
      id: testRow.id,
      title: testRow.title,
      domain_id: testRow.domain_id,
      created_at: testRow.created_at,
      updated_at: testRow.updated_at,
      status: testRow.status
    };

    const offering: Offering = {
      id: offeringRow.id,
      test_id: offeringRow.test_id,
      short_value_prop: offeringRow.short_value_prop,
      description: offeringRow.description,
      currency: offeringRow.currency,
      period: offeringRow.period,
      domain_specific_data: JSON.parse(offeringRow.domain_specific_data || '{}'),
      created_at: offeringRow.created_at,
      updated_at: offeringRow.updated_at
    };

    const parseOption = (row: any): Option => ({
      id: row.id,
      test_id: row.test_id,
      name: row.name,
      price: row.price,
      primary_message: row.primary_message,
      served_markets: JSON.parse(row.served_markets || '[]'),
      fulfillment_mode: row.fulfillment_mode,
      images: JSON.parse(row.images || '[]'),
      variable_cost_per_sale: row.variable_cost_per_sale ?? undefined,
      fixed_launch_cost: row.fixed_launch_cost ?? undefined,
      capacity_units: row.capacity_units ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    });

    const audience_config: AudienceConfig = {
      id: audienceRow.id,
      test_id: audienceRow.test_id,
      intended_buyer_description: audienceRow.intended_buyer_description,
      adjacent_buyer_description: audienceRow.adjacent_buyer_description,
      expected_spend_min: audienceRow.expected_spend_min,
      expected_spend_max: audienceRow.expected_spend_max,
      audience_markets: JSON.parse(audienceRow.audience_markets || '[]'),
      panel_size: audienceRow.panel_size,
      intended_count: audienceRow.intended_count,
      adjacent_count: audienceRow.adjacent_count,
      contrasting_count: audienceRow.contrasting_count,
      created_at: audienceRow.created_at,
      updated_at: audienceRow.updated_at
    };

    return {
      test,
      offering,
      options: {
        A: parseOption(optionA),
        B: parseOption(optionB)
      },
      audience_config,
      comparison_lever: (audienceRow.comparison_lever as PrimaryLever) || 'price'
    };
  }

  /**
   * List all tests
   */
  static listAll(): Test[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM tests ORDER BY updated_at DESC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      domain_id: r.domain_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      status: r.status
    }));
  }

  /**
   * Delete test by ID
   */
  static deleteById(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tests WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Submit human response
   */
  static recordHumanResponse(testId: string, choice: HumanChoice, reason?: string, tokenHash?: string): HumanResponse {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO human_responses (id, test_id, choice, reason, token_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, testId, choice, reason || null, tokenHash || null, now);

    return {
      id,
      test_id: testId,
      choice,
      reason,
      created_at: now,
      token_hash: tokenHash
    };
  }

  /**
   * Get human feedback stats for a test
   */
  static getHumanFeedback(testId: string): { total: number; counts: Record<HumanChoice, number>; responses: HumanResponse[] } {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM human_responses WHERE test_id = ? ORDER BY created_at DESC').all(testId) as any[];

    const counts: Record<HumanChoice, number> = {
      A: 0,
      B: 0,
      neither: 0,
      unsure: 0
    };

    const responses: HumanResponse[] = rows.map(r => {
      const choice = r.choice as HumanChoice;
      if (counts[choice] !== undefined) {
        counts[choice]++;
      }
      return {
        id: r.id,
        test_id: r.test_id,
        choice,
        reason: r.reason || undefined,
        created_at: r.created_at
      };
    });

    return {
      total: responses.length,
      counts,
      responses
    };
  }

  /**
   * Save or replace 50 generated profiles for a test
   */
  static saveProfiles(testId: string, profiles: Profile[]): Profile[] {
    const db = getDatabase();
    
    // Begin transaction
    db.exec('BEGIN TRANSACTION;');
    try {
      // Delete existing profiles for this test
      db.prepare('DELETE FROM profiles WHERE test_id = ?').run(testId);

      const insertStmt = db.prepare(`
        INSERT INTO profiles (
          id, test_id, segment, market, budget_min, budget_max,
          use_case, constraints, priorities, access_mode, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of profiles) {
        insertStmt.run(
          p.id,
          testId,
          p.segment,
          p.market,
          p.budget_min,
          p.budget_max,
          p.use_case,
          JSON.stringify(p.constraints),
          JSON.stringify(p.priorities),
          p.access_mode,
          p.created_at
        );
      }

      db.exec('COMMIT;');
      return this.getProfiles(testId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Get all 50 profiles for a test
   */
  static getProfiles(testId: string): Profile[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM profiles WHERE test_id = ? ORDER BY id ASC').all(testId) as any[];

    return rows.map(r => ({
      id: r.id,
      test_id: r.test_id,
      segment: r.segment,
      market: r.market,
      budget_min: r.budget_min,
      budget_max: r.budget_max,
      use_case: r.use_case,
      constraints: JSON.parse(r.constraints || '[]'),
      priorities: JSON.parse(r.priorities || '[]'),
      access_mode: r.access_mode,
      created_at: r.created_at
    }));
  }

  /**
   * Delete profiles for a test
   */
  static deleteProfiles(testId: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM profiles WHERE test_id = ?').run(testId);
    return result.changes > 0;
  }
}

