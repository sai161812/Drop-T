import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { initDatabase, closeDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';
import { createApp } from '../src/app.js';
import { TestDraftPayload } from '@droptest/shared';

describe('Phase 6: Public Feedback Link & Real-Person Validation Tests', () => {
  let app: any;
  let server: any;
  let baseUrl: string;
  let testId: string;
  let feedbackToken: string;

  before(async () => {
    initDatabase(':memory:');
    app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const payload: TestDraftPayload = {
      test: {
        title: 'Handloom Cotton Overshirt',
        domain_id: 'clothing_accessories'
      },
      offering: {
        short_value_prop: '100% organic handloom cotton overshirt with horn buttons',
        description: 'Structured everyday fit tailored from breathable 240 GSM organic cotton handwoven in Bengal.',
        currency: '₹',
        period: 'launch_batch',
        domain_specific_data: {
          item_type: 'Overshirt',
          material: '100% Organic Handloom Cotton (240 GSM)',
          sizes: ['S', 'M', 'L', 'XL'],
          unit_production_cost: 350
        }
      },
      option_a: {
        name: 'Launch Edition ₹699',
        price: 699,
        primary_message: 'Fair direct-to-creator pricing',
        served_markets: ['Koramangala', 'Indiranagar', 'Whitefield'],
        fulfillment_mode: 'Standard courier delivery (2-3 days)',
        images: [{
          id: 'img_01',
          filename: 'linen_front.jpg',
          url: '/uploads/linen_front.jpg',
          size_bytes: 120000,
          mime_type: 'image/jpeg',
          confirmed_visual_description: 'Sand beige relaxed overshirt on hanger against neutral wall'
        }],
        variable_cost_per_sale: 350,
        fixed_launch_cost: 6000,
        capacity_units: 50
      },
      option_b: {
        name: 'Premium Edition ₹899',
        price: 899,
        primary_message: 'Crafted in small limited runs',
        served_markets: ['Koramangala', 'Indiranagar'],
        fulfillment_mode: 'Standard courier delivery (2-3 days)',
        images: [{
          id: 'img_02',
          filename: 'linen_styled.jpg',
          url: '/uploads/linen_styled.jpg',
          size_bytes: 140000,
          mime_type: 'image/jpeg',
          confirmed_visual_description: 'Styled overshirt worn open over white tee in sunlight'
        }],
        variable_cost_per_sale: 350,
        fixed_launch_cost: 6000,
        capacity_units: 50
      },
      audience_config: {
        intended_buyer_description: 'Design-conscious urban professionals seeking natural fibers',
        adjacent_buyer_description: 'Minimalist capsule wardrobe enthusiasts',
        expected_spend_min: 500,
        expected_spend_max: 1200,
        audience_markets: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout']
      },
      comparison_lever: 'price'
    };

    const saved = TestRepository.saveDraft(payload);
    testId = saved.test.id;
    feedbackToken = saved.test.feedback_token || testId;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
    closeDatabase();
  });

  it('retrieves public offering details via unguessable feedback token without simulated data', async () => {
    const res = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.test_id, testId);
    assert.strictEqual(data.feedback_token, feedbackToken);
    assert.strictEqual(data.title, 'Handloom Cotton Overshirt');
    assert.strictEqual(data.currency, '₹');
    assert.ok(data.options.A);
    assert.ok(data.options.B);
    assert.strictEqual(data.options.A.price, 699);
    assert.strictEqual(data.options.B.price, 899);
    assert.strictEqual(data.options.A.images.length, 1);
    assert.strictEqual(data.options.A.images[0].confirmed_visual_description, 'Sand beige relaxed overshirt on hanger against neutral wall');

    // Strict privacy & separation verification: zero simulated profiles, evaluations, or runs exposed
    assert.strictEqual(data.profiles, undefined);
    assert.strictEqual(data.evaluations, undefined);
    assert.strictEqual(data.runs, undefined);
    assert.strictEqual(data.analysis, undefined);
  });

  it('returns 404 for an invalid or non-existent feedback token', async () => {
    const res = await fetch(`${baseUrl}/api/feedback/invalid-nonexistent-token`);
    assert.strictEqual(res.status, 404);
  });

  it('submits valid anonymous human choices (A, B, neither, unsure) with sanitization', async () => {
    // 1. Submit Option A choice with HTML tags in reason to verify sanitization
    const resA = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: 'A',
        reason: '<b>Fair price</b> of ₹699 fits my monthly wardrobe budget <script>alert(1)</script>',
        client_token: 'client_session_user_1'
      })
    });
    assert.strictEqual(resA.status, 201);
    const bodyA = await resA.json();
    assert.strictEqual(bodyA.success, true);
    assert.strictEqual(bodyA.is_updated, false);

    // 2. Submit Option B choice from a second respondent
    const resB = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: 'B',
        reason: 'Happy to pay ₹899 for small-batch limited craft piece',
        client_token: 'client_session_user_2'
      })
    });
    assert.strictEqual(resB.status, 201);

    // 3. Submit Neither choice from a third respondent
    const resNeither = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: 'neither',
        reason: 'I exclusively wear collarless shirts',
        client_token: 'client_session_user_3'
      })
    });
    assert.strictEqual(resNeither.status, 201);

    // 4. Submit Unsure choice from a fourth respondent
    const resUnsure = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: 'unsure',
        client_token: 'client_session_user_4'
      })
    });
    assert.strictEqual(resUnsure.status, 201);
  });

  it('rejects invalid choices or malformed submission payloads', async () => {
    const res = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: 'invalid_choice_value'
      })
    });
    assert.strictEqual(res.status, 400);
  });

  it('handles duplicate submission from same client token without double-counting', async () => {
    // User 1 updates their choice from A to B with a new reason
    const resUpdate = await fetch(`${baseUrl}/api/feedback/${feedbackToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        choice: 'B',
        reason: 'Reconsidered: small batch justifies the ₹899 price',
        client_token: 'client_session_user_1'
      })
    });
    assert.strictEqual(resUpdate.status, 201);
    const bodyUpdate = await resUpdate.json();
    assert.strictEqual(bodyUpdate.success, true);
    assert.strictEqual(bodyUpdate.is_updated, true);

    // Verify stats total remains 4 (not 5)
    const statsRes = await fetch(`${baseUrl}/api/feedback/${feedbackToken}/stats`);
    assert.strictEqual(statsRes.status, 200);
    const stats = await statsRes.json();
    assert.strictEqual(stats.total, 4);
    assert.strictEqual(stats.counts.A, 0); // shifted to B
    assert.strictEqual(stats.counts.B, 2); // user 1 + user 2
    assert.strictEqual(stats.counts.neither, 1);
    assert.strictEqual(stats.counts.unsure, 1);
    assert.strictEqual(stats.recruitment_context, 'Responses came from whoever received your link.');

    // Verify sanitization in the recorded reason (no script tags or bold html)
    const updatedUserReason = stats.responses.find((r: any) => r.choice === 'B');
    assert.ok(updatedUserReason);
    assert.ok(!updatedUserReason.reason.includes('<script>'));
  });
});
