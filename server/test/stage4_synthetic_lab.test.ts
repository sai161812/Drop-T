import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/db/database.js';
import { GroqEvaluator } from '../src/simulation/groqEvaluator.js';
import { Profile } from '@droptest/shared';

import { config } from '../src/config.js';

describe('Stage 4: Product-Linked Synthetic Lab, Single-Product 50-Profile Evaluation & Ownership Tests', () => {
  let server: any;
  let baseUrl: string;
  let founderToken = '';
  let otherFounderToken = '';
  let shopperToken = '';
  let productId = '';

  const mockBatchEvaluator = async (
    profiles: Profile[],
    option: any,
    _category: string,
    _offeringContext: string,
    _batchIndex: number
  ) => {
    return profiles.map(p => ({
      profile_id: p.id,
      response: option.served_markets.includes(p.market) ? ('interested' as const) : ('not_interested' as const),
      primary_objection: option.served_markets.includes(p.market) ? 'Price is slightly above expectation' : 'Not interested in current format',
      reason: `Persona ${p.id} evaluation against ${option.name}`,
      factor_tags: ['price' as const],
      referenced_fields: ['price']
    }));
  };

  before(async () => {
    if (!config.groqApiKey) {
      config.groqApiKey = 'gsk_mock_api_key_for_testing';
    }
    // Override batch evaluator with mock for fast, deterministic unit/integration testing
    GroqEvaluator.evaluateBatchWithGroq = mockBatchEvaluator;

    const app = createApp();
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    const suffix = Math.random().toString(36).substring(2, 8);

    // 1. Register Founder A (Startup)
    const resA = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `founder.a_${suffix}@example.com`,
        password: 'Password123!',
        role: 'startup',
        startup_name: 'Nova Apparel Labs',
        startup_description: 'Next-gen sustainable clothing'
      })
    });
    const dataA = await resA.json();
    founderToken = dataA.token;

    // 2. Register Founder B (Startup)
    const resB = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `founder.b_${suffix}@example.com`,
        password: 'Password123!',
        role: 'startup',
        startup_name: 'Boba Cloud Inc',
        startup_description: 'Instant artisan beverages'
      })
    });
    const dataB = await resB.json();
    otherFounderToken = dataB.token;

    // 3. Register Shopper (Regular User)
    const resShopper = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `shopper_${suffix}@example.com`,
        password: 'Password123!',
        role: 'user',
        display_name: 'Ravi Shopper'
      })
    });
    const dataShopper = await resShopper.json();
    shopperToken = dataShopper.token;

    // 4. Founder A creates and publishes a product
    const prodRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        name: 'Organic Hemp Summer Tee',
        category: 'clothing_accessories',
        stage: 'prototype',
        summary: '100% organic lightweight breathable hemp T-shirt tailored for hot tropical climates.',
        intended_buyer: 'Eco-conscious urban young professionals aged 22-35',
        feedback_question: 'Would you prefer this in natural off-white or sage green?',
        price: 999,
        currency: 'INR',
        availability_markets: ['Bangalore', 'Mumbai', 'Delhi NCR'],
        fulfillment_mode: 'Standard courier delivery',
        category_data: {
          material: '100% organic natural hemp',
          fit: 'Relaxed modern fit',
          sizes: ['S', 'M', 'L', 'XL']
        }
      })
    });
    const prodData = await prodRes.json();
    productId = prodData.id;

    // Publish it
    await fetch(`${baseUrl}/api/products/${productId}/publish`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      }
    });
  });

  after(async () => {
    if (server) await new Promise<void>(resolve => server.close(resolve));
    closeDatabase();
  });

  it('1. Founder opens lab for owned product (GET /api/products/:id/lab), gets pre-filled product draft', async () => {
    const res = await fetch(`${baseUrl}/api/products/${productId}/lab`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.product.id, productId);
    assert.equal(data.is_prefilled, true);
    assert.equal(data.prefilled_payload.mode, 'single');
    assert.equal(data.prefilled_payload.option_a.name, 'Organic Hemp Summer Tee');
    assert.equal(data.prefilled_payload.option_a.price, 999);
    assert.equal(data.prefilled_payload.offering.currency, 'INR');
    assert.deepEqual(data.prefilled_payload.option_a.served_markets, ['Bangalore', 'Mumbai', 'Delhi NCR']);
    assert.equal(data.prefilled_payload.audience_config.intended_buyer_description, 'Eco-conscious urban young professionals aged 22-35');
  });

  it('prefills digital facts losslessly and leaves unknown audience inputs for founder confirmation', async () => {
    const create = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
      body: JSON.stringify({
        name: 'Cloud Ledger', category: 'digital_products_services', stage: 'idea',
        summary: 'A cloud bookkeeping tool that helps independent shops reconcile invoices.',
        intended_buyer: 'Independent shop owners managing monthly supplier invoices',
        feedback_question: 'Which reconciliation task matters most?', price: null, currency: 'INR',
        availability_markets: 'not_decided', fulfillment_mode: 'not_decided', images: [],
        category_data: { core_use_case: 'Reconcile supplier invoices', platform: 'Web', language: 'English', pricing_type: 'not_decided' },
        status: 'published'
      })
    });
    assert.equal(create.status, 201);
    const created: any = await create.json();
    const lab = await fetch(`${baseUrl}/api/products/${created.id}/lab?review=new`, { headers: { Authorization: `Bearer ${founderToken}` } });
    assert.equal(lab.status, 200);
    const data: any = await lab.json();
    assert.equal(data.test, null);
    assert.equal(data.prefilled_payload.test.domain_id, 'digital_products_services');
    assert.equal(data.prefilled_payload.offering.domain_specific_data.core_use_case, 'Reconcile supplier invoices');
    assert.equal(data.prefilled_payload.offering.domain_specific_data.platform_language, 'Web / English');
    assert.equal(data.prefilled_payload.offering.domain_specific_data.pricing_type, 'not_decided');
    assert.equal(data.prefilled_payload.offering.domain_specific_data.lab_price_status, 'unknown');
    assert.deepEqual(data.prefilled_payload.audience_config.audience_markets, []);
    assert.equal(data.prefilled_payload.audience_config.adjacent_buyer_description, '');
    assert.equal(data.prefilled_payload.audience_config.expected_spend_min, 0);
    assert.equal(data.prefilled_payload.option_a.fulfillment_mode, '');

    const preflight = await fetch(`${baseUrl}/api/products/${created.id}/lab/preflight`, { headers: { Authorization: `Bearer ${founderToken}` } });
    const readiness: any = await preflight.json();
    assert.deepEqual(readiness.suggested_markets, []);
    assert.equal(readiness.suggested_spend_min, null);
    assert.equal(readiness.missing_adjacent_group, true);

    const saved = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
      body: JSON.stringify(data.prefilled_payload)
    });
    assert.equal(saved.status, 200);
    const savedData: any = await saved.json();
    assert.equal(savedData.test.product_id, created.id);
    assert.deepEqual(savedData.audience_config.audience_markets, []);
    const run = await fetch(`${baseUrl}/api/tests/${savedData.test.id}/run`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` }, body: '{}'
    });
    assert.equal(run.status, 400, 'an incomplete draft must not reach profile generation or model evaluation');

    const resume = await fetch(`${baseUrl}/api/products/${created.id}/lab`, { headers: { Authorization: `Bearer ${founderToken}` } }).then(r => r.json() as Promise<any>);
    assert.ok(resume.test, 'the ordinary lab route resumes the saved review');
    const updatedProduct = await fetch(`${baseUrl}/api/products/${created.id}`, { headers: { Authorization: `Bearer ${founderToken}` } }).then(r => r.json() as Promise<any>);
    const edit = await fetch(`${baseUrl}/api/products/${created.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
      body: JSON.stringify({
        name: updatedProduct.name, category: updatedProduct.category, stage: updatedProduct.stage,
        summary: 'A cloud bookkeeping tool that helps independent shops match updated supplier invoices.',
        intended_buyer: updatedProduct.intended_buyer, feedback_question: updatedProduct.feedback_question,
        price: updatedProduct.price, currency: updatedProduct.currency, availability_markets: updatedProduct.availability_markets,
        fulfillment_mode: updatedProduct.fulfillment_mode, images: updatedProduct.images,
        category_data: updatedProduct.category_data, status: updatedProduct.status
      })
    });
    assert.equal(edit.status, 200);
    const fresh = await fetch(`${baseUrl}/api/products/${created.id}/lab?review=new`, { headers: { Authorization: `Bearer ${founderToken}` } }).then(r => r.json() as Promise<any>);
    assert.equal(fresh.test, null);
    assert.match(fresh.prefilled_payload.offering.description, /updated supplier invoices/);
    assert.match(savedData.offering.domain_specific_data._product_snapshot.summary, /reconcile invoices/);

    const trialPayload = structuredClone(data.prefilled_payload);
    trialPayload.offering.domain_specific_data.lab_price_status = 'known';
    trialPayload.option_a.price = 499;
    trialPayload.option_a.served_markets = ['Bengaluru'];
    trialPayload.option_a.fulfillment_mode = 'Web access';
    trialPayload.audience_config = {
      intended_buyer_description: 'Independent shop owners using monthly bookkeeping tools',
      adjacent_buyer_description: 'Bookkeepers comparing lightweight invoice workflows',
      expected_spend_min: 100, expected_spend_max: 1500, audience_markets: ['Bengaluru']
    };
    const trialSave = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` }, body: JSON.stringify(trialPayload)
    });
    assert.equal(trialSave.status, 200);
    const trialData: any = await trialSave.json();
    assert.match(trialData.offering.domain_specific_data._product_snapshot.summary, /updated supplier invoices/);
    const publicProduct = await fetch(`${baseUrl}/api/products/${created.id}`);
    assert.equal((await publicProduct.json() as any).price, null, 'private trial price must not mutate public price');
  });

  it('2. Non-owner (shopper or different startup) is rejected with 403 when trying to access lab', async () => {
    // Other founder
    const resOther = await fetch(`${baseUrl}/api/products/${productId}/lab`, {
      headers: { 'Authorization': `Bearer ${otherFounderToken}` }
    });
    assert.equal(resOther.status, 403);

    // Regular shopper
    const resShopper = await fetch(`${baseUrl}/api/products/${productId}/lab`, {
      headers: { 'Authorization': `Bearer ${shopperToken}` }
    });
    assert.equal(resShopper.status, 403);
  });

  it('3. Founder saves product-linked single-mode draft and generates 50-profile panel', async () => {
    const payload = {
      mode: 'single',
      product_id: productId,
      panel_seed: 54321,
      test: {
        product_id: productId,
        title: 'Organic Hemp Summer Tee — Single Product Review',
        domain_id: 'clothing_accessories'
      },
      offering: {
        short_value_prop: 'Breathable organic hemp summer tee',
        description: 'Eco-conscious hemp t-shirt tailored for urban professionals',
        currency: 'INR',
        period: 'launch_batch',
        domain_specific_data: {
          item_type: 'T-Shirt',
          material: '100% organic hemp',
          fit: 'Relaxed',
          sizes: ['S', 'M', 'L']
        }
      },
      option_a: {
        name: 'Organic Hemp Summer Tee',
        price: 999,
        primary_message: 'Breathable lightweight organic hemp t-shirt',
        served_markets: ['Bangalore', 'Mumbai', 'Delhi NCR'],
        fulfillment_mode: 'Standard courier delivery',
        images: []
      },
      audience_config: {
        intended_buyer_description: 'Urban eco-conscious professionals looking for breathable natural apparel',
        adjacent_buyer_description: 'General casualwear buyers in metropolitan cities',
        expected_spend_min: 700,
        expected_spend_max: 1500,
        audience_markets: ['Bangalore', 'Mumbai', 'Delhi NCR', 'Pune']
      }
    };

    const saveRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify(payload)
    });
    assert.equal(saveRes.status, 200);
    const saveData = await saveRes.json();
    const testId = saveData.test.id;
    assert.ok(testId);

    // Get panel
    const panelRes = await fetch(`${baseUrl}/api/tests/${testId}/panel`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    assert.equal(panelRes.status, 200);
    const panelData = await panelRes.json();
    assert.equal(panelData.profiles.length, 50);
    assert.equal(panelData.stats_a.total, 50);
  });

  it('4. Single-product review completes exactly 50 evaluations on 50 saved profiles and records snapshot', async () => {
    const labInfoRes = await fetch(`${baseUrl}/api/products/${productId}/lab`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    const labInfo = await labInfoRes.json();
    const testId = labInfo.test.test.id;

    // Launch run
    const runRes = await fetch(`${baseUrl}/api/tests/${testId}/run`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({})
    });
    assert.equal(runRes.status, 202);
    const runData = await runRes.json();
    assert.equal(runData.run.mode, 'single');
    assert.equal(runData.run.total_evaluations_expected, 50);

    // Wait for completion
    let attempts = 0;
    let finalRun: any;
    let evaluations: any[] = [];
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      const pollRes = await fetch(`${baseUrl}/api/tests/${testId}/runs/${runData.run.id}`, {
        headers: { 'Authorization': `Bearer ${founderToken}` }
      });
      const pollData = await pollRes.json();
      if (pollData.run.status === 'completed') {
        finalRun = pollData.run;
        evaluations = pollData.evaluations;
        break;
      }
      attempts++;
    }

    assert.equal(finalRun.status, 'completed');
    assert.equal(finalRun.total_evaluations_completed, 50);
    assert.equal(evaluations.length, 50);
    assert.equal(new Set(evaluations.map(e => e.profile_id)).size, 50);

    // Check analysis
    const analysisRes = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    assert.equal(analysisRes.status, 200);
    const analysis = await analysisRes.json();
    assert.equal(analysis.mode, 'single');
    assert.equal(analysis.decision_card.is_run_complete, true);
    assert.equal(analysis.decision_card.total_expected, 50);
    assert.equal(analysis.decision_card.total_completed, 50);
    assert.equal(analysis.option_a_summary.total_profiles, 50);
    assert.equal(analysis.option_b_summary, undefined);
    assert.equal(analysis.transition_matrix, undefined);
  });

  it('5. Ownership enforcement on Run and Analysis: Non-owner gets 403 Forbidden', async () => {
    const labInfoRes = await fetch(`${baseUrl}/api/products/${productId}/lab`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    const labInfo = await labInfoRes.json();
    const testId = labInfo.test.test.id;
    const runId = labInfo.run.id;

    // Founder B tries to get latest run or run analysis
    const resRun = await fetch(`${baseUrl}/api/tests/${testId}/runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${otherFounderToken}` }
    });
    assert.equal(resRun.status, 403);

    const resAnalysis = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${otherFounderToken}` }
    });
    assert.equal(resAnalysis.status, 403);

    // Regular shopper tries to access
    const resShopperAnalysis = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${shopperToken}` }
    });
    assert.equal(resShopperAnalysis.status, 403);
  });

  it('6. Missing price concept-only review runs successfully without financial gating', async () => {
    const suffix = Math.random().toString(36).substring(2, 8);
    // Create product with price: null
    const noPriceProdRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        name: `Concept Wireless Earbuds ${suffix}`,
        category: 'digital_products_services',
        stage: 'idea',
        summary: 'AI-assisted adaptive active noise cancellation earbuds with spatial audio.',
        intended_buyer: 'Audiophiles and remote knowledge workers',
        feedback_question: 'What battery life do you need in daily use?',
        price: null,
        availability_markets: ['Global Online'],
        fulfillment_mode: 'Direct shipping',
        category_data: {
          main_function: 'Spatial audio with AI noise canceling',
          platform: 'iOS, Android, macOS, Windows',
          language: 'English, Hindi, Japanese'
        }
      })
    });
    const noPriceProd = await noPriceProdRes.json();
    const pId = noPriceProd.id;

    // Check preflight
    const preflightRes = await fetch(`${baseUrl}/api/products/${pId}/lab/preflight`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    assert.equal(preflightRes.status, 200);
    const preflight = await preflightRes.json();
    assert.equal(preflight.trial_price_allowed, true);
    assert.equal(preflight.concept_fit_mode, true);

    // Save test with price 0 (concept fit mode)
    const saveRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        mode: 'single',
        product_id: pId,
        test: {
          product_id: pId,
          title: `Concept Wireless Earbuds ${suffix} — Concept Fit Review`,
          domain_id: 'digital_products_services'
        },
        offering: {
          short_value_prop: 'AI adaptive ANC earbuds',
          description: 'Adaptive spatial audio earbuds for knowledge workers',
          currency: 'USD',
          period: 'launch_batch',
          domain_specific_data: {
            core_use_case: 'Spatial audio with AI noise canceling',
            platform_language: 'iOS, Android',
            pricing_type: 'one_time',
            lab_price_status: 'unknown'
          }
        },
        option_a: {
          name: `Concept Wireless Earbuds ${suffix}`,
          price: 0,
          primary_message: 'Next-gen spatial audio with adaptive ANC',
          served_markets: ['Global Online'],
          fulfillment_mode: 'Direct shipping',
          images: []
        },
        audience_config: {
          intended_buyer_description: 'Remote knowledge workers seeking deep focus',
          adjacent_buyer_description: 'General casual podcast and music listeners',
          expected_spend_min: 50,
          expected_spend_max: 200,
          audience_markets: ['Global Online']
        }
      })
    });
    assert.equal(saveRes.status, 200);
    const testData = await saveRes.json();

    // Run simulation
    const runRes = await fetch(`${baseUrl}/api/tests/${testData.test.id}/run`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({})
    });
    assert.equal(runRes.status, 202);
    const run = await runRes.json();

    // Wait for completion
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      const poll = await fetch(`${baseUrl}/api/tests/${testData.test.id}/runs/${run.run.id}`, {
        headers: { 'Authorization': `Bearer ${founderToken}` }
      }).then(r => r.json());
      if (poll.run.status === 'completed') break;
      attempts++;
    }

    const analysis = await fetch(`${baseUrl}/api/tests/${testData.test.id}/analysis`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    }).then(r => r.json());
    assert.equal(analysis.decision_card.is_run_complete, true);
    assert.equal(analysis.decision_card.total_completed, 50);
    assert.equal(analysis.finance_analysis.option_a.has_sufficient_inputs, false);
    assert.ok(analysis.finance_analysis.option_a.missing_fields.includes('Price (not set; pricing analysis suppressed)'));
  });

  it('7. Optional A/B mode preserves 100 paired evaluations', async () => {
    const saveRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        mode: 'comparison',
        comparison_lever: 'price',
        test: {
          title: 'Hemp Tee — Pricing Elasticity A/B Test',
          domain_id: 'clothing_accessories'
        },
        offering: {
          short_value_prop: 'Breathable organic hemp summer tee',
          description: 'Eco-conscious hemp t-shirt tailored for urban professionals',
          currency: 'INR',
          period: 'launch_batch',
          domain_specific_data: {
            item_type: 'T-Shirt',
            material: '100% organic hemp',
            fit: 'Relaxed',
            sizes: ['S', 'M', 'L']
          }
        },
        option_a: {
          name: 'Hemp Tee Standard',
          price: 999,
          primary_message: 'Breathable organic hemp tee',
          served_markets: ['Bangalore', 'Mumbai'],
          fulfillment_mode: 'Courier delivery',
          images: []
        },
        option_b: {
          name: 'Hemp Tee Premium',
          price: 1299,
          primary_message: 'Breathable organic hemp tee',
          served_markets: ['Bangalore', 'Mumbai'],
          fulfillment_mode: 'Courier delivery',
          images: []
        },
        audience_config: {
          intended_buyer_description: 'Urban professionals looking for natural apparel',
          adjacent_buyer_description: 'General casualwear buyers',
          expected_spend_min: 700,
          expected_spend_max: 1500,
          audience_markets: ['Bangalore', 'Mumbai']
        }
      })
    });
    assert.equal(saveRes.status, 200);
    const testData = await saveRes.json();
    const testId = testData.test.id;

    // Run A/B simulation
    const runRes = await fetch(`${baseUrl}/api/tests/${testId}/run`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({})
    });
    assert.equal(runRes.status, 202);
    const run = await runRes.json();
    assert.equal(run.run.mode, 'comparison');
    assert.equal(run.run.total_evaluations_expected, 100);

    // Wait for completion
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      const poll = await fetch(`${baseUrl}/api/tests/${testId}/runs/${run.run.id}`, {
        headers: { 'Authorization': `Bearer ${founderToken}` }
      }).then(r => r.json());
      if (poll.run.status === 'completed') {
        assert.equal(poll.evaluations.length, 100);
        break;
      }
      attempts++;
    }

    const analysis = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    }).then(r => r.json());
    assert.equal(analysis.mode, 'comparison');
    assert.equal(analysis.decision_card.total_expected, 100);
    assert.equal(analysis.decision_card.total_completed, 100);
    assert.ok(analysis.option_a_summary);
    assert.ok(analysis.option_b_summary);
    assert.ok(analysis.transition_matrix);
  });

  it('8. Status and Smoke Test Endpoints work accurately', async () => {
    const statusRes = await fetch(`${baseUrl}/api/tests/status`);
    assert.equal(statusRes.status, 200);
    const status = await statusRes.json();
    assert.equal(typeof status.configured, 'boolean');

    const smokeRes = await fetch(`${baseUrl}/api/tests/smoke-test`, { method: 'POST' });
    assert.equal(smokeRes.status, 200);
    const smoke = await smokeRes.json();
    assert.equal(typeof smoke.success, 'boolean');
  });
});
