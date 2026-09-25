import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { closeDatabase, getDatabase } from '../src/db/database.js';
import { AuthRepository } from '../src/db/authRepository.js';
import { ProductRepository } from '../src/db/productRepository.js';
import { runSeed } from '../src/db/seed.js';
import { runMigrations } from '../src/db/migrations.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, SupportProposalSubmissionSchema } from '@droptest/shared';

describe('Sequence 2: demo persistence, authentication, exact money, and signup regressions', () => {
  let server: ReturnType<typeof createServer>;
  let base = '';
  let demoProductId = '';
  let demoShopperId = '';
  let demoSponsorId = '';
  let demoFounderBId = '';

  before(async () => {
    server = createServer(createApp());
    await new Promise<void>(resolve => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as any).port}`;
    const db = getDatabase();
    demoProductId = (db.prepare('SELECT id FROM products WHERE name = ?').get('Organic Hemp Everyday Summer Tee') as any).id;
    demoShopperId = AuthRepository.getUserByEmail('shopper@droptest.local')!.id;
    demoSponsorId = AuthRepository.getUserByEmail('sponsor@droptest.local')!.id;
    demoFounderBId = AuthRepository.getUserByEmail('founder.b@droptest.local')!.id;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    closeDatabase();
  });

  it('DT-06 seeding creates no engagement and never changes edits or deliberate unsaves', () => {
    const db = getDatabase();
    assert.equal((db.prepare('SELECT COUNT(*) AS count FROM product_saves WHERE product_id = ?').get(demoProductId) as any).count, 0);
    assert.equal((db.prepare('SELECT COUNT(*) AS count FROM product_feedback WHERE product_id = ?').get(demoProductId) as any).count, 0);
    assert.equal((db.prepare('SELECT COUNT(*) AS count FROM support_proposals WHERE product_id = ?').get(demoProductId) as any).count, 0);

    ProductRepository.toggleSave(demoShopperId, demoProductId, true);
    ProductRepository.toggleSave(demoShopperId, demoProductId, false);
    ProductRepository.upsertFeedback(demoShopperId, demoProductId, {
      choice: 'yes', factor: 'price', reason: 'First user answer'
    });
    ProductRepository.upsertFeedback(demoShopperId, demoProductId, {
      choice: 'no', factor: 'quality_details', reason: 'Edited user answer that must survive reseeding'
    });
    ProductRepository.upsertSupportProposal(demoSponsorId, demoProductId, {
      amount: 500, currency: 'INR', message: 'Initial proposal'
    });
    ProductRepository.upsertSupportProposal(demoSponsorId, demoProductId, {
      amount: 725.29, currency: 'INR', message: 'Updated proposal that must survive reseeding'
    });
    ProductRepository.upsertFeedback(demoFounderBId, demoProductId, {
      choice: 'maybe', factor: 'availability_delivery', reason: 'Second account feedback'
    });

    const beforeSeed = {
      shopperSave: db.prepare('SELECT * FROM product_saves WHERE user_id = ? AND product_id = ?').get(demoShopperId, demoProductId),
      shopperFeedback: db.prepare('SELECT * FROM product_feedback WHERE author_id = ? AND product_id = ?').get(demoShopperId, demoProductId),
      sponsorProposal: db.prepare('SELECT * FROM support_proposals WHERE sender_id = ? AND product_id = ?').get(demoSponsorId, demoProductId),
      founderFeedback: db.prepare('SELECT * FROM product_feedback WHERE author_id = ? AND product_id = ?').get(demoFounderBId, demoProductId)
    };
    assert.equal(beforeSeed.shopperSave, undefined);

    runSeed();
    runSeed();

    assert.equal(db.prepare('SELECT * FROM product_saves WHERE user_id = ? AND product_id = ?').get(demoShopperId, demoProductId), undefined);
    assert.deepEqual(db.prepare('SELECT * FROM product_feedback WHERE author_id = ? AND product_id = ?').get(demoShopperId, demoProductId), beforeSeed.shopperFeedback);
    assert.deepEqual(db.prepare('SELECT * FROM support_proposals WHERE sender_id = ? AND product_id = ?').get(demoSponsorId, demoProductId), beforeSeed.sponsorProposal);
    assert.deepEqual(db.prepare('SELECT * FROM product_feedback WHERE author_id = ? AND product_id = ?').get(demoFounderBId, demoProductId), beforeSeed.founderFeedback);
    assert.equal((db.prepare('SELECT COUNT(*) AS count FROM product_feedback WHERE product_id = ?').get(demoProductId) as any).count, 2);
  });

  it('DT-18 exposes the same demo identities as the seed and all four credentials sign in', async () => {
    const response = await fetch(`${base}/api/auth/demo-accounts`);
    assert.equal(response.status, 200);
    const data = await response.json() as any;
    assert.deepEqual(data.accounts.map((account: any) => account.email), DEMO_ACCOUNTS.map(account => account.email));
    for (const account of DEMO_ACCOUNTS) {
      assert.equal(account.password, DEMO_PASSWORD);
      const signIn = await fetch(`${base}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: account.password })
      });
      assert.equal(signIn.status, 200);
      const signedIn = await signIn.json() as any;
      assert.equal(signedIn.user.email, account.email);
      assert.equal(signedIn.user.role, account.role);
    }
    const wrongPassword = await fetch(`${base}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEMO_ACCOUNTS[0].email, password: 'wrong-password' })
    });
    assert.equal(wrongPassword.status, 401);
  });

  it('DT-25 validates currency precision and round-trips proposals through integer minor units', () => {
    const validInputs = [
      { amount: 0.1, currency: 'INR' },
      { amount: 0.29, currency: 'INR' },
      { amount: 500, currency: 'INR' },
      { amount: 1, currency: 'JPY' }
    ];
    for (const input of validInputs) {
      assert.equal(SupportProposalSubmissionSchema.safeParse({ ...input, message: 'Exact amount test' }).success, true);
    }
    for (const input of [
      { amount: 0.001, currency: 'INR' },
      { amount: 0.5, currency: 'JPY' },
      { amount: 1, currency: 'XYZ' },
      { amount: Number.MAX_SAFE_INTEGER, currency: 'INR' }
    ]) {
      assert.equal(SupportProposalSubmissionSchema.safeParse({ ...input, message: 'Invalid amount test' }).success, false);
    }

    const db = getDatabase();
    const sponsorId = AuthRepository.getUserByEmail('sponsor@droptest.local')!.id;
    for (const input of validInputs) {
      const proposal = ProductRepository.upsertSupportProposal(sponsorId, demoProductId, {
        amount: input.amount, currency: input.currency, message: 'Exact amount test'
      });
      const stored = db.prepare('SELECT amount_minor, currency FROM support_proposals WHERE id = ?').get(proposal.id) as any;
      const digits = input.currency === 'JPY' ? 0 : 2;
      assert.equal(stored.amount_minor, Math.round(input.amount * (10 ** digits)));
      assert.equal(stored.currency, input.currency);
      assert.equal(proposal.amount, input.amount);
    }

    const legacyId = 'legacy-minor-unit-regression';
    db.exec(`
      CREATE TABLE support_proposals_legacy (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(sender_id, product_id),
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
      );
      DROP TABLE support_proposals;
      ALTER TABLE support_proposals_legacy RENAME TO support_proposals;
    `);
    db.prepare(`
      INSERT INTO support_proposals
      (id, sender_id, product_id, recipient_id, amount, currency, message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'INR', 'Legacy proposal', '2026-01-01', '2026-01-01')
    `).run(legacyId, sponsorId, demoProductId, AuthRepository.getUserByEmail('founder.a@droptest.local')!.id, 0.29);
    runMigrations(db);
    const migrated = db.prepare('SELECT amount_minor, sender_id, product_id, message FROM support_proposals WHERE id = ?').get(legacyId) as any;
    assert.equal(migrated.amount_minor, 29);
    assert.equal(migrated.sender_id, sponsorId);
    assert.equal(migrated.product_id, demoProductId);
    assert.equal(migrated.message, 'Legacy proposal');
    runMigrations(db);
    assert.equal((db.prepare('SELECT amount_minor FROM support_proposals WHERE id = ?').get(legacyId) as any).amount_minor, 29);
    assert.equal((db.prepare('PRAGMA table_info(support_proposals)').all() as any[]).some(column => column.name === 'amount'), false);
    db.prepare('DELETE FROM support_proposals WHERE id = ?').run(legacyId);
  });

  it('DT-26 requires a trimmed startup description on signup while preserving other roles', async () => {
    const signup = async (body: any) => fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const baseStartup = {
      password: 'Password123!', role: 'startup', startup_name: 'Description Test Startup'
    };
    assert.equal((await signup({ ...baseStartup, email: 'missing-description@example.test' })).status, 400);
    assert.equal((await signup({ ...baseStartup, email: 'blank-description@example.test', startup_description: '   ' })).status, 400);
    const valid = await signup({
      ...baseStartup,
      email: 'valid-description@example.test',
      startup_description: '  A concise startup description.  '
    });
    assert.equal(valid.status, 201);
    assert.equal((await valid.json() as any).user.startup_description, 'A concise startup description.');

    const shopper = await signup({
      email: 'shopper-no-startup-description@example.test',
      password: 'Password123!', role: 'user', display_name: 'Valid Shopper'
    });
    assert.equal(shopper.status, 201);
  });
});
