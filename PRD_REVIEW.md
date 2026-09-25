# DROPTEST requirements and implementation review

Reviewed 25 September 2026. This is a review, not an implementation change.

## Contract and scope

The requested documents exist here as `DROPTEST_PRD.md`, `update_prd_v2.md`, and `walkthrough.md`, rather than `.prd` files. I also reviewed `README.md`, `built_status.md`, `v2_inventory.md`, the workspace scripts, database/migrations/seed, authentication, product and lab APIs, research/evaluation/analysis/finance code, React journeys and associated tests. `prompts_v2.md` and `bp_reference_v2.md`, referenced by v2, are absent from this checkout.

V2 explicitly supersedes the original primary journey. The actual target is a product community with three roles, publishing, saves, structured human feedback, support proposals, and an owner-only, research-informed Synthetic Lab. The original paired evaluation, eligibility, finance and retry guarantees remain applicable where v2 preserves them. Deferred payments, chat, rewards, QR/export and similar optional features are not counted as implementation failures.

**Verdict: substantial implementation exists, but the product does not fully satisfy the contract. The highest-priority gaps concern authorization, persistent demo data, unknown inputs, research integrity, and the normal single-product journey.**

## Verification

- `npm.cmd run build`: passed all three workspaces. Vite reports a large JavaScript chunk warning.
- `npm.cmd test`: passed **93 tests: 19 shared and 74 server**. The first sandboxed attempt failed during tsx initialization with Windows `uv_os_get_passwd`/`ENOMEM`; the approved rerun succeeded. Isolated review data/upload paths were supplied.
- Additional probes against an in-memory database reproduced findings 1–7, 10 and 12 below. Probe code is `.cache/prd-review-probes.mjs`; it uses mocked model/search responses for evaluation checks and never operates on the application's normal database. Build/test logs are in `.cache/prd-review-build.log` and `.cache/prd-review-tests.log`.
- No new live Groq/search-provider certification or browser walkthrough at 390 px/desktop was performed. Passing mocked integration tests is not proof of those acceptance checks. UI findings below are based on source inspection; layout consequences should be confirmed in a browser.
- Application source was not changed. Existing working-tree modifications were left in place.

## Findings

Priority: P1 = core correctness, privacy, persistence or demo blocker; P2 = incomplete contract or important usability issue. “Reproduced” means an additional review probe confirmed the behavior, not merely a test name implying coverage.

### 1. P1 — Anonymous callers can overwrite and detach another founder's lab draft (reproduced)

`server/src/routes/testRoutes.ts:242` checks ownership of the **submitted** product ID, not the existing test identified by `test.id`. Omitting both product IDs bypasses this check. `server/src/db/testRepository.ts:34` then updates that existing test and sets its product relation to null. An anonymous POST returned 200 and removed the relation in the probe. This permits corruption of an unrun private draft and removes subsequent product-based access checks. Supplying the attacker's own product ID also allows relinking. Frozen tests are protected from this update by the run check, but unrun drafts are not.

**Required:** authorize the existing stored test before any update, preserve its ownership relation, and prohibit arbitrary claiming/relinking of legacy records. V2 §§2, 7.

### 2. P1 — Research references can be modified, read or deleted through another product's URL (reproduced)

`server/src/routes/productRoutes.ts:449` and `:469` authorize `:id`, then act on `:refId` without checking that the reference belongs to that product. Repository mutations use only the reference ID (`server/src/db/referenceRepository.ts:152`). A founder using their own product route successfully changed another founder's reference and received its private contents in the response.

**Required:** bind reference reads/writes to both reference ID and owned product ID. V2 §§2, 6, 7.

### 3. P1 — Anyone can delete a published product image (reproduced)

`server/src/routes/uploadRoutes.ts:75` has no authentication/ownership check. Its usage check searches old lab `options` only, not `products.images`. The probe uploaded a file, attached it to a product, then deleted it anonymously with HTTP 200. Public image URLs expose the necessary filename.

**Required:** owner-bound upload metadata and deletion authorization; protect product and frozen-run references. V2 §7.

### 4. P1 — Global lab listing exposes private test metadata and sharing tokens (reproduced)

`server/src/routes/testRoutes.ts:18` returns `TestRepository.listAll()` without authentication or filtering. `server/src/db/testRepository.ts` serializes all test titles, IDs and feedback tokens. `/:id/feedback-stats` also lacks ownership checks. These records appear in the standalone saved-draft picker. This violates private labs and isolation of historical anonymous records. For a completed comparison, an exposed token also reveals private trial messaging/prices through the old public feedback page without a deliberate sharing step.

**Required:** owner-scoped listings and private stats, with isolated legacy access; do not serialize share tokens globally. V2 §§2, 7.

### 5. P1 — Engagement endpoints accept private drafts (reproduced for feedback)

`server/src/db/productRepository.ts:334`, `:406`, and `:562` check that a product exists, but not that it is published. A non-owner account knowing a draft ID can save it, answer it, or submit support. The probe submitted shopper feedback on a private draft and received 200. Support also returns the draft product name.

**Required:** reject non-public products at every community write endpoint, not only GET detail. V2 §§2–5.

### 6. P1 — Startup seeding overwrites actual demo interactions (reproduced)

`server/src/app.ts:22` invokes `runSeed()` on every application startup. `server/src/db/seed.ts:167` unconditionally saves the product and upserts the shopper's feedback, sponsor's proposal and second founder's feedback. A real unsave and changed answer reverted to the seeded save and Yes response after rerunning the seed. Proposal changes are similarly overwritten. `[SEEDED DEMO]` is only in reasons/messages; public aggregate counts and saves have no separate seed indication.

**Required:** seed missing fixture records once without replacing user edits; distinguish seed engagement in public/demo counts or start with zero engagement. V2 §§1, 7, 9.

### 7. P1 — Publishing accepts missing required category details (reproduced)

`shared/src/validation.ts:381` accepts arbitrary `category_data`. Publishing checks text lengths and image/description presence, but never checks apparel material/fit/sizes, food portion/ingredients, digital function/platform/language, or other specifications. An empty category object passes publishing. Empty market arrays are also accepted, bypassing the required explicit “not decided” state.

**Required:** category-specific publish contracts with explicit undecided values; validate availability consistency. V2 §3.

### 8. P1 — “Concept-only review” actually evaluates a zero-price product

`server/src/routes/productRoutes.ts:252` replaces null price with 0. `client/src/pages/SetupTestPage.tsx:299` does the same when the trial input is cleared. `PreflightLabCard.tsx:321` calls this concept-only, but `OptionInputSchema`, the snapshot and `groqEvaluator.ts` have no unknown-price flag; the prompt still evaluates actual price against budget. Finance remains enabled when costs are supplied. Unknown and genuinely free offerings are indistinguishable.

**Required:** persist unknown price separately, explicitly instruct concept-fit evaluation, and suppress price/finance conclusions until a trial price is supplied. V2 §6.

### 9. P1 — Lab defaults invent coverage and derive budgets from candidate price

`server/src/routes/productRoutes.ts:248` turns undecided markets into `All Online`, undecided fulfillment into `Standard Delivery`, and spend bounds into 70%–150% of price. These defaults enter the editable payload as if valid facts, with no confirmation gate. This makes unconfirmed markets eligible and creates circular price evaluation. The separate `/lab/preflight` response repeats these suggestions; the client does not use that endpoint to enforce missing-input review.

**Required:** keep unknown markets/fulfillment explicit and require independently entered budget bounds before running. V2 §6 and original PRD §6.

### 10. P1 — Failed research silently continues; the fallback choice is disconnected (reproduced)

`server/src/routes/runRoutes.ts:65` records a failed search and proceeds to create/execute the run. The probe forced search failure and got 202 with `research_status: failed`, without requesting a fallback. `PreflightLabCard` only renders Retry/Continue controls when `onSkipResearchChange` is provided, but `SetupTestPage.tsx:549` never passes it. `requestRun()` also sends no `skip_research` body.

**Required:** stop on research failure, present Retry/Continue without research, and send the explicit choice. Display research and evaluation phases separately. V2 §6.

### 11. P1 — Manual or stale references incorrectly count as completed automatic research

`server/src/routes/runRoutes.ts:62` treats any selected references as completed research and skips the search. It does not distinguish founder notes, source freshness or the product snapshot. Search attempts with zero results/failure have no durable research record, so they cannot be reused reliably; selecting zero references triggers another search even after deliberate deselection. `ReferenceRepository.saveReferences()` also skips existing URLs/domains rather than refreshing their facts/date.

**Required:** persist research attempts/status and product snapshot identity independently of references; reuse only the matching completed attempt and preserve selection. Founder notes must not fulfill automatic search. V2 §6.

### 12. P1 — Citation aliases resolve to the wrong reference (reproduced)

In `server/src/simulation/groqEvaluator.ts:353`, the `find()` predicate accepts any string starting with `ref-` for every reference. `REF-2` therefore matches the first reference, as the probe confirmed. `REF-999` would also be accepted as the first reference. Unknown IDs are otherwise silently dropped while the potentially unsupported reason remains stored.

**Required:** exact run-scoped ID/alias mapping and rejection/retry of invalid sourced claims. V2 §6.

### 13. P1 — Retrying an empty-source snapshot can change its evidence

`server/src/simulation/groqEvaluator.ts:194` reads frozen references, but when that array is empty it falls back to current product references. Add references after a skipped/failed/no-match partial run and retry: remaining profiles can see new evidence while earlier responses and the snapshot retain no sources.

**Required:** distinguish a missing legacy snapshot from a valid empty source set; retries must exclusively use the snapshot. V2 §6.

### 14. P1 — Edited products do not reliably become the input to a new review

`server/src/routes/productRoutes.ts:232` returns the existing test whenever one exists. The client loads it, and “Create an editable copy” (`SetupTestPage.tsx:542`) only clears the test ID/lock; it retains old product text, price and images. Meanwhile automatic search uses the current product. A new run can therefore evaluate the old proposal against research for the edited one. The snapshot records the derived test and product ID, but not the complete originating public product/version.

**Required:** preserve old runs while offering a new review explicitly prefilled from the current product, with matching research and product snapshot. V2 §6.

### 15. P1 — Digital and “other” products do not map cleanly into the lab

`PublishProductPage.tsx:203` saves digital data without `pricing_type`, which `shared/src/validation.ts:85` requires for lab drafts. The probe confirms that the normal digital publishing shape fails lab validation. The lab UI shows a default `one_time` selection without storing it until changed, so the missing field is easy to miss. `productRoutes.ts:244` maps every “other” product to clothing while passing only its specification data, forcing unrelated apparel requirements. The seeded brew equipment product is likewise labeled food but lacks required food-lab fields.

**Required:** explicit product-to-lab adapters and supported handling of unknown category fields, without inventing unrelated facts. V2 §§3, 6, 9.

### 16. P1 — Single-product finance still renders a fictional Option B

`client/src/pages/ResultsPage.tsx:315` supplies a blank B name, zero B price and A's finance result as B in single mode. `FinancialScenarioPanel.tsx:219` always renders B economics and the B/variance scenario columns. With A costs present, this produces a nonexistent alternative with contradictory/missing arithmetic. This directly violates the requirement to render only the available option.

**Required:** make B optional throughout the finance component and render one-option scenarios. V2 §6.

### 17. P2 — Lab “real feedback” reads the old anonymous collection, not community responses

`ResultsPage.tsx` always renders `RealFeedbackSection` using test ID. That component reads legacy `human_responses`, not product `product_feedback`. `TestRepository.getByFeedbackToken()` requires 100 evaluations, so a completed default 50-evaluation review displays “Complete the comparison to create a feedback link,” even when the product already has real community feedback.

**Required:** show product-linked community counts in product labs; retain the anonymous A/B section only for applicable comparison workflows. V2 §§4, 6, 8.

### 18. P1 — Quick demo login buttons use nonexistent accounts and the wrong password

`client/src/components/Auth/AuthModal.tsx:363` uses the old `founder@ecothreads.in`/other addresses. `AuthContext.tsx:114` supplies `password123`, while current seed credentials are `*.droptest.local` and `Password123!`. It ignores the returned failure object, so the modal closes without logging in or displaying an error. `/api/auth/demo-accounts` also returns old identities.

**Required:** share one demo credential definition and propagate login failure. V2 §§7–9.

### 19. P2 — Edit refresh and browser history lose the intended screen

`client/src/App.tsx:98` writes `/publish?edit=ID`, but its URL parser only recognizes `/publish` and never restores `editingProductId`. Refresh opens a new-product form instead of editing. The popstate handler also has no branch restoring `/`/Explore, and results navigation changes state without a results URL. My Products' publish action changes the visible page without updating the URL.

**Required:** derive the complete page/edit/results state from URL navigation. V2 §9 acceptance 6.

### 20. P2 — Public serialization does not enforce the private-cost boundary inside category data

`shared/src/validation.ts:381` accepts arbitrary `category_data`, `ProductRepository` persists it, and `getPublicDetail()` spreads the complete product. Sending `category_data.unit_production_cost`, scenarios or nested private lab data exposes it unchanged in public detail. Normal UI payloads omit these fields, but the API boundary does not enforce the stated guarantee.

**Required:** allowlist public category fields in validation and serialization; store private economics exclusively in lab data. V2 §§2, 3, 7.

### 21. P2 — Incomplete drafts cannot always be saved

`ProductDraftPayloadSchema` requires name, category, stage and a five-character summary. The lab uses the full run-valid schema even for Save Lab Draft. Someone entering only a name or part of their concept cannot persist it despite the draft-saving journey.

**Required:** distinguish incomplete draft validation from publish/run validation. V2 §3 and original setup requirements.

### 22. P2 — New/edit forms silently insert example facts and corrupt digital language on resave

`PublishProductPage.tsx:37` initializes real input values with Bangalore neighborhoods, linen material, food ingredients, price 699 and TypeScript/React language. Missing fields on edit retain these defaults. Sizes can become an empty array rather than explicit undecided. For digital edits, `platform_language` is loaded into the platform field while the separate language retains its default; saving appends ` / TypeScript / React`, and repeated edits can append it again. Image upload also marks the product name as a confirmed visual description automatically.

**Required:** use placeholders or explicit demo presets, empty/undecided actual values, faithful field round trips, and a genuine image-description confirmation. V2 §§3, 6.

### 23. P2 — Research is a snippet list, without the required comparison or reliable relevance handling

`SearchService.buildSearchQuery()` omits supplied price, normally ignores purpose/summary, and adds unsupported category terms such as “sustainable” and “artisan.” Filtering removes duplicate domains and search-engine links only; it does not distinguish relevant product pages from unrelated results. Domain deduplication drops distinct product pages from one store, while manual additions do not deduplicate URLs. `formatReferenceSummary()` lists snippets rather than comparing overlapping needs, verified differences and missing founder facts; the snapshot's `reference_summary` is never populated. Persona UI shows a generic “Compares with market reference” badge without resolving the actual source IDs into inspectable links.

**Required:** construct queries from entered facts, preserve useful distinct URLs, provide the requested selected-source comparison, and resolve citations in results. V2 §6.

### 24. P2 — Missing evaluations are presented as “Unavailable”

`shared/src/analysis.ts:250` and `:658` substitute `unavailable`/`unserved` for absent responses; summary `unserved_count` is derived from completed served responses. The decision card correctly labels a partial run incomplete, and the full breakdown is hidden, but the inspectable response table still conflates failed/pending evaluations with deterministic coverage exclusion.

**Required:** an explicit missing/pending record state and eligibility computed independently of model completion. Original §§6–7; v2 §6.

### 25. P2 — Support amounts use floating-point storage instead of exact money

`server/src/db/migrations.ts:212` defines `amount REAL`; the schema accepts any positive finite number without minor-unit precision. This misses v2's explicit exact-money contract, even though normal ₹500 examples work.

**Required:** integer minor units or an exact decimal representation, with currency precision validation. V2 §7 minimum contracts.

### 26. P2 — Startup description is optional at account creation (reproduced)

`shared/src/validation.ts:331` makes `startup_description` optional and startup-specific validation only requires name. A signup without a description passes, although v2 requires both.

**Required:** validate a meaningful startup description for startup signup. V2 §2.

### 27. P2 — Keyboard/accessibility and responsive implementation remain incomplete

Explore product cards (`ExplorePage.tsx:258`) open via clickable divs without a keyboard-equivalent link/button. Publish inputs have sibling labels without matching `htmlFor`/IDs. Auth modal lacks dialog semantics, focus management and Escape handling. `Navbar.tsx` inline height/alignment/padding override competing mobile CSS declarations. Product detail uses inline two-column grids; the feed's 320px minimum cards plus nested page padding can exceed a 390px viewport. These are concrete source-level gaps; exact visual impact still needs browser verification.

**Required:** semantic controls, associated labels/dialog behavior, responsive layout rules and the required keyboard/390px/desktop walkthrough. V2 §§8–9.

### 28. P2 — Walkthrough and handoff documents overstate or misdescribe the implementation

`walkthrough.md` claims a deterministic fallback when Groq is absent; code correctly returns 503 instead. It claims provider cascading, but `SearchService` chooses one provider with `if/else` and returns failure if that provider fails. It documents JWT/`SESSION_SECRET`, but auth uses random server-stored session tokens and no such configuration. Documented `/products/:id`, `/products/:id/lab`, and `/proposals/inbox` routes differ from actual `/product/:id`, `/lab?product=ID`, and the My Products tab. “Concept-only,” structured brand/pricing/limitation extraction and fully verifiable citations are also overstated. README/build status describe the old journey and obsolete test counts/QR implementation. The current test total is 93, not 74 overall.

**Required:** update documentation to observed behavior and mark remaining acceptance checks unverified. Do not implement fabricated evaluation fallback to match the erroneous documentation. V2 §9.

### 29. P2 — Explore does not show the current account's saved state

`ProductRepository.listPublished()` returns save counts but no viewer-specific `is_saved`; `ExplorePage.tsx:62` sends a toggle request and only updates the count. The bookmark never becomes a clear Saved state, including after refresh, so users cannot know whether clicking it will add or remove their save. Product detail and Saved have more complete behavior.

**Required:** viewer-specific saved state and explicit desired-state requests in the feed, with visible failure feedback. V2 §4.

## Coverage summary

| Contract area | Assessment |
| --- | --- |
| Three roles, password hashing, server sessions | Implemented; description validation and quick demo entry incomplete |
| Product creation/editing/public feed/detail | Implemented; publish schema, input defaults, refresh and public field boundary incomplete |
| Unique saves and editable Yes/Maybe/No feedback | Persisted and tested; draft permissions, seed behavior and feed state incomplete |
| Support proposals and founder inbox | Implemented with role/self-proposal checks; draft gating, exact money and seed persistence incomplete |
| Stable 20/20/10 panel and paired 50/100 evaluations | Implemented and tested; product adapters and unknown-input semantics incomplete |
| Eligibility and deterministic finance | Core arithmetic/gating implemented; invented defaults and single-mode finance UI violate contract |
| Batching, partial results, retry | Implemented and tested; empty-source snapshot fallback and missing-record display need correction |
| Automatic research | Real provider HTTP code exists; failure choice, attempt persistence, relevance/comparison and evidence correctness incomplete |
| Frozen run evidence | Test/profiles/sources snapshotted; product freshness and empty-source retries incomplete |
| Community vs synthetic separation | Separate tables and main product UI exist; lab results still use old anonymous feedback collection |
| Private owner-only labs | Direct GET/run checks exist, but alternate write/list/reference paths bypass isolation |
| Complete demo/mobile/keyboard proof | Build/tests pass; demo login broken and full browser/live-provider proof remains unverified |

## Suggested repair order

1. Close unauthorized draft/reference/upload mutations and owner-scope lab listing/stats.
2. Stop seeding from overwriting real interactions; fix demo login and edit URL restoration.
3. Preserve unknown inputs, require independent budgets/coverage, and fix product-to-lab adapters.
4. Repair research failure choice, research state/snapshot matching, citation validation and frozen retries.
5. Finish single-product finance/community feedback, publish contracts and honest input forms.
6. Add regression coverage for the reproduced failures, verify actual providers, walk the complete demo at mobile/desktop widths, then align documentation with that evidence.
