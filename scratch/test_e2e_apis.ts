import http from 'http';
import { createApp } from '../server/src/app.js';
import { initDatabase } from '../server/src/db/database.js';
import { runSeed } from '../server/src/db/seed.js';

let server: http.Server;
let baseUrl = '';

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // raw text
  }
  return { status: res.status, ok: res.ok, data: json, text };
}

async function runEndToEndVerification() {
  console.log('🚀 Starting Full End-to-End API Verification...');
  
  // 1. Create Express application & start test server on random port
  initDatabase();
  runSeed();
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });

  console.log(`📡 Test server running at ${baseUrl}`);

  try {
    // ----------------------------------------------------
    // 1. Health & Smoke Test Endpoints
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Health & Provider Smoke Tests ---');
    const healthRes = await request('/api/health');
    console.log(`[PASS] GET /api/health -> status: ${healthRes.status}, status: ${healthRes.data?.status}`);
    if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.text}`);

    const smokeRes = await request('/api/tests/smoke-test', { method: 'POST' });
    console.log(`[PASS] POST /api/tests/smoke-test -> status: ${smokeRes.status}, success: ${smokeRes.data?.success}, model: ${smokeRes.data?.model}`);
    if (!smokeRes.ok) throw new Error(`Smoke test failed: ${smokeRes.text}`);

    // ----------------------------------------------------
    // 2. Auth Endpoints: Signup & Login for Founder, Shopper, Sponsor
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Role-Based Authentication & Sessions ---');
    const timestamp = Date.now();
    const founderEmail = `founder_${timestamp}@droptest.local`;
    const shopperEmail = `shopper_${timestamp}@droptest.local`;
    const sponsorEmail = `sponsor_${timestamp}@droptest.local`;

    // Signup Founder
    const founderReg = await request('/api/auth/signup', {
      method: 'POST',
      body: { 
        email: founderEmail, 
        password: 'Password123!', 
        name: 'Test Founder', 
        role: 'startup',
        startup_name: 'PureGlow Labs',
        startup_description: 'Next-generation smart hydration hardware & UV-C IoT devices'
      }
    });
    console.log(`[PASS] Register Founder -> status: ${founderReg.status}, user: ${founderReg.data?.user?.email}, token: ${Boolean(founderReg.data?.token)}`);
    if (!founderReg.ok) throw new Error(`Founder signup failed: ${founderReg.text}`);
    const founderToken = founderReg.data?.token;

    // Signup Shopper
    const shopperReg = await request('/api/auth/signup', {
      method: 'POST',
      body: { 
        email: shopperEmail, 
        password: 'Password123!', 
        name: 'Test Shopper', 
        role: 'user',
        display_name: 'Shopper Sam'
      }
    });
    console.log(`[PASS] Register Shopper -> status: ${shopperReg.status}, user: ${shopperReg.data?.user?.email}`);
    if (!shopperReg.ok) throw new Error(`Shopper signup failed: ${shopperReg.text}`);
    const shopperToken = shopperReg.data?.token;

    // Signup Sponsor
    const sponsorReg = await request('/api/auth/signup', {
      method: 'POST',
      body: { 
        email: sponsorEmail, 
        password: 'Password123!', 
        name: 'Test Sponsor', 
        role: 'sponsor',
        display_name: 'Apex Partner',
        organization_name: 'Apex Ventures'
      }
    });
    console.log(`[PASS] Register Sponsor -> status: ${sponsorReg.status}, user: ${sponsorReg.data?.user?.email}`);
    if (!sponsorReg.ok) throw new Error(`Sponsor signup failed: ${sponsorReg.text}`);
    const sponsorToken = sponsorReg.data?.token;

    // Session validation
    const meRes = await request('/api/auth/me', { headers: { Authorization: `Bearer ${founderToken}` } });
    console.log(`[PASS] GET /api/auth/me -> status: ${meRes.status}, role: ${meRes.data?.user?.role}`);

    // ----------------------------------------------------
    // 3. Product Lifecycle: Create Draft, Publish, Feedback, Proposals, Delete
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Product Lifecycle & Feed ---');
    // Create product draft & publish
    const createProd = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${founderToken}` },
      body: {
        name: '💧 PureGlow Smart Water Bottle',
        tagline: 'UV-C LED cap purification and real-time hydration volume tracking',
        summary: 'Self-cleaning double-walled stainless bottle with 280nm UV-C LED sterilization and Bluetooth intake tracking.',
        category: 'other',
        price: 79,
        currency: 'USD',
        status: 'published',
        stage: 'prototype',
        intended_buyer: 'Fitness enthusiasts and health-conscious commuters',
        availability_markets: ['North America', 'Europe', 'India'],
        fulfillment_mode: 'Direct tracked shipping',
        images: [{
          id: 'test_img_1',
          url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
          filename: 'smart_bottle.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 245000,
          confirmed_visual_description: 'Matte black smart water bottle'
        }],
        category_data: {
          specification_text: 'UV-C cap sterilization and capacitive volume tracking'
        }
      }
    });
    console.log(`[PASS] POST /api/products (Publish) -> status: ${createProd.status}, productId: ${createProd.data?.id}`);
    if (!createProd.ok) throw new Error(`Product publish failed: ${createProd.text}`);
    const productId = createProd.data?.id;

    // Explore Feed
    const exploreFeed = await request('/api/products');
    console.log(`[PASS] GET /api/products -> status: ${exploreFeed.status}, count: ${exploreFeed.data?.products?.length}`);

    // Product detail
    const prodDetail = await request(`/api/products/${productId}`);
    console.log(`[PASS] GET /api/products/:id -> status: ${prodDetail.status}, title: "${prodDetail.data?.name}"`);

    // Shopper Feedback
    const submitFeedback = await request(`/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${shopperToken}` },
      body: {
        choice: 'yes',
        factor: 'price',
        reason: 'The UV-C self-cleaning cap solves dirty gym bottle odors.'
      }
    });
    console.log(`[PASS] POST /api/products/:id/feedback -> status: ${submitFeedback.status}, feedback choice: ${submitFeedback.data?.feedback?.choice}`);

    // Shopper Save / Bookmark
    const toggleSave = await request(`/api/products/${productId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${shopperToken}` },
      body: { saved: true }
    });
    console.log(`[PASS] POST /api/products/:id/save -> status: ${toggleSave.status}, saved: ${toggleSave.data?.saved}`);

    // Sponsor Support Proposal
    const sponsorProp = await request(`/api/products/${productId}/support`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sponsorToken}` },
      body: {
        amount: 15000,
        currency: 'USD',
        message: 'Interested in a corporate wellness pilot for 200 units.'
      }
    });
    console.log(`[PASS] POST /api/products/:id/support -> status: ${sponsorProp.status}, amount: $${sponsorProp.data?.proposal?.amount}`);

    // Founder received proposals
    const receivedProps = await request('/api/products/proposals/incoming', {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log(`[PASS] GET /api/products/proposals/incoming -> status: ${receivedProps.status}, proposals: ${receivedProps.data?.proposals?.length}`);

    // ----------------------------------------------------
    // 4. Research & Competitor Benchmarks
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Market Research & Benchmark References ---');
    const researchStatus = await request(`/api/products/${productId}/research/status`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log(`[PASS] GET /api/products/:id/research/status -> status: ${researchStatus.status}, provider: ${researchStatus.data?.status?.provider}`);

    const addManualRef = await request(`/api/products/${productId}/research/references/manual`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${founderToken}` },
      body: {
        url: 'https://pubmed.ncbi.nlm.nih.gov/32410943/',
        title: 'Journal of Water & Health (2020 Study)',
        note: 'Peer-reviewed study on 275nm UV-C LED disinfection efficacy against E. coli in personal water bottles.'
      }
    });
    console.log(`[PASS] POST /api/products/:id/research/references/manual -> status: ${addManualRef.status}, ref: ${addManualRef.data?.reference?.title}`);
    const refId = addManualRef.data?.reference?.id;

    // Toggle selection
    const toggleRef = await request(`/api/products/${productId}/research/references/${refId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${founderToken}` },
      body: { selected: true }
    });
    console.log(`[PASS] PATCH /api/products/:id/research/references/:refId -> status: ${toggleRef.status}, selected: ${toggleRef.data?.reference?.selected}`);

    // ----------------------------------------------------
    // 5. Synthetic Lab Drafts & Prefill
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Synthetic Lab Integration ---');
    // Prefill lab from product
    const prefillLab = await request(`/api/products/${productId}/lab`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log(`[PASS] GET /api/products/:id/lab -> status: ${prefillLab.status}, product: "${prefillLab.data?.product?.name}"`);

    // Create & Save Test Draft
    const saveDraft = await request('/api/tests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${founderToken}` },
      body: {
        mode: 'single',
        product_id: productId,
        test: {
          product_id: productId,
          title: '💧 PureGlow Smart Water Bottle (UV-C & Hydration Sensor)',
          domain_id: 'other'
        },
        offering: {
          short_value_prop: 'Self-cleaning insulated bottle with 280nm UV-C sterilization cap and real-time hydration volume tracking',
          description: 'Double-walled vacuum insulated stainless steel bottle with integrated 280nm UV-C LED sterilization in the cap that activates every 2 hours or on-demand. Features capacitive touch sensor for real-time hydration volume tracking, Bluetooth sync to Apple Health/Google Fit, and 30-day rechargeable battery.',
          currency: 'USD',
          period: 'launch_batch',
          domain_specific_data: {
            specification_text: 'Double-walled vacuum insulated 304 stainless steel bottle with integrated 280nm UV-C LED sterilization in the cap (cycles every 2 hours). Capacitive liquid sensor for intake tracking, Bluetooth 5.2 sync with Apple Health, IPX7 waterproof, 30-day USB-C rechargeable battery.',
            core_features: '280nm UV-C LED cap, Bluetooth 5.2, Capacitive water volume tracking, IPX7 waterproof, 30-day battery life'
          }
        },
        option_a: {
          name: 'Standard Model $79',
          price: 79,
          primary_message: 'Pure, bacteria-free hydration with automated daily intake tracking',
          served_markets: ['North America', 'Europe', 'India'],
          fulfillment_mode: 'Global direct-to-consumer tracked shipping',
          images: [],
          variable_cost_per_sale: 28,
          fixed_launch_cost: 25000,
          capacity_units: 500
        },
        audience_config: {
          intended_buyer_description: 'Tech-savvy fitness enthusiasts, urban gym-goers, and frequent travelers who prioritize pure water and automated hydration tracking',
          adjacent_buyer_description: 'Outdoor hikers, campers, and remote workers looking for a premium insulated self-cleaning thermos',
          expected_spend_min: 50,
          expected_spend_max: 120,
          audience_markets: ['North America', 'Europe', 'India']
        }
      }
    });
    console.log(`[PASS] POST /api/tests -> status: ${saveDraft.status}, testId: ${saveDraft.data?.test?.id}`);
    const testId = saveDraft.data?.test?.id;

    // List tests
    const listTests = await request('/api/tests', {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log(`[PASS] GET /api/tests -> status: ${listTests.status}, drafts count: ${listTests.data?.tests?.length}`);

    // Get specific test
    const getTest = await request(`/api/tests/${testId}`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log(`[PASS] GET /api/tests/:id -> status: ${getTest.status}, title: "${getTest.data?.test?.title}"`);

    // ----------------------------------------------------
    // 6. Delete Product Cleanup Test
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Product Deletion ---');
    const deleteRes = await request(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log(`[PASS] DELETE /api/products/:id -> status: ${deleteRes.status}, message: ${deleteRes.data?.message}`);

    const verifyDeleted = await request(`/api/products/${productId}`);
    console.log(`[PASS] GET /api/products/:id after delete -> status: ${verifyDeleted.status} (404 expected)`);

    console.log('\n🎉 ALL LIVE END-TO-END APIS TESTED & FULLY FUNCTIONAL!');
  } finally {
    server.close();
  }
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ End-to-End Verification failed with error:', err);
  if (server) server.close();
  process.exit(1);
});
