import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/db/database.js';

describe('Stage 3: Support Proposals, Role Enforcement & Incoming Inbox Tests', () => {
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
  const founderAEmail = `founder_a_${runId}@artisan.in`;
  const founderBEmail = `founder_b_${runId}@bakes.in`;
  const sponsorEmail = `sponsor_${runId}@growthfunds.vc`;
  const shopperEmail = `shopper_${runId}@gmail.com`;

  let founderAToken: string;
  let founderBToken: string;
  let sponsorToken: string;
  let shopperToken: string;
  let productAId: string;

  it('1. Sets up test accounts (Founder A, Founder B, Sponsor, Shopper) and publishes product A', async () => {
    // Founder A
    const faRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: founderAEmail,
        password: 'password123',
        role: 'startup',
        display_name: 'Aarav Founder A',
        startup_name: 'Artisan Potteries',
        startup_description: 'Handmade ceramic cookware'
      })
    });
    assert.equal(faRes.status, 201);
    const faData: any = await faRes.json();
    founderAToken = faData.token;

    // Founder B
    const fbRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: founderBEmail,
        password: 'password123',
        role: 'startup',
        display_name: 'Maya Founder B',
        startup_name: 'Maya Bakery Labs'
      })
    });
    assert.equal(fbRes.status, 201);
    const fbData: any = await fbRes.json();
    founderBToken = fbData.token;

    // Sponsor
    const spRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sponsorEmail,
        password: 'password123',
        role: 'sponsor',
        display_name: 'Vikram Backer'
      })
    });
    assert.equal(spRes.status, 201);
    const spData: any = await spRes.json();
    sponsorToken = spData.token;

    // Shopper
    const shRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: shopperEmail,
        password: 'password123',
        role: 'user',
        display_name: 'Rohan Shopper'
      })
    });
    assert.equal(shRes.status, 201);
    const shData: any = await shRes.json();
    shopperToken = shData.token;

    // Publish Product A
    const pRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${founderAToken}`
      },
      body: JSON.stringify({
        name: 'Terracotta Self-Watering Planter',
        category: 'other',
        stage: 'prototype',
        summary: 'Porous unglazed terracotta planter with built-in sub-irrigation reservoir for indoor plants.',
        intended_buyer: 'Urban apartment gardeners who travel frequently',
        feedback_question: 'Would you pay ₹850 for a 2-liter reservoir planter?',
        price: 850,
        currency: 'INR',
        availability_markets: ['Bangalore Urban', 'Pune City'],
        fulfillment_mode: 'Fragile bubble-padded shipping',
        images: [],
        category_data: {
          specs: '2L water capacity, porous natural terracotta, overflow drainage tray'
        },
        status: 'published'
      })
    });
    assert.equal(pRes.status, 201);
    const pData: any = await pRes.json();
    productAId = pData.id;
  });

  it('2. Sponsor submits a valid support proposal with positive amount and message', async () => {
    const propRes = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        message: 'Interested in backing early batch production of 100 units.'
      })
    });
    assert.equal(propRes.status, 200);
    const data: any = await propRes.json();
    assert.equal(data.success, true);
    assert.equal(data.proposal.amount, 500);
    assert.equal(data.proposal.currency, 'INR');
    assert.equal(data.proposal.message, 'Interested in backing early batch production of 100 units.');
    assert.equal(data.proposal.sender_name, 'Vikram Backer');
    assert.equal(data.proposal.sender_role, 'sponsor');
    assert.equal(data.proposal.product_name, 'Terracotta Self-Watering Planter');
  });

  it('3. Another startup founder (Founder B) submits a support proposal to Product A', async () => {
    const propRes = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${founderBToken}`
      },
      body: JSON.stringify({
        amount: 1200,
        currency: 'INR',
        message: 'Love the sustainable approach, offering support for testing in cafe settings.'
      })
    });
    assert.equal(propRes.status, 200);
    const data: any = await propRes.json();
    assert.equal(data.success, true);
    assert.equal(data.proposal.amount, 1200);
    assert.equal(data.proposal.sender_role, 'startup');
    assert.equal(data.proposal.sender_startup_name, 'Maya Bakery Labs');
  });

  it('4. One proposal per sender/product: Submitting again updates existing proposal without duplicating', async () => {
    const updateRes = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        amount: 2500,
        currency: 'INR',
        message: 'Increased proposed support after reviewing design specifications.'
      })
    });
    assert.equal(updateRes.status, 200);
    const data: any = await updateRes.json();
    assert.equal(data.proposal.amount, 2500);
    assert.equal(data.proposal.message, 'Increased proposed support after reviewing design specifications.');

    // Verify detail endpoint reflects the updated proposal for sponsor
    const detailRes = await fetch(`${baseUrl}/api/products/${productAId}`, {
      headers: { Authorization: `Bearer ${sponsorToken}` }
    });
    const detail: any = await detailRes.json();
    assert.ok(detail.user_proposal);
    assert.equal(detail.user_proposal.amount, 2500);
    assert.equal(detail.user_proposal.message, 'Increased proposed support after reviewing design specifications.');
  });

  it('5. Role enforcement: Rejects proposal submission from regular shopper account (403)', async () => {
    const shopperAttempt = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shopperToken}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        message: 'Shopper trying to propose support'
      })
    });
    assert.equal(shopperAttempt.status, 403);
  });

  it('6. Rejects founder proposing support on their own product', async () => {
    const selfProposal = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${founderAToken}`
      },
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        message: 'Self backing attempt'
      })
    });
    assert.equal(selfProposal.status, 400);
  });

  it('7. Validation rejects non-positive (0 or negative) amounts and empty messages', async () => {
    // Negative amount
    const negRes = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        amount: -500,
        currency: 'INR',
        message: 'Negative amount'
      })
    });
    assert.equal(negRes.status, 400);

    // Zero amount
    const zeroRes = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        amount: 0,
        currency: 'INR',
        message: 'Zero amount'
      })
    });
    assert.equal(zeroRes.status, 400);

    // Short message (< 3 chars)
    const shortMsg = await fetch(`${baseUrl}/api/products/${productAId}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        message: 'Hi'
      })
    });
    assert.equal(shortMsg.status, 400);
  });

  it('8. Receiving founder (Founder A) sees incoming proposals inbox with full sender context', async () => {
    const inboxRes = await fetch(`${baseUrl}/api/products/proposals/incoming`, {
      headers: { Authorization: `Bearer ${founderAToken}` }
    });
    assert.equal(inboxRes.status, 200);
    const inboxData: any = await inboxRes.json();
    assert.ok(Array.isArray(inboxData.proposals));
    assert.equal(inboxData.proposals.length, 2);

    const sponsorProposal = inboxData.proposals.find((p: any) => p.sender_name === 'Vikram Backer');
    assert.ok(sponsorProposal);
    assert.equal(sponsorProposal.amount, 2500);
    assert.equal(sponsorProposal.sender_role, 'sponsor');

    const founderBProposal = inboxData.proposals.find((p: any) => p.sender_name === 'Maya Founder B');
    assert.ok(founderBProposal);
    assert.equal(founderBProposal.amount, 1200);
    assert.equal(founderBProposal.sender_role, 'startup');
    assert.equal(founderBProposal.sender_startup_name, 'Maya Bakery Labs');
  });

  it('9. Founder B only sees proposals for their own products (isolation check)', async () => {
    const founderBInbox = await fetch(`${baseUrl}/api/products/proposals/incoming`, {
      headers: { Authorization: `Bearer ${founderBToken}` }
    });
    assert.equal(founderBInbox.status, 200);
    const data: any = await founderBInbox.json();
    // Founder B has not published any products with received proposals
    assert.equal(data.proposals.length, 0);
  });
});
