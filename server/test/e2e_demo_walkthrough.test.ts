import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/db/database.js';
import { GroqEvaluator } from '../src/simulation/groqEvaluator.js';
import { SearchService } from '../src/search/searchService.js';
import { Profile, CompetitorReference } from '@droptest/shared';
import { runSeed } from '../src/db/seed.js';

import { config } from '../src/config.js';

describe('E2E Full Demo Walkthrough & Role Access Control Verification', () => {
  let server: any;
  let baseUrl: string;

  let tokenFounderA = '';
  let tokenFounderB = '';
  let tokenSponsor = '';
  let tokenShopper = '';

  let productId = '';
  let testId = '';
  let runId = '';

  const mockBatchEvaluator = async (
    profiles: Profile[],
    option: any,
    _category: string,
    _offeringContext: string,
    _batchIndex: number,
    _timeout?: number,
    _currency?: string,
    referenceSummary?: string,
    selectedRefs?: CompetitorReference[]
  ) => {
    const refIds = (selectedRefs || []).map(r => r.id);
    return profiles.map((p, idx) => ({
      profile_id: p.id,
      response: option.served_markets.includes(p.market) ? ('interested' as const) : ('not_interested' as const),
      primary_objection: option.served_markets.includes(p.market) ? 'Slightly higher price than conventional synthetic tees' : 'Outside coverage area',
      reason: `Persona in ${p.market} compared with market alternative ${refIds[0] || 'market baseline'}`,
      factor_tags: ['price' as const],
      referenced_fields: ['price', 'material'],
      source_ids: idx === 0 && refIds.length > 0 ? [refIds[0]] : []
    }));
  };

  before(async () => {
    if (!config.groqApiKey) {
      config.groqApiKey = 'gsk_mock_api_key_for_testing';
    }
    // Override batch evaluator with mock for fast, deterministic unit/integration testing
    GroqEvaluator.evaluateBatchWithGroq = mockBatchEvaluator;

    // Run seed to ensure baseline entities exist
    runSeed();

    const app = createApp();
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr: any = server.address();
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Sign in all 4 accounts
    const login = async (email: string, role: string) => {
      const res = await fetch(`${baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!', role })
      });
      const data = await res.json();
      assert.equal(res.status, 200, `Login failed for ${email}`);
      return data.token;
    };

    tokenFounderA = await login('founder.a@droptest.local', 'startup');
    tokenFounderB = await login('founder.b@droptest.local', 'startup');
    tokenSponsor = await login('sponsor@droptest.local', 'sponsor');
    tokenShopper = await login('shopper@droptest.local', 'user');
  });

  after(async () => {
    if (server) await new Promise(r => server.close(r));
    closeDatabase();
  });

  // Step 1: Startup A publishes and views T-Shirt product
  it('1. Startup A publishes/views T-shirt with required fields and clothing specifics', async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderA}`
      },
      body: JSON.stringify({
        name: 'Demo Organic Himalayan Hemp Summer Tee',
        category: 'clothing_accessories',
        stage: 'preparing_to_launch',
        status: 'published',
        summary: 'Ultra-breathable 100% organic Himalayan hemp tee tailored for hot summers with natural comfort.',
        intended_buyer: 'Eco-conscious young urban professionals aged 22-35 in metro cities',
        feedback_question: 'Would you prefer relaxed fit or athletic slim fit?',
        price: 999,
        currency: 'INR',
        availability_markets: ['Bangalore', 'Mumbai', 'Delhi NCR'],
        fulfillment_mode: 'Standard courier delivery',
        category_data: {
          item_type: 'T-Shirt',
          material: '100% Organic Himalayan Hemp',
          fit: 'Relaxed Regular Fit',
          sizes: ['S', 'M', 'L', 'XL']
        },
        images: [
          {
            id: 'img-1',
            filename: 'hemp_summer_tee.jpg',
            url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            mime_type: 'image/jpeg',
            size_bytes: 142800,
            confirmed_visual_description: 'Sage green crewneck organic hemp t-shirt'
          }
        ]
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    productId = data.id;
    assert.ok(productId);
    assert.equal(data.price, 999);
    assert.equal(data.category_data.material, '100% Organic Himalayan Hemp');

    // View public product detail
    const getRes = await fetch(`${baseUrl}/api/products/${productId}`);
    assert.equal(getRes.status, 200);
    const detail = await getRes.json();
    assert.equal(detail.name, 'Demo Organic Himalayan Hemp Summer Tee');
    assert.equal(detail.owner.startup_name, 'EcoHemp Labs');
  });

  // Step 2: User (Shopper) saves and gives structured feedback
  it('2. Shopper saves product and submits/edits structured feedback', async () => {
    // Save product
    const saveRes = await fetch(`${baseUrl}/api/products/${productId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenShopper}`
      },
      body: JSON.stringify({ saved: true })
    });
    assert.equal(saveRes.status, 200);
    const saveData = await saveRes.json();
    assert.equal(saveData.is_saved, true);
    assert.equal(saveData.save_count, 1);

    // Submit structured feedback: Yes, price, reason
    const fbRes = await fetch(`${baseUrl}/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenShopper}`
      },
      body: JSON.stringify({
        choice: 'yes',
        factor: 'price',
        reason: 'The ₹999 price point is very compelling for 100% pure hemp material.'
      })
    });
    assert.equal(fbRes.status, 200);
    const fbData = await fbRes.json();
    assert.equal(fbData.feedback_summary.total, 1);
    assert.equal(fbData.feedback_summary.counts.yes, 1);

    // Edit feedback: Maybe, quality_details -> Respondent count remains 1
    const editFbRes = await fetch(`${baseUrl}/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenShopper}`
      },
      body: JSON.stringify({
        choice: 'maybe',
        factor: 'quality_details',
        reason: 'Want to confirm the fabric GSM before committing.'
      })
    });
    assert.equal(editFbRes.status, 200);
    const editData = await editFbRes.json();
    assert.equal(editData.feedback_summary.total, 1);
    assert.equal(editData.feedback_summary.counts.yes, 0);
    assert.equal(editData.feedback_summary.counts.maybe, 1);
  });

  // Step 3: Sponsor proposes ₹500 support
  it('3. Sponsor proposes ₹500 support with clear message and status copy', async () => {
    const propRes = await fetch(`${baseUrl}/api/products/${productId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenSponsor}`
      },
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        message: 'Excited about sustainable hemp apparel in Bangalore. Offering initial backing.'
      })
    });
    assert.equal(propRes.status, 200);
    const propData = await propRes.json();
    assert.equal(propData.proposal.amount, 500);
    assert.equal(propData.proposal.currency, 'INR');

    // Re-submitting updates the proposal without creating duplicate
    const propRes2 = await fetch(`${baseUrl}/api/products/${productId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenSponsor}`
      },
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        message: 'Updated message: Excited about sustainable hemp apparel in Bangalore. Offering initial backing.'
      })
    });
    assert.equal(propRes2.status, 200);
    const propData2 = await propRes2.json();
    assert.equal(propData2.proposal.id, propData.proposal.id);
  });

  // Step 4: Startup B gives feedback and proposes support on Startup A's product
  it('4. Startup B can give feedback and propose support on Startup A product', async () => {
    // Startup B gives feedback
    const fbRes = await fetch(`${baseUrl}/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderB}`
      },
      body: JSON.stringify({
        choice: 'yes',
        factor: 'design_fit',
        reason: 'Love the minimalist cut. Would pair nicely as merch.'
      })
    });
    assert.equal(fbRes.status, 200);
    const fbData = await fbRes.json();
    assert.equal(fbData.feedback_summary.total, 2);

    // Startup B proposes support
    const propRes = await fetch(`${baseUrl}/api/products/${productId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderB}`
      },
      body: JSON.stringify({
        amount: 1000,
        currency: 'INR',
        message: 'Would love to explore cross-promoting our cold-brew tumbler with your tee.'
      })
    });
    assert.equal(propRes.status, 200);
    const propData = await propRes.json();
    assert.equal(propData.proposal.amount, 1000);
  });

  // Step 5: Startup A founder sees feedback breakdown and incoming proposals inbox
  it('5. Founder A sees verified feedback breakdown and incoming support proposals inbox', async () => {
    // Feedback breakdown (Owner only)
    const breakdownRes = await fetch(`${baseUrl}/api/products/${productId}/feedback/breakdown`, {
      headers: { 'Authorization': `Bearer ${tokenFounderA}` }
    });
    assert.equal(breakdownRes.status, 200);
    const breakdown = await breakdownRes.json();
    assert.equal(breakdown.total, 2);
    assert.ok(breakdown.responses.some((r: any) => r.author.display_name === 'Ananya Sharma'));
    assert.ok(breakdown.responses.some((r: any) => r.author.display_name === 'Rohit Verma'));

    // Incoming proposals inbox
    const propInboxRes = await fetch(`${baseUrl}/api/products/proposals/incoming`, {
      headers: { 'Authorization': `Bearer ${tokenFounderA}` }
    });
    assert.equal(propInboxRes.status, 200);
    const propInbox = await propInboxRes.json();
    assert.ok(propInbox.proposals.some((p: any) => p.sender_name === 'Vikram Malhotra' && p.amount === 500));
    assert.ok(propInbox.proposals.some((p: any) => p.sender_name === 'Rohit Verma' && p.amount === 1000));
  });

  // Step 6: Founder runs automatic research and manages competitor references
  it('6. Founder A runs automatic research on product and manages references', async () => {
    const searchRes = await fetch(`${baseUrl}/api/products/${productId}/research/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderA}`
      },
      body: JSON.stringify({})
    });
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.ok(searchData.references);
    assert.ok(searchData.selected_count <= 5);

    // Add manual competitor reference
    const manualRes = await fetch(`${baseUrl}/api/products/${productId}/research/references/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderA}`
      },
      body: JSON.stringify({
        url: 'https://patagonia.com/product/mens-hemp-crewneck',
        title: 'Patagonia Men’s Hemp Crewneck',
        note: 'Global benchmark selling at ₹3,200 equivalent with organic certification.'
      })
    });
    assert.equal(manualRes.status, 201);
  });

  // Step 7: Single-product 50-profile synthetic lab review uses references
  it('7. Single-product 50-profile review uses grounded research references', async () => {
    // Open lab pre-filled data
    const labRes = await fetch(`${baseUrl}/api/products/${productId}/lab`, {
      headers: { 'Authorization': `Bearer ${tokenFounderA}` }
    });
    assert.equal(labRes.status, 200);
    const labData = await labRes.json();
    assert.equal(labData.prefilled_payload.option_a.price, 999);
    assert.equal(labData.prefilled_payload.mode, 'single');
    // Coverage and audience budgets are separate assumptions and must be confirmed by the founder.
    labData.prefilled_payload.audience_config = {
      ...labData.prefilled_payload.audience_config,
      intended_buyer_description: 'Eco-conscious urban apparel buyers aged 22 to 35',
      adjacent_buyer_description: 'Practical apparel shoppers comparing natural-fiber options',
      expected_spend_min: 500,
      expected_spend_max: 2000,
      audience_markets: ['Bangalore', 'Mumbai', 'Delhi NCR']
    };

    // Save test draft
    const saveTestRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderA}`
      },
      body: JSON.stringify(labData.prefilled_payload)
    });
    assert.equal(saveTestRes.status, 200);
    const savedTest = await saveTestRes.json();
    testId = savedTest.test.id;
    assert.ok(testId);

    // Launch simulation run
    const runRes = await fetch(`${baseUrl}/api/tests/${testId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderA}`
      },
      body: JSON.stringify({})
    });
    assert.equal(runRes.status, 202);
    const runData = await runRes.json();
    runId = runData.run.id;
    assert.equal(runData.run.mode, 'single');
    assert.equal(runData.run.total_evaluations_expected, 50);

    // Poll until completed
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      const pollRes = await fetch(`${baseUrl}/api/tests/${testId}/runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${tokenFounderA}` }
      });
      const pollData = await pollRes.json();
      if (pollData.run.status === 'completed') break;
      attempts++;
    }

    // Inspect Analysis
    const analysisRes = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenFounderA}` }
    });
    assert.equal(analysisRes.status, 200);
    const analysis = await analysisRes.json();
    assert.equal(analysis.mode, 'single');
    assert.equal(analysis.decision_card.total_completed, 50);
    assert.equal(analysis.decision_card.is_run_complete, true);
    assert.ok(analysis.references.length > 0);
  });

  // Step 8: Strict Access Controls & Edge Case Validations
  it('8. Enforces role and ownership access controls & rejects invalid inputs', async () => {
    // 1. Regular shopper cannot submit support proposal
    const badPropShopper = await fetch(`${baseUrl}/api/products/${productId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenShopper}`
      },
      body: JSON.stringify({ amount: 500, currency: 'INR', message: 'Test' })
    });
    assert.equal(badPropShopper.status, 403);

    // 2. Non-positive amount rejected
    const badPropAmount = await fetch(`${baseUrl}/api/products/${productId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenSponsor}`
      },
      body: JSON.stringify({ amount: -100, currency: 'INR', message: 'Test' })
    });
    assert.equal(badPropAmount.status, 400);

    // 3. Founder cannot offer support on their own product
    const selfProp = await fetch(`${baseUrl}/api/products/${productId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFounderA}`
      },
      body: JSON.stringify({ amount: 500, currency: 'INR', message: 'Self' })
    });
    assert.equal(selfProp.status, 400);

    // 4. Non-owner cannot view feedback breakdown (403)
    const badBreakdown = await fetch(`${baseUrl}/api/products/${productId}/feedback/breakdown`, {
      headers: { 'Authorization': `Bearer ${tokenFounderB}` }
    });
    assert.equal(badBreakdown.status, 403);

    // 5. Non-owner cannot access synthetic lab analysis (403)
    const badAnalysis = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${tokenFounderB}` }
    });
    assert.equal(badAnalysis.status, 403);
  });
});
