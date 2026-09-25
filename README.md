# DROPTEST

DROPTEST is a product-launch community for early founders. Founders publish a product, other accounts can save it and give structured feedback, and sponsors or other founders can submit a non-binding support proposal. Product owners can use a private Synthetic Lab to research comparable products and evaluate a single product with 50 simulated profiles, or optionally compare A and B with 100 paired evaluations. Simulated results are hypotheses, not evidence of real demand; public-link responses are stored separately.

The active product contract is [update_prd_v2.md](update_prd_v2.md). The original [DROPTEST_PRD.md](DROPTEST_PRD.md) is background for retained simulation and finance behavior, not the current primary journey. `prompts_v2.md` and `bp_reference_v2.md` were not supplied.

## Run locally

Requirements: Node.js 22.5 or newer (for built-in `node:sqlite`) and npm 10 or newer.

```powershell
npm install
Copy-Item .env.example .env
# Add GROQ_API_KEY for real model evaluations. Search API keys are optional.
npm run seed
npm run dev
```

The Vite client runs at [http://localhost:5173](http://localhost:5173) and the API at [http://localhost:3001](http://localhost:3001). The development server seeds the four demo accounts and two products idempotently. It does not seed fake saves, feedback, or support proposals.

```powershell
npm test
npm run build
npm run test:e2e
# Or run all three with fresh isolated server data:
npm run test:acceptance
```

The current workspace test suite contains 21 shared and 91 server tests (112 total). The Playwright suite adds 8 real browser journeys across desktop Chromium and a 393px mobile profile. Use disposable `DATA_DIR` and `UPLOAD_DIR` values when running server tests or reproducing behavior; Playwright automatically uses `.cache/playwright-acceptance/`.

## Configuration

See [.env.example](.env.example). `PORT`, `DATA_DIR`, and `UPLOAD_DIR` have defaults. `GROQ_API_KEY` is required for actual LLM evaluations; if absent or the provider fails, the app reports an unavailable/failed run and does not substitute heuristic responses. `GROQ_MODEL`, `GROQ_TEMPERATURE`, and `GROQ_MAX_RETRIES` configure the server-side Groq integration.

Comparable-product search chooses the first configured provider in this order: Brave (`BRAVE_SEARCH_API_KEY`), Tavily (`TAVILY_API_KEY`), Serper (`SERPER_API_KEY`), then unauthenticated DuckDuckGo HTML search. It does not automatically cascade to another provider after a selected provider errors. Search failures remain explicit and the founder can retry, add a manual reference, or continue without research. Automated results are retrieved snippets with source URLs and dates; the app does not claim to have read or verified the full source page.

## Demo accounts

All four seeded accounts use the demo-only password `Password123!`:

| Role | Email |
| --- | --- |
| Founder A | `founder.a@droptest.local` |
| Founder B | `founder.b@droptest.local` |
| Sponsor | `sponsor@droptest.local` |
| Community shopper | `shopper@droptest.local` |

Do not use these credentials outside a local demo.

## Routes

| View | Route |
| --- | --- |
| Public landing page | `/` |
| Explore | `/explore` |
| Product detail | `/product/:id` |
| Saved products | `/saved` |
| Publish or edit | `/publish` or `/publish?edit=:id` |
| My products | `/my-products` |
| Product-linked lab | `/lab?product=:id` (optional `review=new`) |
| Results | `/results?test=:id` |
| Public feedback | `/feedback/:token` |

The browser restores route state on refresh and Back/Forward. Private lab/results endpoints still enforce owner authorization. Unknown client paths return to Explore.

## Product boundaries

- Lab profiles are synthetic. Exactly 50 profiles are stored for a single-product review; comparison mode evaluates the same 50 profiles against A and B (100 records).
- Coverage is based on explicitly entered markets. It is not real travel distance, population reach, or a demand estimate.
- Finance is arithmetic over founder-entered price and costs. Scenario units are inputs, not model-generated sales forecasts.
- Real feedback is a convenience sample from link recipients and is never mixed into simulated counts.
- Support proposals record a proposed amount and message; no payment, equity, or escrow occurs.
- No social chat/feed, rewards, advertising, market forecasting, or verified-demand claim is part of this MVP.

See [walkthrough.md](walkthrough.md) for the current demo path and [issues.md](issues.md) for verification status and known unverified checks.
