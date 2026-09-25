# DROPTEST local walkthrough

This guide reflects the current implementation as of 2026-09-26. The active contract is [update_prd_v2.md](update_prd_v2.md); the original [DROPTEST_PRD.md](DROPTEST_PRD.md) is background for preserved simulation and finance requirements. Do not treat historical phase claims in [built_status.md](built_status.md) or [v2_inventory.md](v2_inventory.md) as current verification.

## Start the app

Requirements: Node.js 22.5+ and npm 10+.

```powershell
npm install
Copy-Item .env.example .env
# Put a Groq key in GROQ_API_KEY to enable real model evaluation.
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API is at `http://localhost:3001`; health is `GET /api/health`. The dev server also seeds demo data at startup. Seeding is idempotent and does not recreate user engagement. Use local demo accounts only; all use `Password123!`:

| Role | Email |
| --- | --- |
| Founder A | `founder.a@droptest.local` |
| Founder B | `founder.b@droptest.local` |
| Sponsor | `sponsor@droptest.local` |
| Shopper | `shopper@droptest.local` |

## Core product journey

1. Browse the real published product feed in Explore. Open a product at `/product/:id`.
2. A signed-in account can save/unsave and submit or edit one structured community response per product. The feed and detail page show shared counts and that account's own saved state.
3. Sponsors and founders can submit a proposed support amount and message to another founder's published product. A founder can review proposals for their own products. This records a proposal only; it does not transfer funds.
4. A founder opens the Synthetic Lab from an owned product. Product facts are prefetched; unknown private audience/cost facts require founder input. The default run uses one option and stores 50 profile evaluations. Optional A/B comparison evaluates the same 50 IDs on each option (100 evaluations).
5. The normal research flow searches for comparable products before evaluation. Retrieved snippets have source URLs and dates; they are not full-page verification. Select up to five references, or use the explicitly available no-research path. If research or model evaluation fails, the app reports that state rather than fabricating results.
6. Results show simulated responses and calculations based on entered values. Share `/feedback/:token` to collect real responses separately; those responses are a convenience sample, not a representative survey.

## Routes

`/` Explore; `/product/:id` detail; `/saved`; `/publish`; `/publish?edit=:id`; `/my-products`; `/lab?product=:id`; `/lab?test=:id`; `/results?test=:id`; `/feedback/:token` public feedback.

Refreshing or using Back/Forward should restore URL-backed view state. Owner-only lab/results APIs still require the owning account. Unknown frontend routes return to Explore.

## Providers and environment

Configuration is documented in [.env.example](.env.example). `DATA_DIR` defaults to `./data`, `UPLOAD_DIR` to `./uploads`, and `PORT` to `3001`. Groq is server-side. A missing/failed Groq provider does not trigger a heuristic simulation; a run remains unavailable, failed, or incomplete until a real valid evaluation exists.

Search selects one provider in priority order: Brave, Tavily, Serper, then DuckDuckGo HTML search. Search errors are visible and do not automatically cascade across providers. A founder can retry, add a clearly identified manual reference, or continue without research. Automated references are retrieved snippets, not claims that the source page was opened or verified.

## Checks

```powershell
npm test
npm run build
```

The last isolated suite run on 2026-09-26 passed 21 shared + 90 server tests (111 total); the production build passed. Tests should be run with disposable `DATA_DIR` and `UPLOAD_DIR` paths because the default configuration is persistent. Browser/keyboard acceptance is tracked separately in [issues.md](issues.md); an unavailable browser-control surface means those checks must remain unverified.
