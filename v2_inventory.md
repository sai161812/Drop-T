# DROPTEST v2 codebase inventory

Updated: 2026-09-26. This inventory describes the current repository. Requirements are defined by [update_prd_v2.md](update_prd_v2.md); the original [DROPTEST_PRD.md](DROPTEST_PRD.md) is background for the simulation and finance behavior explicitly retained by v2.

## Runtime

- npm workspaces: `shared`, `server`, and `client`.
- Client: React, TypeScript, Vite, CSS tokens, lucide-react.
- Server: Express, TypeScript, Node's built-in `node:sqlite`, file-backed uploads.
- Shared layer: Zod schemas/types, demo-account definitions, eligibility, analysis, and finance calculations.
- External services: server-side Groq for model evaluation; server-side Brave, Tavily, Serper, or DuckDuckGo search selected by configuration.

## Main implementation locations

| Concern | Current location |
| --- | --- |
| API setup/auth middleware | `server/src/app.ts`, `server/src/middleware/authMiddleware.ts` |
| Authentication and demo seed | `server/src/routes/authRoutes.ts`, `server/src/db/authRepository.ts`, `server/src/db/seed.ts`, `shared/src/demoAccounts.ts` |
| Products, saves, feedback, proposals | `server/src/routes/productRoutes.ts`, `server/src/db/productRepository.ts` |
| Product-linked lab, runs, retries | `server/src/routes/testRoutes.ts`, `server/src/routes/runRoutes.ts`, `server/src/db/testRepository.ts` |
| Research and source references | `server/src/search/searchService.ts`, `server/src/research/`, `server/src/db/researchRepository.ts` |
| Model evaluation and profiles | `server/src/simulation/groqEvaluator.ts`, `server/src/simulation/profileGenerator.ts` |
| Uploads and migrations | `server/src/routes/uploadRoutes.ts`, `server/src/db/migrations.ts` |
| Shared contracts and arithmetic | `shared/src/validation.ts`, `shared/src/types.ts`, `shared/src/analysis.ts`, `shared/src/finance.ts` |
| App navigation/auth | `client/src/App.tsx`, `client/src/context/AuthContext.tsx`, `client/src/components/Navbar.tsx` |
| Product community UI | `client/src/pages/ExplorePage.tsx`, `ProductDetailPage.tsx`, `PublishProductPage.tsx`, `SavedPage.tsx`, `MyProductsPage.tsx` |
| Lab/results/feedback UI | `client/src/pages/SetupTestPage.tsx`, `ResultsPage.tsx`, `PublicFeedbackPage.tsx`, `client/src/components/Results/` |

## Route conventions

Client routes: `/`, `/product/:id`, `/saved`, `/publish[?edit=:id]`, `/my-products`, `/lab[?product=:id&review=new]`, `/results?test=:id`, and `/feedback/:token`.

API routes are mounted under `/api/auth`, `/api/products`, `/api/tests`, `/api/simulation`, `/api/upload`, and `/api/feedback`; inspect the route modules for current methods and authorization. Old inventory entries such as `/products/:id`, `/proposals/inbox`, `/api/products/saved`, `SEARCH_API_KEY`, or `SESSION_SECRET` are not current contracts.

## Environment and provider behavior

See [.env.example](.env.example). Demo credentials are development-only and defined once in `shared/src/demoAccounts.ts`. `GROQ_API_KEY` enables real model evaluation; absent credentials do not invoke a fake/heuristic evaluator. Search priority is Brave, then Tavily, then Serper, then DuckDuckGo. The selected provider does not automatically cascade after a request error. References distinguish automated retrieved snippets from founder-supplied notes.

## Verification baseline

As of 2026-09-26, isolated `npm test` passed 21 shared and 91 server tests (112 total), `npm run test:e2e` passed 8 desktop/mobile Chromium journeys, and `npm run build` passed without warnings. Live DuckDuckGo research passed; live Groq remains unverified because local provider connections reset before a response. See [verification_results.md](verification_results.md) and [issues.md](issues.md). `prompts_v2.md` and `bp_reference_v2.md` were not present in the supplied repository.
