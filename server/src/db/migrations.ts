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

    -- Indexes for efficient queries
    CREATE INDEX IF NOT EXISTS idx_options_test ON options(test_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_test ON profiles(test_id);
    CREATE INDEX IF NOT EXISTS idx_runs_test ON runs(test_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_run ON evaluations(run_id);
    CREATE INDEX IF NOT EXISTS idx_human_responses_test ON human_responses(test_id);
    CREATE INDEX IF NOT EXISTS idx_tests_feedback_token ON tests(feedback_token);
    CREATE INDEX IF NOT EXISTS idx_human_responses_client_token ON human_responses(client_token);
  `;

  db.exec(schema);

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
}

