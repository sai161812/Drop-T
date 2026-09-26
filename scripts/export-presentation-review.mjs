import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Export only one completed review. No user credentials or sessions are read.
const [runId, databasePath = 'server/data/droptest.sqlite'] = process.argv.slice(2);
if (!runId || !/^[a-zA-Z0-9-]+$/.test(runId)) throw new Error('Usage: node scripts/export-presentation-review.mjs RUN_ID [DATABASE_PATH]');
const db = new DatabaseSync(databasePath, { readOnly: true });
const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId);
if (!run || run.status !== 'completed') throw new Error('Export requires a completed review.');
const rows = db.prepare('SELECT * FROM evaluations WHERE run_id = ? ORDER BY option_id, profile_id').all(runId);
if (rows.length !== run.total_evaluations_expected) throw new Error('Evaluation count does not match the completed run.');
const snapshot = JSON.parse(run.snapshot);
const profiles = new Map(snapshot.profiles.map(profile => [profile.id, profile]));
db.close();
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const counts = rows.reduce((result, row) => { result[row.response] = (result[row.response] || 0) + 1; return result; }, {});
const title = snapshot.test.test.title;
const cards = rows.map((row, index) => {
  const persona = profiles.get(row.profile_id) || {};
  return `<article><h3>${index + 1}. ${escape(persona.segment)} · ${escape(persona.market)}</h3><p class="verdict">${escape(row.response.replaceAll('_', ' '))} · Option ${escape(row.option_id)}</p><p>${escape(persona.use_case)}</p><p>${escape(row.reason)}</p>${row.primary_objection ? `<p><b>Objection:</b> ${escape(row.primary_objection)}</p>` : ''}</article>`;
}).join('\n');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — Saved review</title><style>body{font:16px/1.6 system-ui,sans-serif;background:#f5f5f3;color:#182332;margin:0}main{max-width:1000px;margin:auto;padding:40px 24px}h1{line-height:1.2}header,article{background:white;border:1px solid #d8dde2;border-radius:12px;padding:24px;margin-bottom:18px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}article{margin:0}h3{margin-top:0}.verdict{font-weight:700;text-transform:capitalize}.muted{color:#526171}@media print{body{background:white}main{padding:0}article{break-inside:avoid}.grid{display:block}article{margin-bottom:12px}}</style><main><header><p class="muted">DROPTEST · Synthetic Lab · Saved results</p><h1>${escape(title)}</h1><p>${rows.length} of ${run.total_evaluations_expected} evaluations completed. Model: ${escape(run.model_id)}.</p><p>${Object.entries(counts).map(([label, count]) => `${escape(label.replaceAll('_', ' '))}: <b>${count}</b>`).join(' · ')}</p><p class="muted">AI-simulated consumer perspectives, not real customer feedback. This saved report makes no network requests.</p><p class="muted">Completed ${escape(run.completed_at)} · Run ${escape(run.id)}</p></header><section class="grid">${cards}</section></main></html>`;
const destination = path.resolve('.cache', `presentation-review-${runId}.html`);
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, html, { flag: 'wx' });
console.log(destination);
