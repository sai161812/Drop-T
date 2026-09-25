# DROPTEST current build status

Updated: 2026-09-26. This file is the current handoff, not a record that every acceptance item has been browser-verified. The requirements are in [update_prd_v2.md](update_prd_v2.md); issue-level evidence is in [issues.md](issues.md) and [verification_results.md](verification_results.md).

## Product state

Implemented product surfaces:

- Three account roles, session-token authentication, seeded demo accounts, and owner/role-scoped routes.
- Published product creation/editing, Explore, product detail, per-account saves, editable structured feedback, and support proposals/inbox.
- Private product-linked Synthetic Lab with single-product 50-profile evaluation and optional paired A/B 100-evaluation mode.
- Automatic comparable-product lookup, manual references, frozen source snapshots, retryable incomplete research/evaluation, result analysis and user-entered finance.
- Public feedback links, stored separately from synthetic evaluations.

Simulation output is model-assisted, not survey evidence or demand prediction. Without a working Groq API key, model evaluation is not replaced with a heuristic. Research provider errors do not silently switch providers; a no-research path is explicit. Search references are retrieved snippets unless source-page evidence is explicitly recorded.

## Verification snapshot

- `npm test`: **111 passed** (21 shared + 90 server), isolated with disposable `DATA_DIR` and `UPLOAD_DIR`, 2026-09-26.
- `npm run build`: passed for shared, server and client on 2026-09-26. Vite reports a >500 kB minified JavaScript chunk; build succeeds.
- Browser checks: not completed. The available computer-use surface returned no browser instances and could not open IAB or Chrome. Do not describe URL refresh/history, keyboard trapping, or mobile layout as visually verified.
- Live Groq run: not performed as part of this audit. Provider configuration and failure/recovery paths are covered by deterministic tests; that is not proof of current live credentials or provider availability.

## Remaining acceptance work

DT-19 and DT-27 need browser/keyboard verification at desktop and about 390 px. DT-29 server behavior is covered by tests, while actual Explore save interaction still needs browser verification. See the issue ledger for other items whose implementation is tested but whose complete acceptance remains unverified.

## Local commands

```powershell
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
npm test
npm run build
```

Use Node.js 22.5+ and npm 10+. Do not reuse a personal `DATA_DIR` for regression runs. Optional `GROQ_API_KEY`, `BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`, and `SERPER_API_KEY` behavior is described in [.env.example](.env.example) and [README.md](README.md). No JWT `SESSION_SECRET` is used; authentication uses stored server-side session tokens.
