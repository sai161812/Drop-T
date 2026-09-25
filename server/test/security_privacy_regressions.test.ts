import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { closeDatabase, getDatabase } from '../src/db/database.js';
import { ProductRepository } from '../src/db/productRepository.js';
import { ReferenceRepository } from '../src/db/referenceRepository.js';
import { TestRepository } from '../src/db/testRepository.js';
import { DOMAIN_PRESETS } from '../../client/src/config/templates.js';

describe('Sequence 1: authorization, privacy, and public serialization regressions', () => {
  let server: ReturnType<typeof createServer>;
  let base = '';
  let founderAToken = '';
  let founderBToken = '';
  let shopperToken = '';
  let sponsorToken = '';
  let founderAId = '';
  const createdUserIds: string[] = [];
  let legacyTestId = '';
  let productA = '';
  let productB = '';
  let draftProduct = '';

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const jsonAuth = (token: string) => ({ ...auth(token), 'Content-Type': 'application/json' });

  async function signup(role: 'startup' | 'user' | 'sponsor', label: string) {
    const response = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `${label}-${randomUUID()}@example.com`,
        password: 'Password123!',
        role,
        display_name: `${label} account`,
        ...(role === 'startup' ? {
          startup_name: `${label} startup`,
          startup_description: `${label} builds products for this security test.`
        } : {})
      })
    });
    assert.equal(response.status, 201);
    return response.json() as Promise<any>;
  }

  const productPayload = (name: string, status: 'draft' | 'published') => ({
    name,
    category: 'clothing_accessories',
    stage: 'prototype',
    summary: 'A carefully described apparel concept used for authorization regression checks.',
    intended_buyer: 'People looking for a practical everyday garment',
    feedback_question: 'What would you change before launch?',
    price: 799,
    currency: 'INR',
    availability_markets: ['Bangalore'],
    fulfillment_mode: 'Courier delivery',
    images: [],
    category_data: { item_type: 'T-shirt', material: 'Cotton', fit: 'Regular', sizes: ['M'] },
    status
  });

  async function createProduct(token: string, name: string, status: 'draft' | 'published') {
    const response = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: jsonAuth(token),
      body: JSON.stringify(productPayload(name, status))
    });
    assert.equal(response.status, 201);
    return (await response.json() as any).id as string;
  }

  before(async () => {
    server = createServer(createApp());
    await new Promise<void>(resolve => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as any).port}`;

    const founderA = await signup('startup', 'founder-a');
    const founderB = await signup('startup', 'founder-b');
    const shopper = await signup('user', 'shopper');
    const sponsor = await signup('sponsor', 'sponsor');
    founderAToken = founderA.token;
    founderBToken = founderB.token;
    shopperToken = shopper.token;
    sponsorToken = sponsor.token;
    founderAId = founderA.user.id;
    createdUserIds.push(founderA.user.id, founderB.user.id, shopper.user.id, sponsor.user.id);

    productA = await createProduct(founderAToken, 'Founder A published product', 'published');
    productB = await createProduct(founderBToken, 'Founder B published product', 'published');
    draftProduct = await createProduct(founderAToken, 'Founder A private draft', 'draft');
  });

  after(async () => {
    if (legacyTestId) TestRepository.deleteById(legacyTestId);
    const db = getDatabase();
    for (const userId of createdUserIds) {
      db.prepare('DELETE FROM tests WHERE product_id IN (SELECT id FROM products WHERE owner_id = ?)').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    }
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    closeDatabase();
  });

  it('DT-01 authorizes updates from the stored test relation and prevents relinking or claiming legacy tests', async () => {
    const payload: any = structuredClone(DOMAIN_PRESETS.clothing_accessories.payload);
    payload.mode = 'single';
    delete payload.option_b;
    payload.product_id = productA;
    payload.test.product_id = productA;
    const createdResponse = await fetch(`${base}/api/tests`, {
      method: 'POST', headers: jsonAuth(founderAToken), body: JSON.stringify(payload)
    });
    assert.equal(createdResponse.status, 200);
    const created = await createdResponse.json() as any;
    const testId = created.test.id;
    const originalTitle = created.test.title;

    const omitted = structuredClone(payload);
    omitted.test.id = testId;
    delete omitted.product_id;
    delete omitted.test.product_id;
    assert.equal((await fetch(`${base}/api/tests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(omitted)
    })).status, 403);

    const relink = structuredClone(payload);
    relink.test.id = testId;
    relink.product_id = productB;
    relink.test.product_id = productB;
    assert.equal((await fetch(`${base}/api/tests`, {
      method: 'POST', headers: jsonAuth(founderBToken), body: JSON.stringify(relink)
    })).status, 403);

    const afterAttacks = TestRepository.getById(testId)!;
    assert.equal(afterAttacks.product_id, productA);
    assert.equal(afterAttacks.test.title, originalTitle);

    const ownerUpdate = structuredClone(payload);
    ownerUpdate.test.id = testId;
    ownerUpdate.test.title = 'Authorized updated review';
    assert.equal((await fetch(`${base}/api/tests`, {
      method: 'POST', headers: jsonAuth(founderAToken), body: JSON.stringify(ownerUpdate)
    })).status, 200);

    const legacyPayload: any = structuredClone(DOMAIN_PRESETS.local_food_beverages.payload);
    const legacy = TestRepository.saveDraft(legacyPayload);
    legacyTestId = legacy.test.id;
    legacyPayload.test.id = legacy.test.id;
    legacyPayload.product_id = productA;
    legacyPayload.test.product_id = productA;
    assert.equal((await fetch(`${base}/api/tests`, {
      method: 'POST', headers: jsonAuth(founderAToken), body: JSON.stringify(legacyPayload)
    })).status, 403);
    assert.equal(TestRepository.getById(legacy.test.id)!.product_id, undefined);
  });

  it('DT-02 scopes reference reads, updates, and deletes to the authorized product', async () => {
    const foreignReference = ReferenceRepository.addManualReference(productB, {
      url: `https://example.com/products/${randomUUID()}`,
      title: 'Founder B private reference',
      note: 'Private source note belonging to founder B'
    });
    const attackUrl = `${base}/api/products/${productA}/research/references/${foreignReference.id}`;
    const patch = await fetch(attackUrl, {
      method: 'PATCH', headers: jsonAuth(founderAToken), body: JSON.stringify({ selected: false })
    });
    assert.equal(patch.status, 404);
    assert.equal(ReferenceRepository.getByProductAndId(productB, foreignReference.id)!.selected, true);
    assert.equal((await fetch(attackUrl, { method: 'DELETE', headers: auth(founderAToken) })).status, 404);
    assert.ok(ReferenceRepository.getByProductAndId(productB, foreignReference.id));
  });

  it('DT-03 authenticates upload mutations and protects product references', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64');
    const upload = async () => {
      const form = new FormData();
      form.append('image', new Blob([png], { type: 'image/png' }), 'security.png');
      const response = await fetch(`${base}/api/upload`, { method: 'POST', headers: auth(founderAToken), body: form });
      assert.equal(response.status, 201);
      return response.json() as Promise<any>;
    };

    const unused = await upload();
    const unusedFilename = unused.url.split('/').pop();
    assert.equal((await fetch(`${base}/api/upload/${unusedFilename}`, { method: 'DELETE' })).status, 401);
    assert.equal((await fetch(`${base}/api/upload/${unusedFilename}`, { method: 'DELETE', headers: auth(founderBToken) })).status, 403);
    assert.equal((await fetch(`${base}/api/upload/${unusedFilename}`, { method: 'DELETE', headers: auth(founderAToken) })).status, 200);

    const referenced = await upload();
    const existing = ProductRepository.getById(productA)!;
    ProductRepository.update(productA, founderAId, { ...existing, images: [referenced] });
    const referencedFilename = referenced.url.split('/').pop();
    assert.equal((await fetch(`${base}/api/upload/${referencedFilename}`, { method: 'DELETE', headers: auth(founderAToken) })).status, 409);
    ProductRepository.update(productA, founderAId, { ...existing, images: [] });
    assert.equal((await fetch(`${base}/api/upload/${referencedFilename}`, { method: 'DELETE', headers: auth(founderAToken) })).status, 200);
  });

  it('DT-04 owner-scopes lab listings and feedback statistics without serializing tokens', async () => {
    assert.equal((await fetch(`${base}/api/tests`)).status, 401);
    const ownerList = await fetch(`${base}/api/tests`, { headers: auth(founderAToken) });
    assert.equal(ownerList.status, 200);
    const ownerData = await ownerList.json() as any;
    assert.ok(ownerData.tests.length >= 1);
    assert.ok(ownerData.tests.every((test: any) => test.product_id === productA && test.feedback_token === undefined));

    const shopperList = await fetch(`${base}/api/tests`, { headers: auth(shopperToken) });
    assert.deepEqual((await shopperList.json() as any).tests, []);

    const testId = ownerData.tests[0].id;
    assert.equal((await fetch(`${base}/api/tests/${testId}/feedback-stats`)).status, 401);
    assert.equal((await fetch(`${base}/api/tests/${testId}/feedback-stats`, { headers: auth(founderBToken) })).status, 403);
    assert.equal((await fetch(`${base}/api/tests/${testId}/feedback-stats`, { headers: auth(founderAToken) })).status, 200);
  });

  it('DT-05 rejects save, feedback, and support writes against unpublished products', async () => {
    const countsBefore = {
      saves: (getDatabase().prepare('SELECT COUNT(*) count FROM product_saves WHERE product_id = ?').get(draftProduct) as any).count,
      feedback: (getDatabase().prepare('SELECT COUNT(*) count FROM product_feedback WHERE product_id = ?').get(draftProduct) as any).count,
      proposals: (getDatabase().prepare('SELECT COUNT(*) count FROM support_proposals WHERE product_id = ?').get(draftProduct) as any).count
    };
    assert.equal((await fetch(`${base}/api/products/${draftProduct}/save`, {
      method: 'POST', headers: jsonAuth(shopperToken), body: JSON.stringify({ saved: true })
    })).status, 404);
    assert.equal((await fetch(`${base}/api/products/${draftProduct}/feedback`, {
      method: 'POST', headers: jsonAuth(shopperToken), body: JSON.stringify({ choice: 'yes', factor: 'price' })
    })).status, 404);
    assert.equal((await fetch(`${base}/api/products/${draftProduct}/support`, {
      method: 'POST', headers: jsonAuth(sponsorToken), body: JSON.stringify({ amount: 500, currency: 'INR', message: 'A legitimate proposal message' })
    })).status, 404);
    const countsAfter = {
      saves: (getDatabase().prepare('SELECT COUNT(*) count FROM product_saves WHERE product_id = ?').get(draftProduct) as any).count,
      feedback: (getDatabase().prepare('SELECT COUNT(*) count FROM product_feedback WHERE product_id = ?').get(draftProduct) as any).count,
      proposals: (getDatabase().prepare('SELECT COUNT(*) count FROM support_proposals WHERE product_id = ?').get(draftProduct) as any).count
    };
    assert.deepEqual(countsAfter, countsBefore);
  });

  it('DT-20 rejects unknown category keys and strips private keys from legacy public rows', async () => {
    const injected = productPayload('Injected product', 'published') as any;
    injected.category_data.unit_production_cost = 250;
    injected.category_data.sales_scenarios = { central: 100 };
    const rejected = await fetch(`${base}/api/products`, {
      method: 'POST', headers: jsonAuth(founderAToken), body: JSON.stringify(injected)
    });
    assert.equal(rejected.status, 400);

    const legacy = ProductRepository.create(founderAId, injected);
    const publicResponse = await fetch(`${base}/api/products/${legacy.id}`);
    assert.equal(publicResponse.status, 200);
    const publicProduct = await publicResponse.json() as any;
    assert.equal(publicProduct.category_data.material, 'Cotton');
    assert.equal(publicProduct.category_data.unit_production_cost, undefined);
    assert.equal(publicProduct.category_data.sales_scenarios, undefined);
  });
});
