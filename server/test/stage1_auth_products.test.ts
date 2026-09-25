import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/database.js';

describe('Stage 1: Role-based Auth, Product Publishing & Explore Feed Tests', () => {
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
  const startupEmail = `founder_${runId}@ecothreads.in`;
  const userEmail = `user_${runId}@gmail.com`;
  const sponsorEmail = `sponsor_${runId}@growth.vc`;
  const otherStartupEmail = `other_${runId}@bake.in`;

  let startupToken: string;
  let otherStartupToken: string;
  let userToken: string;
  let sponsorToken: string;
  let createdProductId: string;

  it('1. Signs up a startup account, user account, and sponsor account', async () => {
    // 1. Startup signup
    const startupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: startupEmail,
        password: 'password123',
        role: 'startup',
        display_name: 'Aarav Founder',
        startup_name: 'EcoThreads Test Apparel',
        startup_description: 'Organic clothing made from 100% natural flax'
      })
    });
    assert.equal(startupRes.status, 201);
    const startupData: any = await startupRes.json();
    assert.equal(startupData.user.role, 'startup');
    assert.equal(startupData.user.startup_name, 'EcoThreads Test Apparel');
    assert.ok(startupData.token);
    startupToken = startupData.token;

    // 2. Regular user signup
    const userRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'password123',
        role: 'user',
        display_name: 'Riya Shopper'
      })
    });
    assert.equal(userRes.status, 201);
    const userData: any = await userRes.json();
    assert.equal(userData.user.role, 'user');
    userToken = userData.token;

    // 3. Sponsor signup
    const sponsorRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sponsorEmail,
        password: 'password123',
        role: 'sponsor',
        display_name: 'Vikram Sponsor'
      })
    });
    assert.equal(sponsorRes.status, 201);
    const sponsorData: any = await sponsorRes.json();
    assert.equal(sponsorData.user.role, 'sponsor');
    sponsorToken = sponsorData.token;

    // 4. Second startup signup (for non-owner tests)
    const otherStartupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: otherStartupEmail,
        password: 'password123',
        role: 'startup',
        display_name: 'Maya Other Founder',
        startup_name: 'Other Startup Bakery'
      })
    });
    assert.equal(otherStartupRes.status, 201);
    const otherData: any = await otherStartupRes.json();
    otherStartupToken = otherData.token;
  });

  it('2. Rejects duplicate email registration and invalid credentials', async () => {
    // Duplicate email
    const dupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: startupEmail,
        password: 'password123',
        role: 'user',
        display_name: 'Duplicate'
      })
    });
    assert.equal(dupRes.status, 409);

    // Wrong password login
    const wrongLogin = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: startupEmail,
        password: 'wrong_password'
      })
    });
    assert.equal(wrongLogin.status, 401);

    // Successful login retrieves stored role
    const correctLogin = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: startupEmail,
        password: 'password123'
      })
    });
    assert.equal(correctLogin.status, 200);
    const loggedIn: any = await correctLogin.json();
    assert.equal(loggedIn.user.role, 'startup');
  });

  it('3. Validates current session via /api/auth/me', async () => {
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${startupToken}` }
    });
    assert.equal(meRes.status, 200);
    const meData: any = await meRes.json();
    assert.equal(meData.user.email, startupEmail);
    assert.equal(meData.user.role, 'startup');

    // Anonymous request returns null user
    const anonRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(anonRes.status, 200);
    const anonData: any = await anonRes.json();
    assert.equal(anonData.user, null);
  });

  it('4. Role enforcement: Rejects product creation from user or sponsor accounts', async () => {
    const userCreate = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: 'Unauthorized User Product',
        category: 'clothing_accessories',
        stage: 'idea',
        summary: 'Should be rejected because user is not a startup'
      })
    });
    assert.equal(userCreate.status, 403);

    const sponsorCreate = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sponsorToken}`
      },
      body: JSON.stringify({
        name: 'Unauthorized Sponsor Product',
        category: 'clothing_accessories',
        stage: 'idea',
        summary: 'Should be rejected because sponsor cannot create product'
      })
    });
    assert.equal(sponsorCreate.status, 403);
  });

  it('5. Allows startup to create a product draft and publish it', async () => {
    // 1. Create Draft
    const draftRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${startupToken}`
      },
      body: JSON.stringify({
        name: 'Organic Flax Linen T-Shirt',
        category: 'clothing_accessories',
        stage: 'preparing_to_launch',
        summary: 'Hypoallergenic sustainable casual linen shirt for warm weather',
        intended_buyer: 'Young professionals seeking sustainable fashion',
        feedback_question: 'Would you pay ₹699 for an unbleached linen shirt with free lifetime seam repairs?',
        price: 699,
        currency: 'INR',
        availability_markets: ['Bangalore Urban', 'Chennai Central'],
        fulfillment_mode: 'Postal shipping',
        images: [],
        category_data: {
          item_type: 'Shirt',
          material: '100% Organic Flax Linen',
          sizes: ['S', 'M', 'L', 'XL'],
          fit: 'Relaxed Fit'
        },
        status: 'published'
      })
    });
    assert.equal(draftRes.status, 201);
    const product: any = await draftRes.json();
    assert.ok(product.id);
    assert.equal(product.status, 'published');
    assert.equal(product.price, 699);
    assert.equal(product.category_data.material, '100% Organic Flax Linen');
    createdProductId = product.id;
  });

  it('6. Published product appears in Explore Feed and opens by public URL', async () => {
    // 1. Explore Feed
    const feedRes = await fetch(`${baseUrl}/api/products`);
    assert.equal(feedRes.status, 200);
    const feedData: any = await feedRes.json();
    assert.ok(Array.isArray(feedData.products));
    const found = feedData.products.find((p: any) => p.id === createdProductId);
    assert.ok(found, 'Product should appear in published feed');
    assert.equal(found.name, 'Organic Flax Linen T-Shirt');
    assert.equal(found.startup_name, 'EcoThreads Test Apparel');

    // 2. Public Detail Page
    const detailRes = await fetch(`${baseUrl}/api/products/${createdProductId}`);
    assert.equal(detailRes.status, 200);
    const detail: any = await detailRes.json();
    assert.equal(detail.name, 'Organic Flax Linen T-Shirt');
    assert.equal(detail.owner.startup_name, 'EcoThreads Test Apparel');
    assert.equal(detail.feedback_summary.total, 0);
    assert.equal(detail.save_count, 0);
  });

  it('7. Enforces ownership: Non-owner startup cannot edit the product', async () => {
    const editRes = await fetch(`${baseUrl}/api/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherStartupToken}`
      },
      body: JSON.stringify({
        name: 'Hacked Product Name by Other Founder',
        category: 'clothing_accessories',
        stage: 'launched',
        summary: 'Malicious modification attempt'
      })
    });
    assert.equal(editRes.status, 403);

    // Verify product was not altered
    const verifyRes = await fetch(`${baseUrl}/api/products/${createdProductId}`);
    const verified: any = await verifyRes.json();
    assert.equal(verified.name, 'Organic Flax Linen T-Shirt');
  });

  it('8. Allows owner to edit published product and retains updated details', async () => {
    const editRes = await fetch(`${baseUrl}/api/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${startupToken}`
      },
      body: JSON.stringify({
        name: 'Organic Flax Linen T-Shirt (Updated Edition)',
        category: 'clothing_accessories',
        stage: 'preparing_to_launch',
        summary: 'Hypoallergenic sustainable casual linen shirt with reinforced coconut button collar',
        intended_buyer: 'Young professionals seeking sustainable fashion',
        feedback_question: 'Would you pay ₹749 if coconut shell buttons are included?',
        price: 749,
        currency: 'INR',
        availability_markets: ['Bangalore Urban', 'Chennai Central', 'Hyderabad'],
        fulfillment_mode: 'Postal shipping',
        images: [],
        category_data: {
          item_type: 'Shirt',
          material: '100% Organic Flax Linen',
          sizes: ['S', 'M', 'L', 'XL'],
          fit: 'Relaxed Regular Fit'
        },
        status: 'published'
      })
    });
    assert.equal(editRes.status, 200);
    const updated: any = await editRes.json();
    assert.equal(updated.name, 'Organic Flax Linen T-Shirt (Updated Edition)');
    assert.equal(updated.price, 749);
    assert.deepEqual(updated.availability_markets, ['Bangalore Urban', 'Chennai Central', 'Hyderabad']);
  });
});
