import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/db/database.js';

describe('Stage 2: Saved Products, Save/Unsave Toggle & Structured Community Feedback Tests', () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  before(async () => {
    app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
    closeDatabase();
  });

  const runId = Math.random().toString(36).substring(2, 8);
  const founderEmail = `founder_s2_${runId}@craftapparel.in`;
  const shopperEmail = `shopper_s2_${runId}@gmail.com`;
  const sponsorEmail = `sponsor_s2_${runId}@angelfund.in`;

  let founderToken: string;
  let shopperToken: string;
  let sponsorToken: string;
  let productId: string;

  it('1. Prepares test accounts (founder, shopper, sponsor) and publishes a product', async () => {
    // Founder
    const fRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: founderEmail,
        password: 'password123',
        role: 'startup',
        display_name: 'Dev Founder',
        startup_name: 'Craft Apparel Co',
        startup_description: 'Ethically crafted organic linen'
      })
    });
    assert.equal(fRes.status, 201);
    const fData: any = await fRes.json();
    founderToken = fData.token;

    // Shopper
    const shRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: shopperEmail,
        password: 'password123',
        role: 'user',
        display_name: 'Priya Shopper'
      })
    });
    assert.equal(shRes.status, 201);
    const shData: any = await shRes.json();
    shopperToken = shData.token;

    // Sponsor
    const spRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sponsorEmail,
        password: 'password123',
        role: 'sponsor',
        display_name: 'Kabir Backer'
      })
    });
    assert.equal(spRes.status, 201);
    const spData: any = await spRes.json();
    sponsorToken = spData.token;

    // Publish product
    const pRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${founderToken}`
      },
      body: JSON.stringify({
        name: 'Handcrafted Hemp Tote Bag',
        category: 'clothing_accessories',
        stage: 'prototype',
        summary: 'Heavy-duty 100% organic raw hemp tote with reinforced seams and interior bottle sleeve.',
        intended_buyer: 'Urban conscious shoppers needing an everyday carry',
        feedback_question: 'Would you carry this for daily commute at ₹499?',
        price: 499,
        currency: 'INR',
        availability_markets: ['Bangalore Urban', 'Mumbai Suburbs'],
        fulfillment_mode: 'Direct Postal Courier',
        images: [],
        category_data: {
          item_type: 'Bag',
          material: '100% Hemp Canvas',
          fit: 'Standard 18L Tote'
        },
        status: 'published'
      })
    });
    assert.equal(pRes.status, 201);
    const pData: any = await pRes.json();
    productId = pData.id;
  });

  it('2. Save / Unsave toggle accurately updates save count and persisted saved list', async () => {
    // Initial state: save_count is 0, is_saved is false
    const initialDetailRes = await fetch(`${baseUrl}/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${shopperToken}` }
    });
    const initialDetail: any = await initialDetailRes.json();
    assert.equal(initialDetail.save_count, 0);
    assert.equal(initialDetail.is_saved, false);

    // Initial saved list for shopper is empty
    const emptySavedRes = await fetch(`${baseUrl}/api/products/saved/all`, {
      headers: { Authorization: `Bearer ${shopperToken}` }
    });
    const emptySaved: any = await emptySavedRes.json();
    assert.equal(emptySaved.products.length, 0);

    // 1. Shopper saves the product
    const saveRes = await fetch(`${baseUrl}/api/products/${productId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shopperToken}`
      },
      body: JSON.stringify({ saved: true })
    });
    assert.equal(saveRes.status, 200);
    const saveData: any = await saveRes.json();
    assert.equal(saveData.is_saved, true);
    assert.equal(saveData.save_count, 1);

    // Verify detail page reflects saved state
    const afterSaveRes = await fetch(`${baseUrl}/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${shopperToken}` }
    });
    const afterSave: any = await afterSaveRes.json();
    assert.equal(afterSave.save_count, 1);
    assert.equal(afterSave.is_saved, true);

    // Verify product appears in Saved page list
    const savedListRes = await fetch(`${baseUrl}/api/products/saved/all`, {
      headers: { Authorization: `Bearer ${shopperToken}` }
    });
    const savedList: any = await savedListRes.json();
    assert.equal(savedList.products.length, 1);
    assert.equal(savedList.products[0].id, productId);
    assert.equal(savedList.products[0].name, 'Handcrafted Hemp Tote Bag');

    // 2. Shopper unsaves the product
    const unsaveRes = await fetch(`${baseUrl}/api/products/${productId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shopperToken}`
      },
      body: JSON.stringify({ saved: false })
    });
    assert.equal(unsaveRes.status, 200);
    const unsaveData: any = await unsaveRes.json();
    assert.equal(unsaveData.is_saved, false);
    assert.equal(unsaveData.save_count, 0);

    // Verify product removed from Saved list
    const listAfterUnsave = await fetch(`${baseUrl}/api/products/saved/all`, {
      headers: { Authorization: `Bearer ${shopperToken}` }
    });
    const listAfterUnsaveData: any = await listAfterUnsave.json();
    assert.equal(listAfterUnsaveData.products.length, 0);
  });

  it('3. Submits structured feedback (Yes/Maybe/No, factor, reason) from shopper', async () => {
    const feedbackRes = await fetch(`${baseUrl}/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shopperToken}`
      },
      body: JSON.stringify({
        choice: 'maybe',
        factor: 'price',
        reason: 'Would love water-resistant lining for the rainy season.'
      })
    });
    assert.equal(feedbackRes.status, 200);
    const fbData: any = await feedbackRes.json();
    assert.equal(fbData.success, true);
    assert.equal(fbData.feedback.choice, 'maybe');
    assert.equal(fbData.feedback.factor, 'price');
    assert.equal(fbData.feedback_summary.total, 1);
    assert.equal(fbData.feedback_summary.counts.maybe, 1);
    assert.equal(fbData.feedback_summary.counts.yes, 0);
    assert.equal(fbData.feedback_summary.counts.no, 0);
    assert.equal(fbData.feedback_summary.factor_counts.price, 1);
  });

  it('4. Submits feedback from sponsor (proves all 3 roles can respond)', async () => {
    const sponsorFbRes = await fetch(`${baseUrl}/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        choice: 'yes',
        factor: 'quality_details',
        reason: 'Hemp canvas durability is exceptional at this price point.'
      })
    });
    assert.equal(sponsorFbRes.status, 200);
    const spFbData: any = await sponsorFbRes.json();
    assert.equal(spFbData.feedback_summary.total, 2);
    assert.equal(spFbData.feedback_summary.counts.yes, 1);
    assert.equal(spFbData.feedback_summary.counts.maybe, 1);
    assert.equal(spFbData.feedback_summary.counts.no, 0);
  });

  it('5. Editing an existing response changes the choice distribution WITHOUT increasing respondent count', async () => {
    // Shopper changes choice from 'maybe' to 'yes' and factor from 'price' to 'design_fit'
    const editFbRes = await fetch(`${baseUrl}/api/products/${productId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shopperToken}`
      },
      body: JSON.stringify({
        choice: 'yes',
        factor: 'design_fit',
        reason: 'Checked dimensions, 18L is the perfect size for laptop and bottle.'
      })
    });
    assert.equal(editFbRes.status, 200);
    const editFbData: any = await editFbRes.json();

    // Total respondent count MUST REMAIN 2
    assert.equal(editFbData.feedback_summary.total, 2, 'Total respondents must remain 2');
    // Counts updated: 2 Yes, 0 Maybe, 0 No
    assert.equal(editFbData.feedback_summary.counts.yes, 2);
    assert.equal(editFbData.feedback_summary.counts.maybe, 0);
    assert.equal(editFbData.feedback_summary.counts.no, 0);
    // Factor counts updated
    assert.equal(editFbData.feedback_summary.factor_counts.design_fit, 1);
    assert.equal(editFbData.feedback_summary.factor_counts.quality_details, 1);
    assert.equal(editFbData.feedback_summary.factor_counts.price, 0);
  });

  it('6. Founder can access detailed feedback breakdown with verified respondent info; non-owner gets 403', async () => {
    // Non-owner (shopper) attempt
    const forbiddenRes = await fetch(`${baseUrl}/api/products/${productId}/feedback/breakdown`, {
      headers: { Authorization: `Bearer ${shopperToken}` }
    });
    assert.equal(forbiddenRes.status, 403);

    // Founder attempt
    const breakdownRes = await fetch(`${baseUrl}/api/products/${productId}/feedback/breakdown`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    assert.equal(breakdownRes.status, 200);
    const breakdown: any = await breakdownRes.json();

    assert.equal(breakdown.total, 2);
    assert.equal(breakdown.counts.yes, 2);
    assert.equal(breakdown.counts.maybe, 0);
    assert.equal(breakdown.counts.no, 0);
    assert.equal(breakdown.responses.length, 2);

    const shopperEntry = breakdown.responses.find((r: any) => r.author.display_name === 'Priya Shopper');
    assert.ok(shopperEntry);
    assert.equal(shopperEntry.choice, 'yes');
    assert.equal(shopperEntry.factor, 'design_fit');
    assert.equal(shopperEntry.reason, 'Checked dimensions, 18L is the perfect size for laptop and bottle.');

    const sponsorEntry = breakdown.responses.find((r: any) => r.author.display_name === 'Kabir Backer');
    assert.ok(sponsorEntry);
    assert.equal(sponsorEntry.author.role, 'sponsor');
    assert.equal(sponsorEntry.choice, 'yes');
    assert.equal(sponsorEntry.factor, 'quality_details');
  });

  it('7. Verifies saves and feedback are counted independently', async () => {
    // Sponsor saves the product (shopper had unsaved earlier)
    await fetch(`${baseUrl}/api/products/${productId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({ saved: true })
    });

    const detailRes = await fetch(`${baseUrl}/api/products/${productId}`);
    const detail: any = await detailRes.json();

    // Saves is 1 (Sponsor only)
    assert.equal(detail.save_count, 1);
    // Feedback total is 2 (Shopper + Sponsor)
    assert.equal(detail.feedback_summary.total, 2);
  });
});
