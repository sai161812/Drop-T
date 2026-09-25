import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initDatabase, closeDatabase, getDatabase } from '../src/db/database.js';
import { TestRepository } from '../src/db/testRepository.js';
import { createApp } from '../src/app.js';
import { GroqEvaluator } from '../src/simulation/groqEvaluator.js';
import { config } from '../src/config.js';
import { DOMAIN_PRESETS } from '../../client/src/config/templates.js';
import { calculateFinancials, Profile, TestDraftPayloadSchema } from '@droptest/shared';

describe('PRD acceptance and regression checks', () => {
  let server: any;
  let base: string;
  const evaluator = GroqEvaluator as any;
  const originalBatch = evaluator.evaluateBatchWithGroq;
  const originalKey = config.groqApiKey;
  const originalRetries = config.groqMaxRetries;
  const batch = async (profiles: Profile[]) => profiles.map(p => ({ profile_id: p.id, response: 'unsure', reason: 'Test fixture: confirm the supplied details.', primary_objection: 'Needs a real trial', factor_tags: ['fit'], referenced_fields: ['price', 'use_case'] }));
  const request = async (path: string, body?: unknown) => {
    const response = await fetch(`${base}${path}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json(), headers: response.headers };
  };
  const waitForRun = async (id: string) => {
    for (let n = 0; n < 200; n++) {
      const result = await request(`/api/tests/${id}/runs/latest`);
      if (!['running', 'pending'].includes(result.data.run.status)) return result.data;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Run did not finish');
  };
  before(async () => {
    initDatabase(':memory:');
    config.groqApiKey = 'test-key-never-sent';
    config.groqMaxRetries = 1;
    evaluator.evaluateBatchWithGroq = batch;
    server = createApp().listen(0);
    await new Promise<void>(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    evaluator.evaluateBatchWithGroq = originalBatch;
    config.groqApiKey = originalKey;
    config.groqMaxRetries = originalRetries;
    await new Promise<void>(resolve => server.close(resolve));
    closeDatabase();
  });

  for (const preset of Object.values(DOMAIN_PRESETS)) {
    it(`${preset.id}: saved preview matches frozen 50 profiles, 100 paired records, finance and public feedback`, async () => {
      const payload = structuredClone(preset.payload);
      payload.panel_seed = 786;
      payload.offering.sales_scenarios = { lower_units: 10, central_units: 20, higher_units: 30 };
      assert.equal(TestDraftPayloadSchema.safeParse(payload).success, true);
      const saved = await request('/api/tests', payload);
      assert.equal(saved.status, 200);
      const id = saved.data.test.id;
      const token = saved.data.test.feedback_token;
      assert.equal((await request(`/api/feedback/${token}`)).status, 404);
      assert.equal((await request(`/api/feedback/${token}`, { choice: 'A' })).status, 404);
      const panel = await request(`/api/tests/${id}/panel`);
      const preview = await request('/api/tests/preview-panel', { domain_id: payload.test.domain_id, ...payload.audience_config, option_a: payload.option_a, option_b: payload.option_b, seed: 786 });
      const meaningful = (profiles: any[]) => profiles.map(({ created_at, test_id, ...p }) => p);
      assert.deepEqual(meaningful(panel.data.profiles), meaningful(preview.data.profiles));
      assert.equal((await request(`/api/tests/${id}/run`, {})).status, 202);
      const { run, evaluations } = await waitForRun(id);
      assert.equal(run.status, 'completed');
      assert.equal(run.profile_seed, 786);
      assert.equal(evaluations.length, 100);
      assert.equal(new Set(evaluations.map((e: any) => `${e.profile_id}:${e.option_id}`)).size, 100);
      const snapshot = TestRepository.getRunSnapshot(run.id)!;
      assert.deepEqual(meaningful(snapshot.profiles), meaningful(panel.data.profiles));
      assert.ok(snapshot.profiles[0].use_case.includes(payload.audience_config.intended_buyer_description));
      for (const evaluation of evaluations) {
        const profile = snapshot.profiles.find(p => p.id === evaluation.profile_id)!;
        const served = snapshot.test.options[evaluation.option_id as 'A' | 'B'].served_markets.includes(profile.market);
        assert.equal(evaluation.response === 'unavailable', !served);
      }
      assert.equal((await request('/api/tests', { ...payload, test: { ...payload.test, id } })).status, 409);
      assert.equal((await request(`/api/tests/${id}/panel/generate`, { seed: 999 })).status, 409);
      assert.equal((await request(`/api/feedback/${id}`)).status, 404);
      const publicView = await request(`/api/feedback/${token}`);
      assert.equal(publicView.status, 200);
      assert.equal(publicView.data.options.A.variable_cost_per_sale, undefined);
      assert.equal(publicView.data.domain_specific_data.unit_production_cost, undefined);
      assert.equal(publicView.data.domain_specific_data.unit_prep_delivery_cost, undefined);
      assert.equal((await request(`/api/feedback/${token}`, { choice: 'B', client_token: 'anonymous', reason: '<b>Useful</b>' })).status, 201);
      await request(`/api/feedback/${token}`, { choice: 'A', client_token: 'anonymous' });
      const stats = await request(`/api/tests/${id}/feedback-stats`);
      assert.equal(stats.data.total, 1);
      assert.equal(stats.data.counts.A, 1);
      const analysis = await request(`/api/tests/${id}/analysis`);
      assert.equal(analysis.data.decision_card.is_run_complete, true);
      assert.equal(analysis.data.finance_analysis.option_a.scenarios.lower.units, 10);
      if (preset.id === 'clothing_accessories') {
        assert.equal(analysis.data.finance_analysis.option_a.break_even_units, 18);
        assert.equal(analysis.data.finance_analysis.option_b.break_even_units, 11);
      }
      if (preset.id === 'digital_products_services') assert.equal(analysis.data.period, 'first_month');
    });
  }

  it('partial retry preserves existing records, reports progress and rejects cross-test run access', async () => {
    const saved = await request('/api/tests', DOMAIN_PRESETS.clothing_accessories.payload);
    const id = saved.data.test.id;
    evaluator.evaluateBatchWithGroq = async (profiles: Profile[]) => {
      if (profiles.some(p => p.id === 'prof_01')) throw new Error('Simulated provider failure');
      await new Promise(resolve => setTimeout(resolve, 30));
      return batch(profiles);
    };
    assert.equal((await request(`/api/tests/${id}/run`, {})).status, 202);
    const partial = await waitForRun(id);
    assert.equal(partial.run.status, 'partial');
    assert.ok(partial.evaluations.length > 0 && partial.evaluations.length < 100);
    const initialRecords = partial.evaluations;
    const analysis = await request(`/api/tests/${id}/analysis`);
    assert.equal(analysis.data.decision_card.is_run_complete, false);
    const other = (await request('/api/tests', DOMAIN_PRESETS.local_food_beverages.payload)).data.test.id;
    assert.equal((await request(`/api/tests/${other}/runs/${partial.run.id}`)).status, 404);
    assert.equal((await request(`/api/tests/${other}/runs/${partial.run.id}/retry`, {})).status, 404);
    assert.equal((await request(`/api/tests/${other}/runs/${partial.run.id}/analysis`)).status, 404);
    evaluator.evaluateBatchWithGroq = batch;
    assert.equal((await request(`/api/tests/${id}/runs/${partial.run.id}/retry`, {})).status, 202);
    const complete = await waitForRun(id);
    assert.equal(complete.evaluations.length, 100);
    for (const record of initialRecords) assert.deepEqual(complete.evaluations.find((e: any) => e.id === record.id), record);
    // Even direct changes to live draft storage cannot reinterpret a historical run.
    getDatabase().prepare('UPDATE options SET price = 1 WHERE test_id = ?').run(id);
    assert.equal((await request(`/api/tests/${id}/analysis`)).data.options.A.price, 699);
    // Repeated inserts never inflate a run to a false completed count.
    TestRepository.saveEvaluations([{ ...complete.evaluations[0], id: randomUUID() }]);
    assert.equal(TestRepository.getEvaluationsByRunId(partial.run.id).length, 100);
  });

  it('rejects multiple levers and invalid sales scenarios', async () => {
    const payload = structuredClone(DOMAIN_PRESETS.clothing_accessories.payload);
    payload.option_b.primary_message = 'An unrelated message';
    assert.equal((await request('/api/tests', payload)).status, 400);
    const result = calculateFinancials({ price: 10, variable_cost_per_sale: 2, fixed_launch_cost: 0, currency: 'USD', period: 'first_month', sales_scenarios: { lower_units: -1, central_units: 1.5, higher_units: Infinity } });
    assert.equal(result.scenarios?.lower?.is_valid, false);
    assert.equal(result.scenarios?.central?.is_valid, false);
    assert.equal(result.scenarios?.higher?.is_valid, false);
  });

  it('never counts duplicate, unknown-profile or unknown-field model output as a complete panel', async () => {
    const saved = await request('/api/tests', DOMAIN_PRESETS.digital_products_services.payload);
    evaluator.evaluateBatchWithGroq = async (profiles: Profile[]) => {
      const valid = await batch(profiles);
      return [valid[0], valid[0], { ...valid[0], profile_id: 'invented_profile' }, ...valid.slice(1).map(item => ({ ...item, referenced_fields: ['invented_market_size'] }))];
    };
    await request(`/api/tests/${saved.data.test.id}/run`, {});
    const partial = await waitForRun(saved.data.test.id);
    assert.equal(partial.run.status, 'partial');
    assert.ok(partial.evaluations.length < 100);
    assert.equal(new Set(partial.evaluations.map((e: any) => `${e.profile_id}:${e.option_id}`)).size, partial.evaluations.length);
    assert.ok(partial.evaluations.every((e: any) => e.profile_id !== 'invented_profile' && !e.referenced_fields.includes('invented_market_size')));
    evaluator.evaluateBatchWithGroq = batch;
  });

  it('rejects disguised uploads, preserves uploaded images and serves the production feedback route', async () => {
    const bad = new FormData();
    bad.append('image', new Blob(['<html>not an image</html>'], { type: 'image/png' }), 'pretend.png');
    assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', body: bad })).status, 400);
    const good = new FormData();
    good.append('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'renamed.html');
    const uploaded = await fetch(`${base}/api/upload`, { method: 'POST', body: good });
    assert.equal(uploaded.status, 201);
    const image = await uploaded.json();
    assert.ok(image.url.endsWith('.png'));
    const imageResponse = await fetch(`${base}${image.url}`);
    assert.equal(imageResponse.status, 200);
    assert.equal(imageResponse.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal((await fetch(`${base}/feedback/example-token`)).status, 200);
  });

  it('rate limits submissions even when duplicate tokens are changed', async () => {
    let limited: Awaited<ReturnType<typeof request>> | undefined;
    for (let i = 0; i < 35; i++) {
      const response = await request('/api/feedback/invalid-token', { choice: 'A', client_token: String(i) });
      if (response.status === 429) { limited = response; break; }
    }
    assert.equal(limited?.status, 429);
    assert.ok(Number(limited?.headers.get('Retry-After')) > 0);
  });
});
