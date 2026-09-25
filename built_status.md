# DROPTEST current build status

Updated: 2026-09-26. This file is the current handoff. The requirements are in [update_prd_v2.md](update_prd_v2.md); issue-level evidence is in [issues.md](issues.md) and [verification_results.md](verification_results.md).

## Product state

Implemented product surfaces:

- Three account roles, session-token authentication, seeded demo accounts, and owner/role-scoped routes.
- Published product creation/editing, Explore, product detail, per-account saves, editable structured feedback, and support proposals/inbox.
- Private product-linked Synthetic Lab with single-product 50-profile evaluation and optional paired A/B 100-evaluation mode.
- Automatic comparable-product lookup, manual references, frozen source snapshots, retryable incomplete research/evaluation, result analysis and user-entered finance.
- Public feedback links, stored separately from synthetic evaluations.

Simulation output is model-assisted, not survey evidence or demand prediction. Without a working Groq API key, model evaluation is not replaced with a heuristic. Research provider errors do not silently switch providers; a no-research path is explicit. Search references are retrieved snippets unless source-page evidence is explicitly recorded.

## Verification snapshot

- `npm test`: **112 passed** (21 shared + 91 server), isolated with disposable `DATA_DIR` and `UPLOAD_DIR`, 2026-09-26.
- `npm run test:e2e`: **8 passed** across desktop Chromium and Pixel 5/393px, including routing, role flows, uploads, decimal money, private Lab, keyboard focus, mobile overflow and representative Axe WCAG checks.
- `npm run build`: passed for shared, server and client without warnings. Application, React vendor and icon chunks are each below 500 kB.
- Live search: DuckDuckGo completed with 8 processed references. Live Groq remains unverified because both SDK smoke and direct provider reachability failed locally with `ECONNRESET`.

## Remaining acceptance work

Only DT-10 live Groq acceptance remains: retry the smoke and then `npm run verify:live` when `api.groq.com` is reachable. All other DT-01 through DT-29 acceptance rows are verified.

## Local commands

```powershell
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
npm test
npm run build
npm run test:e2e
npm run test:acceptance
```

Use Node.js 22.5+ and npm 10+. Do not reuse a personal `DATA_DIR` for regression runs. Optional `GROQ_API_KEY`, `BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`, and `SERPER_API_KEY` behavior is described in [.env.example](.env.example) and [README.md](README.md). No JWT `SESSION_SECRET` is used; authentication uses stored server-side session tokens.
