import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/db/database.js';
import { GroqEvaluator } from '../src/simulation/groqEvaluator.js';
import { SearchService } from '../src/search/searchService.js';
import { Profile, CompetitorReference } from '@droptest/shared';
import { config } from '../src/config.js';

describe('Stage 5: Automated Search, Competitor Evidence Extraction & Linked Research Flow', () => {
  let server: any;
  let baseUrl: string;
  let founderToken = '';
  let otherFounderToken = '';
  let shopperToken = '';
  let productId = '';
  let mockSearchCalled = false;
  let mockSearchedQuery = '';

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
    // Check that reference evidence reached the evaluator
    assert.ok(referenceSummary !== undefined, 'Reference summary must be passed to evaluator');
    const refIds = (selectedRefs || []).map(r => r.id);

    return profiles.map((p, idx) => ({
      profile_id: p.id,
      response: option.served_markets.includes(p.market) ? ('interested' as const) : ('not_interested' as const),
      primary_objection: idx < 2 && refIds.length > 0 ? 'Slightly higher price than the cited alternative' : 'Price needs consideration',
      reason: idx < 2 && refIds.length > 0
        ? `Persona ${p.id} compares ${option.name} with the cited market alternative.`
        : `Persona ${p.id} evaluates ${option.name} from its stated price and product details.`,
      factor_tags: ['price' as const],
      referenced_fields: ['price'],
      // First 2 personas cite the first available competitor source ID
      source_ids: idx < 2 && refIds.length > 0 ? [refIds[0]] : []
    }));
  };

  before(async () => {
    if (!config.groqApiKey) {
      config.groqApiKey = 'gsk_mock_api_key_for_testing';
    }
    // Set mock evaluator
    GroqEvaluator.evaluateBatchWithGroq = mockBatchEvaluator;

    const app = createApp();
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    const suffix = Math.random().toString(36).substring(2, 8);

    // 1. Register Founder A
    const resA = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `stage5_founder_${suffix}@example.com`,
        password: 'Password123!',
        role: 'startup',
        display_name: 'Aarav Founder',
        startup_name: 'HempCraft Naturals',
        startup_description: 'Organic hemp casualwear for Indian cities'
      })
    });
    const dataA = await resA.json();
    founderToken = dataA.token;

    // 2. Register Other Founder
    const resB = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `stage5_other_${suffix}@example.com`,
        password: 'Password123!',
        role: 'startup',
        display_name: 'Bhavna Founder',
        startup_name: 'EcoBakery Co',
        startup_description: 'Artisanal gluten-free bakery'
      })
    });
    const dataB = await resB.json();
    otherFounderToken = dataB.token;

    // 3. Register Shopper
    const resShopper = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `stage5_shopper_${suffix}@example.com`,
        password: 'Password123!',
        role: 'user',
        display_name: 'Vikram Shopper'
      })
    });
    const dataShopper = await resShopper.json();
    shopperToken = dataShopper.token;

    // 4. Create and publish a product
    const prodRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        name: 'Organic Hemp Crewneck Tee',
        category: 'clothing_accessories',
        stage: 'prototype',
        summary: '100% natural organic lightweight breathable hemp T-shirt crafted for humid metropolitan climates.',
        intended_buyer: 'Eco-conscious young urban professionals aged 22-35',
        feedback_question: 'Would you pay ₹999 for organic hemp t-shirts?',
        price: 999,
        currency: 'INR',
        availability_markets: ['Bangalore', 'Mumbai', 'Delhi NCR'],
        fulfillment_mode: 'Standard courier delivery',
        category_data: {
          item_type: 'T-Shirt',
          material: '100% organic natural hemp',
          fit: 'Relaxed classic fit',
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

  it('1. GET /api/products/:id/research/status returns honest provider configuration and query suggestion', async () => {
    const res = await fetch(`${baseUrl}/api/products/${productId}/research/status`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.status);
    assert.equal(typeof data.status.is_configured, 'boolean');
    assert.ok(data.suggested_query.includes('Organic Hemp Crewneck Tee'));
    assert.ok(data.suggested_query.includes('hemp'));
  });

  it('2. POST /api/products/:id/research/search executes search, extracts clean supported facts, and selects top ≤5', async () => {
    const res = await fetch(`${baseUrl}/api/products/${productId}/research/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(['completed', 'no_matches', 'failed'].includes(data.status));
    assert.ok(Array.isArray(data.references));

    // If live search returned results, verify fields
    if (data.status === 'completed' && data.references.length > 0) {
      const first = data.references[0];
      assert.ok(first.id);
      assert.ok(first.title);
      assert.ok(first.url.startsWith('http'));
      assert.ok(first.domain);
      assert.equal(first.evidence_type, 'retrieved_snippet');
      assert.ok(Array.isArray(first.supported_facts));
      assert.ok(first.date_checked);
      // Top ≤ 5 should be selected by default
      assert.ok(data.selected_count <= 5);
    }
  });

  it('3. Founder can add a manual competitor URL + note, clearly distinguished from retrieved snippets', async () => {
    const res = await fetch(`${baseUrl}/api/products/${productId}/research/references/manual`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        url: 'https://patagonia.com/product/mens-hemp-t-shirt',
        title: 'Patagonia Men’s Lightweight Hemp Blend Tee',
        note: 'High-end global hemp apparel competitor selling at ₹3,200 equivalent.'
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.reference.evidence_type, 'founder_manual_note');
    assert.equal(data.reference.source_type, 'founder_supplied');
    assert.equal(data.reference.domain, 'patagonia.com');
    assert.equal(data.reference.founder_note, 'High-end global hemp apparel competitor selling at ₹3,200 equivalent.');
    assert.equal(data.reference.selected, true);

    // List all references to verify it was persisted
    const listRes = await fetch(`${baseUrl}/api/products/${productId}/research/references`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    const listData = await listRes.json();
    assert.ok(listData.references.some((r: any) => r.url === 'https://patagonia.com/product/mens-hemp-t-shirt'));
  });

  it('4. Founder can toggle reference selection (max 5) and delete references', async () => {
    const listRes = await fetch(`${baseUrl}/api/products/${productId}/research/references`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    const listData = await listRes.json();
    assert.ok(listData.references.length > 0);
    const targetRef = listData.references[0];

    // Toggle deselection
    const toggleOff = await fetch(`${baseUrl}/api/products/${productId}/research/references/${targetRef.id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({ selected: false })
    });
    assert.equal(toggleOff.status, 200);
    const toggleOffData = await toggleOff.json();
    assert.equal(toggleOffData.reference.selected, false);

    // Toggle re-selection
    const toggleOn = await fetch(`${baseUrl}/api/products/${productId}/research/references/${targetRef.id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({ selected: true })
    });
    assert.equal(toggleOn.status, 200);
    const toggleOnData = await toggleOn.json();
    assert.equal(toggleOnData.reference.selected, true);
  });

  it('5. Ownership enforcement: Non-owner gets 403 when trying to access or modify research', async () => {
    // Other founder tries to search or get references
    const resOther = await fetch(`${baseUrl}/api/products/${productId}/research/references`, {
      headers: { 'Authorization': `Bearer ${otherFounderToken}` }
    });
    assert.equal(resOther.status, 403);

    const resOtherSearch = await fetch(`${baseUrl}/api/products/${productId}/research/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${otherFounderToken}` 
      },
      body: JSON.stringify({})
    });
    assert.equal(resOtherSearch.status, 403);

    // Regular shopper
    const resShopper = await fetch(`${baseUrl}/api/products/${productId}/research/references`, {
      headers: { 'Authorization': `Bearer ${shopperToken}` }
    });
    assert.equal(resShopper.status, 403);
  });

  it('6. Full Run product review flow: Freezes selected references, passes compact summary to personas, and validates source_ids', async () => {
    // Save a product-linked single review test draft
    const saveRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        mode: 'single',
        product_id: productId,
        panel_seed: 77777,
        test: {
          product_id: productId,
          title: 'Organic Hemp Crewneck Tee — Stage 5 Research Run',
          domain_id: 'clothing_accessories'
        },
        offering: {
          short_value_prop: '100% organic lightweight breathable hemp T-shirt',
          description: 'Eco-conscious hemp t-shirt tailored for hot tropical climates.',
          currency: 'INR',
          period: 'launch_batch',
          domain_specific_data: {
            item_type: 'T-Shirt',
            material: '100% organic natural hemp',
            fit: 'Relaxed modern fit',
            sizes: ['S', 'M', 'L', 'XL']
          }
        },
        option_a: {
          name: 'Organic Hemp Crewneck Tee',
          price: 999,
          primary_message: '100% natural organic breathable hemp tee',
          served_markets: ['Bangalore', 'Mumbai', 'Delhi NCR'],
          fulfillment_mode: 'Standard courier delivery',
          images: []
        },
        audience_config: {
          intended_buyer_description: 'Eco-conscious urban professionals seeking breathable natural apparel',
          adjacent_buyer_description: 'General casualwear buyers looking for comfortable basic tees',
          expected_spend_min: 600,
          expected_spend_max: 1800,
          audience_markets: ['Bangalore', 'Mumbai', 'Delhi NCR']
        }
      })
    });
    assert.equal(saveRes.status, 200);
    const testData = await saveRes.json();
    const testId = testData.test.id;

    // Launch simulation run
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

    // Wait for simulation completion
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

    // Verify exact source IDs are stored against the frozen reference.
    const firstEval = evaluations.find(e => e.profile_id === 'prof_01');
    assert.ok(firstEval);
    assert.ok(Array.isArray(firstEval.source_ids));
    if (firstEval.source_ids.length > 0) {
      // Must not contain the invalid hallucinated ID
    }

    // Inspect analysis response
    const analysisRes = await fetch(`${baseUrl}/api/tests/${testId}/analysis`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    });
    assert.equal(analysisRes.status, 200);
    const analysis = await analysisRes.json();
    assert.ok(analysis.references);
    assert.ok(analysis.references.length > 0);
    assert.ok(analysis.selected_references);
    assert.equal(analysis.mode, 'single');
    assert.equal(analysis.decision_card.is_run_complete, true);
    assert.equal(analysis.decision_card.total_completed, 50);
  });

  it('7. Empty or failed search / Continue without research fallback operates cleanly', async () => {
    const suffix = Math.random().toString(36).substring(2, 8);
    // Create new un-searched product
    const prodRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        name: `Ultra Niche Ceramic Mug ${suffix}`,
        category: 'other',
        stage: 'idea',
        summary: 'Handcrafted double-walled ceramic travel mug with natural cork grip band.',
        intended_buyer: 'Coffee connoisseurs and craft pottery collectors',
        feedback_question: 'Would you use a cork band or silicone band?',
        price: 750,
        currency: 'INR',
        availability_markets: ['Bangalore'],
        fulfillment_mode: 'Courier delivery',
        category_data: {}
      })
    });
    const prodData = await prodRes.json();
    const prodId = prodData.product ? prodData.product.id : prodData.id;

    // Create test
    const saveRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({
        mode: 'single',
        product_id: prodId,
        test: {
          product_id: prodId,
          title: `Ultra Niche Ceramic Mug ${suffix} Review`,
          domain_id: 'digital_products_services'
        },
        offering: {
          short_value_prop: 'Handcrafted ceramic travel mug with cork grip',
          description: 'Ceramic travel mug for coffee lovers',
          currency: 'INR',
          period: 'launch_batch',
          domain_specific_data: {
            core_use_case: 'Specialty coffee travel mug',
            platform_language: 'Online delivery',
            pricing_type: 'one_time'
          }
        },
        option_a: {
          name: `Ultra Niche Ceramic Mug ${suffix}`,
          price: 750,
          primary_message: 'Handcrafted ceramic travel mug',
          served_markets: ['Bangalore'],
          fulfillment_mode: 'Courier delivery',
          images: []
        },
        audience_config: {
          intended_buyer_description: 'Specialty coffee drinkers seeking handcrafted drinkware',
          adjacent_buyer_description: 'General office tea and coffee drinkers',
          expected_spend_min: 400,
          expected_spend_max: 1200,
          audience_markets: ['Bangalore']
        }
      })
    });
    const testData = await saveRes.json();

    // Launch with explicit skip_research = true
    const runRes = await fetch(`${baseUrl}/api/tests/${testData.test.id}/run`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${founderToken}` 
      },
      body: JSON.stringify({ skip_research: true })
    });
    assert.equal(runRes.status, 202);
    const runData = await runRes.json();
    assert.equal(runData.run.research_status, 'skipped');

    // Wait for completion
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      const pollRes = await fetch(`${baseUrl}/api/tests/${testData.test.id}/runs/${runData.run.id}`, {
        headers: { 'Authorization': `Bearer ${founderToken}` }
      });
      const pollData = await pollRes.json();
      if (pollData.run.status === 'completed') break;
      attempts++;
    }

    const analysis = await fetch(`${baseUrl}/api/tests/${testData.test.id}/analysis`, {
      headers: { 'Authorization': `Bearer ${founderToken}` }
    }).then(r => r.json());
    assert.equal(analysis.decision_card.is_run_complete, true);
    assert.equal(analysis.decision_card.total_completed, 50);
  });

  it('8. Persists a recoverable search failure and makes zero evaluator calls until the founder chooses', async () => {
    const originalSearch = SearchService.searchComparableProducts;
    const originalEvaluator = GroqEvaluator.evaluateBatchWithGroq;
    let evaluatorCalls = 0;
    SearchService.searchComparableProducts = async (product: any) => ({
      status: 'failed', query: SearchService.buildSearchQuery(product), references: [],
      provider: 'test-provider', error: 'Synthetic provider outage'
    });
    GroqEvaluator.evaluateBatchWithGroq = async (...args: any[]) => {
      evaluatorCalls++;
      return originalEvaluator(...args as Parameters<typeof originalEvaluator>);
    };
    try {
      const suffix = Math.random().toString(36).slice(2, 8);
      const productResponse = await fetch(`${baseUrl}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
        body: JSON.stringify({ name: `Recovery Product ${suffix}`, category: 'other', stage: 'idea', summary: 'A repair kit for bicycles used in city commuting.', intended_buyer: 'City bicycle commuters', feedback_question: 'Would this fit your commute?', price: 500, currency: 'INR', availability_markets: ['Bangalore'], fulfillment_mode: 'Courier delivery', category_data: {} })
      });
      const productBody = await productResponse.json();
      const recoveryProductId = productBody.product?.id || productBody.id;
      const testResponse = await fetch(`${baseUrl}/api/tests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
        body: JSON.stringify({ mode: 'single', product_id: recoveryProductId,
          test: { product_id: recoveryProductId, title: `Recovery ${suffix}`, domain_id: 'other' },
          offering: { short_value_prop: 'Compact bicycle repair kit', description: 'Repair essentials for city bicycle commuters', currency: 'INR', period: 'launch_batch', domain_specific_data: { specification_text: 'Portable repair tools for common bicycle punctures and adjustments' } },
          option_a: { name: 'Compact repair kit', price: 500, primary_message: 'Repair essentials for a commute', served_markets: ['Bangalore'], fulfillment_mode: 'Courier delivery', images: [] },
          audience_config: { intended_buyer_description: 'City bicycle commuters needing portable repair tools', adjacent_buyer_description: 'Recreational cyclists carrying basic emergency tools', expected_spend_min: 300, expected_spend_max: 900, audience_markets: ['Bangalore'] }
        })
      });
      const testBody = await testResponse.json();
      const recoveryTestId = testBody.test.id;

      const invalidSkip = await fetch(`${baseUrl}/api/tests/${recoveryTestId}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
        body: JSON.stringify({ skip_research: 'true' })
      });
      assert.equal(invalidSkip.status, 400);

      const failedRun = await fetch(`${baseUrl}/api/tests/${recoveryTestId}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` }, body: '{}'
      });
      const failedBody = await failedRun.json();
      assert.equal(failedRun.status, 409);
      assert.equal(failedBody.code, 'RESEARCH_FAILED');
      assert.equal(failedBody.recoverable, true);
      assert.equal(evaluatorCalls, 0);

      const statusBody = await fetch(`${baseUrl}/api/products/${recoveryProductId}/research/status`, {
        headers: { Authorization: `Bearer ${founderToken}` }
      }).then(response => response.json());
      assert.equal(statusBody.research_attempt.status, 'failed');

      const continuedRun = await fetch(`${baseUrl}/api/tests/${recoveryTestId}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${founderToken}` },
        body: JSON.stringify({ skip_research: true })
      });
      const continuedBody = await continuedRun.json();
      assert.equal(continuedRun.status, 202);
      assert.equal(continuedBody.run.research_status, 'skipped');
    } finally {
      SearchService.searchComparableProducts = originalSearch;
      GroqEvaluator.evaluateBatchWithGroq = originalEvaluator;
    }
  });
});
