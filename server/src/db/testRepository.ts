import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'node:crypto';
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
  Profile,
  Run,
  Evaluation,
  RunStatus,
  CompetitorReference
} from '@droptest/shared';

export class TestRepository {
  /**
   * Save or update a test draft and its associated models
   */
  static saveDraft(payload: TestDraftPayload): FullTestResponse {
    const db = getDatabase();
    if (payload.test.id && this.getLatestRunByTestId(payload.test.id)) {
      throw Object.assign(new Error('This test has a frozen run. Save a new test to change its inputs.'), { status: 409 });
    }
    db.exec('BEGIN');
    try {
    const now = new Date().toISOString();
    const testId = payload.test.id || uuidv4();
    const productId = payload.product_id || payload.test.product_id || null;

    // Check if test exists
    const existingTestStmt = db.prepare('SELECT id, feedback_token FROM tests WHERE id = ?');
    const existingTest = existingTestStmt.get(testId) as { id: string; feedback_token?: string } | undefined;
    const feedbackToken = existingTest?.feedback_token || randomBytes(24).toString('hex');

    if (existingTest) {
      // Update existing test
      const updateTestStmt = db.prepare(`
        UPDATE tests 
        SET title = ?, domain_id = ?, feedback_token = ?, product_id = ?, updated_at = ? 
        WHERE id = ?
      `);
      updateTestStmt.run(payload.test.title, payload.test.domain_id, feedbackToken, productId, now, testId);
    } else {
      // Insert new test
      const insertTestStmt = db.prepare(`
        INSERT INTO tests (id, title, domain_id, feedback_token, product_id, created_at, updated_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
      `);
      insertTestStmt.run(testId, payload.test.title, payload.test.domain_id, feedbackToken, productId, now, now);
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

    // Save/Update or remove Option B
    const isComparison = payload.mode === 'comparison' || (payload.mode !== 'single' && Boolean(payload.option_b));
    if (payload.option_b && isComparison) {
      this.upsertOption(testId, 'B', payload.option_b, now);
    } else {
      db.prepare('DELETE FROM options WHERE test_id = ? AND id = ?').run(testId, 'B');
    }

    // Save/Update AudienceConfig
    const lever = payload.comparison_lever || 'price';
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
        lever,
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
        lever,
        now,
        now
      );
    }

    db.prepare('UPDATE tests SET panel_seed = ? WHERE id = ?').run(payload.panel_seed ?? 12345, testId);
    db.prepare('UPDATE offerings SET sales_scenarios = ? WHERE test_id = ?').run(JSON.stringify(payload.offering.sales_scenarios || {}), testId);
    db.prepare('DELETE FROM profiles WHERE test_id = ?').run(testId);
    const result = this.getById(testId);
    if (!result) {
      throw new Error('Failed to retrieve test after saving');
    }
    db.exec('COMMIT');
    return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  private static upsertOption(
    testId: string, 
    optionId: 'A' | 'B', 
    data: TestDraftPayload['option_a'] | NonNullable<TestDraftPayload['option_b']>, 
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

    if (!optionA) return null;

    const test: Test & { product_id?: string } = {
      id: testRow.id,
      product_id: testRow.product_id || undefined,
      title: testRow.title,
      domain_id: testRow.domain_id,
      feedback_token: testRow.feedback_token,
      panel_seed: testRow.panel_seed,
      created_at: testRow.created_at,
      updated_at: testRow.updated_at,
      status: testRow.status
    };

    const offering: Offering = {
      sales_scenarios: JSON.parse(offeringRow.sales_scenarios || '{}'),
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
      product_id: testRow.product_id || undefined,
      mode: optionB ? 'comparison' : 'single',
      offering,
      options: {
        A: parseOption(optionA),
        ...(optionB ? { B: parseOption(optionB) } : {})
      },
      audience_config,
      comparison_lever: (audienceRow.comparison_lever as PrimaryLever) || 'price'
    };
  }

  /**
   * Get full test by feedback token or test ID
   */
  static getByFeedbackToken(tokenOrId: string): FullTestResponse | null {
    const db = getDatabase();
    const row = db.prepare('SELECT id FROM tests WHERE feedback_token = ?').get(tokenOrId) as { id: string } | undefined;
    if (!row) return null;
    const run = this.getLatestRunByTestId(row.id);
    if (!run || run.status !== 'completed' || this.getEvaluationsByRunId(run.id).length !== 100) return null;
    return this.getRunSnapshot(run.id)?.test ?? null;
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
      feedback_token: r.feedback_token || r.id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      status: r.status
    }));
  }

  /**
   * List product-linked tests owned by one founder. This intentionally omits
   * feedback tokens and leaves unclaimed legacy tests out of account views.
   */
  static listByOwner(ownerId: string): Array<Omit<Test, 'feedback_token'> & { product_id: string }> {
    const rows = getDatabase().prepare(`
      SELECT t.id, t.title, t.domain_id, t.created_at, t.updated_at, t.status, t.product_id
      FROM tests t
      JOIN products p ON p.id = t.product_id
      WHERE p.owner_id = ?
      ORDER BY t.updated_at DESC
    `).all(ownerId) as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      domain_id: row.domain_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status,
      product_id: row.product_id
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
   * Submit human response with best-effort duplicate protection
   */
  static recordHumanResponse(
    testId: string, 
    choice: HumanChoice, 
    reason?: string, 
    clientToken?: string,
    tokenHash?: string
  ): { response: HumanResponse; is_updated: boolean } {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Check for existing response from this client token to avoid duplicate counts
    db.prepare("UPDATE human_responses SET client_token = NULL, token_hash = NULL WHERE created_at < ?").run(new Date(Date.now() - 86400000).toISOString());
    if (clientToken) clientToken = createHash('sha256').update(`${testId}:${clientToken}`).digest('hex');
    if (clientToken) {
      const existing = db.prepare('SELECT id FROM human_responses WHERE test_id = ? AND client_token = ?').get(testId, clientToken) as { id: string } | undefined;
      if (existing) {
        const updateStmt = db.prepare(`
          UPDATE human_responses
          SET choice = ?, reason = ?, token_hash = ?, created_at = ?
          WHERE id = ?
        `);
        updateStmt.run(choice, reason || null, tokenHash || null, now, existing.id);
        return {
          response: {
            id: existing.id,
            test_id: testId,
            choice,
            reason: reason || undefined,
            created_at: now,
            token_hash: tokenHash
          },
          is_updated: true
        };
      }
    }

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO human_responses (id, test_id, choice, reason, token_hash, client_token, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, testId, choice, reason || null, tokenHash || null, clientToken || null, now);

    return {
      response: {
        id,
        test_id: testId,
        choice,
        reason: reason || undefined,
        created_at: now,
        token_hash: tokenHash
      },
      is_updated: false
    };
  }

  /**
   * Get human feedback stats for a test
   */
  static getHumanFeedback(testId: string): { 
    total: number; 
    counts: Record<HumanChoice, number>; 
    responses: HumanResponse[];
    feedback_token?: string;
    recruitment_context: string;
  } {
    const db = getDatabase();
    const testRow = db.prepare('SELECT feedback_token FROM tests WHERE id = ?').get(testId) as { feedback_token?: string } | undefined;
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
      responses,
      feedback_token: testRow?.feedback_token || testId,
      recruitment_context: 'Responses came from whoever received your link.'
    };
  }

  /**
   * Save or replace 50 generated profiles for a test
   */
  static saveProfiles(testId: string, profiles: Profile[]): Profile[] {
    const db = getDatabase();
    if (this.getLatestRunByTestId(testId)) throw Object.assign(new Error('The panel is frozen. Create a new test to regenerate it.'), { status: 409 });
    
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

  /**
   * Create a new simulation run
   */
  static createRun(
    testId: string, 
    primaryLever: PrimaryLever, 
    profileSeed: number, 
    modelId?: string,
    mode?: 'single' | 'comparison',
    researchStatus: 'without_research' | 'completed' | 'no_matches' | 'failed' | 'skipped' = 'without_research',
    references: any[] = [],
    referenceSummary?: string,
    researchAttempt?: any
  ): Run {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const fullTest = this.getById(testId);
    const resolvedMode = mode || fullTest?.mode || (fullTest?.options?.B ? 'comparison' : 'single');
    const expectedEvals = resolvedMode === 'comparison' ? 100 : 50;

    const stmt = db.prepare(`
      INSERT INTO runs (
        id, test_id, status, primary_lever, profile_seed, model_id,
        mode, created_at, total_evaluations_expected, total_evaluations_completed
      )
      VALUES (?, ?, 'running', ?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(id, testId, primaryLever, profileSeed, modelId || null, resolvedMode, now, expectedEvals);
    
    const profiles = this.getProfiles(testId);
    const selectedRefs = (references || []).filter(r => r.selected !== false).slice(0, 5);
    const selectedRefIds = selectedRefs.map(r => r.id);
    
    const snapshot = {
      mode: resolvedMode,
      product_id: fullTest?.product_id,
      research_status: researchStatus,
      test: fullTest,
      profiles,
      references: selectedRefs,
      selected_reference_ids: selectedRefIds,
      reference_summary: referenceSummary,
      research_attempt: researchAttempt
    };
    db.prepare('UPDATE runs SET snapshot = ? WHERE id = ?').run(JSON.stringify(snapshot), id);

    return {
      id,
      test_id: testId,
      status: 'running',
      primary_lever: primaryLever,
      profile_seed: profileSeed,
      model_id: modelId,
      created_at: now,
      total_evaluations_expected: expectedEvals,
      total_evaluations_completed: 0,
      mode: resolvedMode,
      research_status: researchStatus
    };
  }

  /**
   * Update run progress or status
   */
  static updateRun(
    runId: string,
    updates: {
      status?: RunStatus;
      total_evaluations_completed?: number;
      error_message?: string | null;
      completed_at?: string | null;
    }
  ): Run | null {
    const db = getDatabase();
    const current = this.getRunById(runId);
    if (!current) return null;

    const newStatus = updates.status !== undefined ? updates.status : current.status;
    const newCompleted = updates.total_evaluations_completed !== undefined 
      ? updates.total_evaluations_completed 
      : current.total_evaluations_completed;
    const newError = updates.error_message !== undefined ? updates.error_message : current.error_message;
    const newCompletedAt = updates.completed_at !== undefined ? updates.completed_at : current.completed_at;

    const stmt = db.prepare(`
      UPDATE runs 
      SET status = ?, total_evaluations_completed = ?, error_message = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(newStatus, newCompleted, newError || null, newCompletedAt || null, runId);

    return this.getRunById(runId);
  }

  /**
   * Get run by ID
   */
  static getRunById(runId: string): Run | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as any;
    if (!row) return null;

    const snapshot = row.snapshot ? JSON.parse(row.snapshot) : null;

    return {
      id: row.id,
      test_id: row.test_id,
      status: row.status as RunStatus,
      primary_lever: row.primary_lever as PrimaryLever,
      profile_seed: row.profile_seed,
      model_id: row.model_id || undefined,
      created_at: row.created_at,
      completed_at: row.completed_at || undefined,
      total_evaluations_expected: row.total_evaluations_expected,
      total_evaluations_completed: row.total_evaluations_completed,
      error_message: row.error_message || undefined,
      mode: (row.mode as any) || snapshot?.mode || 'single',
      research_status: snapshot?.research_status || 'without_research'
    };
  }

  /**
   * Get latest run for a test
   */
  static getLatestRunByTestId(testId: string): Run | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM runs WHERE test_id = ? ORDER BY created_at DESC LIMIT 1').get(testId) as any;
    if (!row) return null;

    const snapshot = row.snapshot ? JSON.parse(row.snapshot) : null;

    return {
      id: row.id,
      test_id: row.test_id,
      status: row.status as RunStatus,
      primary_lever: row.primary_lever as PrimaryLever,
      profile_seed: row.profile_seed,
      model_id: row.model_id || undefined,
      created_at: row.created_at,
      completed_at: row.completed_at || undefined,
      total_evaluations_expected: row.total_evaluations_expected,
      total_evaluations_completed: row.total_evaluations_completed,
      error_message: row.error_message || undefined,
      mode: (row.mode as any) || snapshot?.mode || 'single',
      research_status: snapshot?.research_status || 'without_research'
    };
  }

  /**
   * Find test draft linked to a product ID
   */
  static findTestByProductId(productId: string): FullTestResponse | null {
    const db = getDatabase();
    const row = db.prepare('SELECT id FROM tests WHERE product_id = ? ORDER BY updated_at DESC LIMIT 1').get(productId) as { id: string } | undefined;
    if (!row) return null;
    return this.getById(row.id);
  }

  /**
   * Save / Upsert a batch of evaluations
   */
  static saveEvaluations(evaluations: Evaluation[]): void {
    if (evaluations.length === 0) return;
    const db = getDatabase();

    const insertStmt = db.prepare(`
      INSERT INTO evaluations (
        id, run_id, test_id, profile_id, option_id, access_status,
        response, reason, primary_objection, factor_tags, referenced_fields, source_ids, created_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM evaluations WHERE run_id = ? AND profile_id = ? AND option_id = ?)
    `);

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const ev of evaluations) {
        insertStmt.run(
          ev.id || uuidv4(),
          ev.run_id,
          ev.test_id,
          ev.profile_id,
          ev.option_id,
          ev.access_status,
          ev.response,
          ev.reason || '',
          ev.primary_objection || null,
          JSON.stringify(ev.factor_tags || ['other']),
          JSON.stringify(ev.referenced_fields || ['price']),
          JSON.stringify(ev.source_ids || []),
          ev.created_at || new Date().toISOString(),
          ev.run_id, ev.profile_id, ev.option_id
        );
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Get all evaluations for a run
   */
  static getEvaluationsByRunId(runId: string): Evaluation[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM evaluations WHERE run_id = ? ORDER BY profile_id ASC, option_id ASC').all(runId) as any[];

    return rows.map(r => ({
      id: r.id,
      run_id: r.run_id,
      test_id: r.test_id,
      profile_id: r.profile_id,
      option_id: r.option_id as 'A' | 'B',
      access_status: r.access_status as 'served' | 'unserved',
      response: r.response as any,
      reason: r.reason,
      primary_objection: r.primary_objection || undefined,
      factor_tags: JSON.parse(r.factor_tags || '[]'),
      referenced_fields: JSON.parse(r.referenced_fields || '[]'),
      source_ids: JSON.parse(r.source_ids || '[]'),
      created_at: r.created_at
    }));
  }

  /**
   * Check which evaluations are missing for a run
   */
  static getMissingEvaluations(runId: string, testId: string): { option_a_missing: string[]; option_b_missing: string[] } {
    const run = this.getRunById(runId);
    const isComparison = run?.mode === 'comparison';
    const existing = this.getEvaluationsByRunId(runId);
    const existingA = new Set(existing.filter(e => e.option_id === 'A').map(e => e.profile_id));
    const existingB = new Set(existing.filter(e => e.option_id === 'B').map(e => e.profile_id));

    const profiles = this.getRunSnapshot(runId)?.profiles ?? this.getProfiles(testId);
    const missingA: string[] = [];
    const missingB: string[] = [];

    for (const p of profiles) {
      if (!existingA.has(p.id)) missingA.push(p.id);
      if (isComparison && !existingB.has(p.id)) missingB.push(p.id);
    }

    return {
      option_a_missing: missingA,
      option_b_missing: missingB
    };
  }

  static getRunSnapshot(runId: string): { 
    mode?: string; 
    product_id?: string; 
    research_status?: string; 
    test: FullTestResponse; 
    profiles: Profile[];
    references?: CompetitorReference[];
    selected_reference_ids?: string[];
    reference_summary?: string;
    research_attempt?: any;
  } | null {
    const row = getDatabase().prepare('SELECT snapshot FROM runs WHERE id = ?').get(runId) as { snapshot?: string } | undefined;
    return row?.snapshot ? JSON.parse(row.snapshot) : null;
  }
}
