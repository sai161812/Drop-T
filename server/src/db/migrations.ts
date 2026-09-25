import { DatabaseSync } from 'node:sqlite';

export function runMigrations(db: DatabaseSync): void {
  // Enable foreign keys and WAL mode for reliability
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Schema definition
  const schema = `
    -- Tests table
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain_id TEXT NOT NULL,
      feedback_token TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft'
    );

    -- Offerings table
    CREATE TABLE IF NOT EXISTS offerings (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL UNIQUE,
      short_value_prop TEXT NOT NULL,
      description TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      period TEXT NOT NULL DEFAULT 'launch_batch',
      domain_specific_data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- Options table (Option A and Option B per test)
    CREATE TABLE IF NOT EXISTS options (
      id TEXT NOT NULL, -- 'A' or 'B'
      test_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      primary_message TEXT NOT NULL,
      served_markets TEXT NOT NULL, -- JSON array of strings
      fulfillment_mode TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]', -- JSON array of ImageMetadata
      variable_cost_per_sale REAL,
      fixed_launch_cost REAL,
      capacity_units INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (test_id, id),
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- Audience configuration table
    CREATE TABLE IF NOT EXISTS audience_configs (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL UNIQUE,
      intended_buyer_description TEXT NOT NULL,
      adjacent_buyer_description TEXT NOT NULL,
      expected_spend_min REAL NOT NULL,
      expected_spend_max REAL NOT NULL,
      audience_markets TEXT NOT NULL, -- JSON array of strings (1-4)
      panel_size INTEGER NOT NULL DEFAULT 50,
      intended_count INTEGER NOT NULL DEFAULT 20,
      adjacent_count INTEGER NOT NULL DEFAULT 20,
      contrasting_count INTEGER NOT NULL DEFAULT 10,
      comparison_lever TEXT NOT NULL DEFAULT 'price',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- 50 Distinct Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT NOT NULL, -- 'prof_01' .. 'prof_50'
      test_id TEXT NOT NULL,
      segment TEXT NOT NULL, -- 'intended' | 'adjacent' | 'contrasting'
      market TEXT NOT NULL,
      budget_min REAL NOT NULL,
      budget_max REAL NOT NULL,
      use_case TEXT NOT NULL,
      constraints TEXT NOT NULL, -- JSON array
      priorities TEXT NOT NULL, -- JSON array
      access_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (test_id, id),
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- Runs table
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      primary_lever TEXT NOT NULL,
      profile_seed INTEGER NOT NULL,
      model_id TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      total_evaluations_expected INTEGER NOT NULL DEFAULT 100,
      total_evaluations_completed INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- Evaluations table (50 profiles x 2 options = 100 evaluations)
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      test_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      option_id TEXT NOT NULL,
      access_status TEXT NOT NULL, -- 'served' | 'unserved'
      response TEXT NOT NULL, -- 'interested' | 'unsure' | 'not_interested' | 'unavailable'
      reason TEXT NOT NULL,
      primary_objection TEXT,
      factor_tags TEXT NOT NULL, -- JSON array
      referenced_fields TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- Human feedback responses table
    CREATE TABLE IF NOT EXISTS human_responses (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      choice TEXT NOT NULL, -- 'A' | 'B' | 'neither' | 'unsure'
      reason TEXT,
      token_hash TEXT,
      client_token TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- DROPTEST v2: Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'user' | 'sponsor' | 'startup'
      display_name TEXT NOT NULL,
      startup_name TEXT,
      startup_description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- DROPTEST v2: Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- DROPTEST v2: Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- 'clothing_accessories' | 'local_food_beverages' | 'digital_products_services' | 'other'
      stage TEXT NOT NULL, -- 'idea' | 'prototype' | 'preparing_to_launch' | 'launched'
      summary TEXT NOT NULL,
      intended_buyer TEXT NOT NULL,
      feedback_question TEXT NOT NULL,
      price REAL, -- NULL means 'not_set'
      currency TEXT NOT NULL DEFAULT 'INR',
      availability_markets TEXT NOT NULL DEFAULT '"not_decided"', -- JSON array or 'not_decided'
      fulfillment_mode TEXT NOT NULL DEFAULT 'not_decided',
      images TEXT NOT NULL DEFAULT '[]', -- JSON array of ImageMetadata
      category_data TEXT NOT NULL DEFAULT '{}', -- JSON object with material, sizes, etc.
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- DROPTEST v2: Product saves table
    CREATE TABLE IF NOT EXISTS product_saves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- DROPTEST v2: Product community feedback table
    CREATE TABLE IF NOT EXISTS product_feedback (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      choice TEXT NOT NULL, -- 'yes' | 'maybe' | 'no'
      factor TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(author_id, product_id),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- DROPTEST v2: Support proposals table
    CREATE TABLE IF NOT EXISTS support_proposals (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(sender_id, product_id),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- DROPTEST v2: Competitor references table (Synthetic Lab)
    CREATE TABLE IF NOT EXISTS competitor_references (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      query TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      domain TEXT NOT NULL,
      snippet_or_fact TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'automated' | 'founder_supplied'
      evidence_type TEXT DEFAULT 'retrieved_snippet',
      supported_facts TEXT DEFAULT '[]',
      founder_note TEXT,
      created_at TEXT,
      selected INTEGER NOT NULL DEFAULT 1,
      date_checked TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Authenticated local uploads. Pre-migration files intentionally remain
    -- unowned and cannot be claimed through the public API.
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      server_filename TEXT NOT NULL UNIQUE,
      original_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- Indexes for efficient queries
    CREATE INDEX IF NOT EXISTS idx_options_test ON options(test_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_test ON profiles(test_id);
    CREATE INDEX IF NOT EXISTS idx_runs_test ON runs(test_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_run ON evaluations(run_id);
    CREATE INDEX IF NOT EXISTS idx_human_responses_test ON human_responses(test_id);
    CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
    CREATE INDEX IF NOT EXISTS idx_product_saves_user ON product_saves(user_id);
    CREATE INDEX IF NOT EXISTS idx_product_saves_product ON product_saves(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_feedback_product ON product_feedback(product_id);
    CREATE INDEX IF NOT EXISTS idx_support_proposals_recipient ON support_proposals(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_competitor_references_product ON competitor_references(product_id);
    CREATE INDEX IF NOT EXISTS idx_uploads_owner ON uploads(owner_id);
  `;

  db.exec(schema);

  const addColumn = (table: string, name: string, definition: string) => {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (!columns.some(column => column.name === name)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
      }
    } catch (_e) {
      // Ignore if column already added or table locked
    }
  };
  addColumn('tests', 'panel_seed', 'INTEGER NOT NULL DEFAULT 12345');
  addColumn('tests', 'product_id', 'TEXT REFERENCES products(id)');
  addColumn('support_proposals', 'amount_minor', 'INTEGER');
  addColumn('runs', 'snapshot', 'TEXT');
  addColumn('runs', 'mode', "TEXT NOT NULL DEFAULT 'single'");
  addColumn('offerings', 'sales_scenarios', 'TEXT');
  addColumn('evaluations', 'source_ids', 'TEXT DEFAULT "[]"');
  addColumn('competitor_references', 'evidence_type', 'TEXT DEFAULT "retrieved_snippet"');
  addColumn('competitor_references', 'supported_facts', 'TEXT DEFAULT "[]"');
  addColumn('competitor_references', 'founder_note', 'TEXT');
  addColumn('competitor_references', 'created_at', 'TEXT');

  // Older releases stored proposals as REAL. Rebuild that table after an
  // explicit one-time rounding conversion, preserving proposal identity and
  // relationships while removing floating-point money from the active schema.
  const proposalColumns = db.prepare('PRAGMA table_info(support_proposals)').all() as Array<{ name: string }>;
  if (proposalColumns.some(column => column.name === 'amount')) {
    const legacyRows = db.prepare('SELECT * FROM support_proposals').all() as any[];
    let roundedLegacyProposalCount = 0;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`
        CREATE TABLE support_proposals_exact (
          id TEXT PRIMARY KEY,
          sender_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          recipient_id TEXT NOT NULL,
          amount_minor INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          message TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(sender_id, product_id),
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      const insertExact = db.prepare(`
        INSERT INTO support_proposals_exact
        (id, sender_id, product_id, recipient_id, amount_minor, currency, message, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of legacyRows) {
        const currency = String(row.currency || 'INR').toUpperCase();
        const scale = currency === 'JPY' ? 1 : 100;
        const existingMinor = row.amount_minor;
        const minor = existingMinor === null || existingMinor === undefined
          ? Math.round(Number(row.amount) * scale)
          : Number(existingMinor);
        if (!Number.isSafeInteger(minor) || minor <= 0) {
          throw new Error(`Cannot safely migrate support proposal ${row.id}; its legacy amount is invalid or exceeds safe integer precision.`);
        }
        if ((existingMinor === null || existingMinor === undefined) && Math.abs(Number(row.amount) - minor / scale) > 1e-8) {
          roundedLegacyProposalCount++;
        }
        insertExact.run(row.id, row.sender_id, row.product_id, row.recipient_id, minor, currency, row.message, row.created_at, row.updated_at);
      }
      db.exec('DROP TABLE support_proposals; ALTER TABLE support_proposals_exact RENAME TO support_proposals;');
      db.exec('CREATE INDEX IF NOT EXISTS idx_support_proposals_recipient ON support_proposals(recipient_id);');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    if (roundedLegacyProposalCount > 0) {
      console.warn(`Rounded ${roundedLegacyProposalCount} legacy support proposal amount(s) to currency precision during migration.`);
    }
  }
  // Interrupted requests remain recoverable after a server restart.
  db.exec("UPDATE runs SET status = 'partial', error_message = 'Server restarted. Retry missing evaluations.' WHERE status IN ('pending', 'running')");

  // Migration for existing databases
  try {
    db.exec('ALTER TABLE runs ADD COLUMN model_id TEXT;');
  } catch (_e) {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE tests ADD COLUMN feedback_token TEXT;');
  } catch (_e) {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE human_responses ADD COLUMN client_token TEXT;');
  } catch (_e) {
    // Column already exists
  }

  // Backfill feedback_token for existing tests if null
  try {
    db.exec('UPDATE tests SET feedback_token = lower(hex(randomblob(24))) WHERE feedback_token IS NULL OR feedback_token = id;');
  } catch (_e) {
    // Ignore
  }

  // Safe index creation on migrated columns
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_tests_feedback_token ON tests(feedback_token);');
  } catch (_e) {
    // Ignore
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_human_responses_client_token ON human_responses(client_token);');
  } catch (_e) {
    // Ignore
  }
}
