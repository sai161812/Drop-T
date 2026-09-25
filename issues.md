# DROPTEST — actionable issues and verification handoff

Created: 2026-09-25. Source review: [PRD_REVIEW.md](PRD_REVIEW.md).

This file tracks **29 open findings** from the review. It is a repair specification, not evidence that fixes have been implemented. Issue IDs correspond to the numbered findings in PRD_REVIEW.md. File names are starting points; locate the current functions because line numbers will change.

## Product contract

Read `update_prd_v2.md` first. It explicitly supersedes the original primary journey in `DROPTEST_PRD.md`; retain the original simulation/finance guarantees that v2 preserves. Read `walkthrough.md`, `README.md`, `built_status.md`, and `v2_inventory.md` as implementation claims to verify, not authorities overriding the PRD. The requested `.prd` documents are `.md` files in this repository. `prompts_v2.md` and `bp_reference_v2.md` were absent during review; do not invent their contents.

The target is a product community: three account roles, product publishing, saves, editable community feedback, recorded support proposals, and a private product-linked Synthetic Lab with actual automatic research and 50 stored profile evaluations. Optional A/B mode has 100 paired evaluations. No payments, chat, rewards, demand forecasting, or fabricated model responses.

## How agents should use this file

1. Read repository instructions and inspect `git status` before editing. Preserve existing work and data. Reproduce the assigned issue against the current code; do not assume historical line references remain correct.
2. Claim specific IDs in the ledger below. Record an agent/branch identifier and the files you expect to change. Different agents working on shared schema/routes/components must coordinate or use isolated branches; avoid concurrent edits to the same files.
3. Follow dependencies below. Agree on shared contracts before consumers are changed. A UI-only workaround does not close a server validation or authorization defect.
4. Make the smallest complete fix across schema, persistence, API, UI, migration and documentation as applicable. Use additive, data-preserving migrations. Do not reset the application database to make tests pass.
5. Add meaningful regression coverage for authorization, persistence, research state and calculation defects. For presentation-only fixes, browser/keyboard verification is appropriate; avoid tests that merely restate implementation.
6. Use isolated databases/uploads for verification. Never use another person's private records for reproductions. Mock external services for deterministic failure tests, then identify live-provider checks separately. Never log credentials or full session tokens.
7. Move a completed repair to `IMPLEMENTED` with files, commands/results and limitations. Use `VERIFIED` only after its acceptance checks have actually passed. A different agent should perform the final independent review where practical.
8. Do not close an issue because existing tests are green. Do not weaken assertions, delete tests, hide a broken control, or rewrite requirements to fit current behavior. If evidence disproves a finding, record the reproduction and mark `NOT_REPRODUCIBLE` with a reason.

Statuses: `OPEN`, `IN_PROGRESS`, `IMPLEMENTED`, `VERIFIED`, `BLOCKED`, `NOT_REPRODUCIBLE`. A blocked item must say exactly what is missing and what was still completed.

### Coordination and recommended order

| Work package | IDs | Main overlap/dependencies |
| --- | --- | --- |
| A: Authorization and privacy | 01–05, 20 | Coordinate product/schema changes with C; upload client changes with F |
| B: Persistent demo and accounts | 06, 18, 25, 26 | Shared auth/seed/migration files; exact-money contract must precede UI formatting |
| C: Product and lab input contracts | 07–09, 14–15, 21–22 | Agree on unknown values, category data and snapshots before D/E integration |
| D: Research and evidence | 10–13, 23 | Depends on stable product snapshot/input contract from C |
| E: Results correctness | 16–17, 24 | Depends on C price/mode contracts and D citation/snapshot contracts |
| F: Navigation and usability | 19, 27, 29 | Coordinate App, auth and product components with B/C/E |
| G: Documentation and final audit | 28 + verify all | Finalize after integrated behavior is verified |

These packages are assignment suggestions, not permission for concurrent edits to shared files. Agents must coordinate `shared/src/{types,validation,analysis}.ts`, `server/src/routes/{productRoutes,testRoutes,runRoutes}.ts`, migrations and `SetupTestPage.tsx` in particular.

## Status ledger

Update the relevant row and add a dated entry to the execution log. Do not erase previous verification failures.

| ID | Priority | Status | Owner/branch | Evidence or blocker |
| --- | --- | --- | --- | --- |
| DT-01 | P1 | VERIFIED | Codex / working tree | Omitted/conflicting product IDs, other-owner relink, legacy claim, and valid owner update tested; stored state preserved |
| DT-02 | P1 | VERIFIED | Codex / working tree | Cross-product reference patch/delete returns 404; reference row unchanged |
| DT-03 | P1 | VERIFIED | Codex / working tree | Anonymous/unrelated delete rejected; owner deletes unused fixture; product-referenced image blocked |
| DT-04 | P1 | VERIFIED | Codex / working tree | Anonymous list/stats denied, owner listing scoped and token-free, other owner denied |
| DT-05 | P1 | VERIFIED | Codex / working tree | Draft save/feedback/support rejected and row counts unchanged |
| DT-06 | P1 | IMPLEMENTED | Codex / working tree | Engagement is no longer seeded; reseed persistence regression passes |
| DT-07 | P1 | IMPLEMENTED | Codex / working tree | Category-aware publish facts, explicit undecided values, availability rules and image/description checks added |
| DT-08 | P1 | IMPLEMENTED | Codex / working tree | Unknown public price remains null; lab trial price is private and concept-only suppresses price finance |
| DT-09 | P1 | IMPLEMENTED | Codex / working tree | Lab prefills no inferred coverage, fulfillment, audience markets, adjacent group or price-derived budgets |
| DT-10 | P1 | VERIFIED | Codex / working tree | Forced failure persists and returns Retry/Continue before zero evaluator calls; boolean skip and restore state tested |
| DT-11 | P1 | VERIFIED | Codex / working tree | Fingerprinted attempts persist independently with linked sources and reusable no-match/completed states |
| DT-12 | P1 | VERIFIED | Codex / working tree | Exact aliases/full IDs only; invalid citation records retry and result citations link to frozen sources |
| DT-13 | P1 | VERIFIED | Codex / working tree | Empty source snapshots remain immutable; invalid legacy snapshots require a new review |
| DT-14 | P1 | IMPLEMENTED | Codex / working tree | Resume and new-current-product flows separated; server persists input snapshot and research uses it |
| DT-15 | P1 | IMPLEMENTED | Codex / working tree | Digital and generic category adapters added; seed brew equipment reclassified |
| DT-16 | P1 | IMPLEMENTED | Codex / working tree | Finance panel receives an optional B; single mode renders A economics and scenario results only |
| DT-17 | P2 | IMPLEMENTED | Codex / working tree | Product-linked results load owner-authorized product feedback and keep legacy anonymous feedback separate |
| DT-18 | P1 | IMPLEMENTED | Codex / working tree | Seed, auth metadata and quick login share the same demo identities/password |
| DT-19 | P2 | IMPLEMENTED | Codex / working tree | URL state now restores product/edit/lab/results routes, root Explore and unknown-route fallback; browser history remains unverified |
| DT-20 | P2 | VERIFIED | Codex / working tree | Injected private fields rejected; legacy public serialization strips private fields |
| DT-21 | P2 | IMPLEMENTED | Codex / working tree | Bounded partial lab drafts save; full run validation still rejects incomplete inputs |
| DT-22 | P2 | IMPLEMENTED | Codex / working tree | Blank publish form defaults, edit state reset, lossless legacy digital fields and no auto-confirmed image text |
| DT-23 | P2 | VERIFIED | Codex / working tree | Grounded query, URL-level dedupe, evidence comparison snapshot and clickable citations tested |
| DT-24 | P2 | IMPLEMENTED | Codex / working tree | Coverage eligibility is derived from frozen served markets; missing responses have a separate state and are excluded from paired transitions |
| DT-25 | P2 | IMPLEMENTED | Codex / working tree | Minor-unit persistence, supported currency precision, and legacy rounding migration regression pass |
| DT-26 | P2 | IMPLEMENTED | Codex / working tree | Server and form require nonblank startup description |
| DT-27 | P2 | IMPLEMENTED | Codex / working tree | Explore cards use real links, forms/dialogs gain labels and keyboard semantics, focus styles and mobile-safe grid; browser/layout acceptance remains unverified |
| DT-28 | P2 | IMPLEMENTED | Codex / working tree | README, walkthrough, build status, inventory, and env example now match actual routes/providers/test counts; live/browser limits are called out |
| DT-29 | P2 | IMPLEMENTED | Codex / working tree | API regression covers idempotent desired-state writes, per-viewer/anonymous feed state and no-store cache; Explore browser interaction remains unverified |

## Issues, fixes and acceptance checks

### DT-01 — Prevent overwriting or detaching someone else's lab draft

**Where:** `server/src/routes/testRoutes.ts` POST `/api/tests`; `server/src/db/testRepository.ts` `saveDraft`.

**Error:** Authorization checks the product ID supplied in the request. An anonymous caller can supply an existing test ID and omit product IDs, replacing its inputs and setting `product_id` to null. Supplying the attacker's own product ID can reassign it.

**Fix:** For updates, load the existing test first and authorize its stored owner/product relation. Reject any relation change through normal draft updates. Reject conflicting top-level/nested product IDs. For creation, authorize the linked product. Preserve legacy anonymous tests as unclaimed; any migration/claim mechanism must be explicitly controlled and not a public update side effect. Reuse one access helper across test/panel/run operations.

**Acceptance:** Anonymous, shopper and founder B cannot update founder A's test with omitted, null, conflicting or B-owned product IDs. Verify the stored title, private costs, product relation and profiles are unchanged after each attempt. A's valid update succeeds; frozen-run edits remain rejected. A new account cannot claim a legacy test.

### DT-02 — Scope research reference mutations to their product

**Where:** `productRoutes.ts` reference PATCH/DELETE; `referenceRepository.ts` get/toggle/delete methods.

**Error:** Ownership is checked for the URL product, while reference mutation uses only `refId`.

**Fix:** Require `product_id` in reference repository reads/mutations and constrain SQL with both IDs. Verify the reference belongs to the authorized product before selection-limit checks. Return no reference contents on mismatch. Keep selection limits enforced server-side.

**Acceptance:** Founder A's product route with B's reference ID cannot read, toggle or delete that reference, and its row remains unchanged. Correct-owner operations work. Test both selection states and deletion.

### DT-03 — Authenticate image deletion and protect all references

**Where:** `uploadRoutes.ts`, migrations/upload persistence, upload callers in publish/setup, product/test snapshots.

**Error:** DELETE `/api/upload/:filename` is anonymous and only checks lab option usage; a public product image can be deleted by anyone.

**Fix:** Store local upload ID, owner and server filename at upload time. Authenticate mutations and update clients to send the session. Authorize against stored ownership, not request metadata. Refuse physical deletion while referenced by any product, lab draft or frozen run. Keep path containment checks. Existing unowned uploads must remain protected until an explicit trusted migration can establish ownership; do not assign them to whoever requests deletion. Do not attempt to delete remote image URLs.

**Acceptance:** Anonymous/unrelated deletion fails without removing the file. Owner can delete an unused upload. Owner cannot delete an image still used by a product or historical run. Validate type/size caps still work. Exercise only disposable fixtures.

### DT-04 — Keep private labs and tokens out of global listings

**Where:** `testRoutes.ts` list and feedback-stats; `testRepository.ts` `listAll`; setup saved-draft picker; legacy feedback routes.

**Error:** Unauthenticated test listing exposes every title/ID/share token; private stats have no owner check.

**Fix:** Authenticate and owner-scope product-linked listings and stats using stored product ownership. Use explicit list serializers without share tokens/private inputs. Keep legacy records outside new accounts' normal navigation. Retain intended token-based public feedback access without making those tokens enumerable. Update clients for authenticated listing/stats.

**Acceptance:** A's listing contains only A's authorized tests; anonymous/shopper/B cannot retrieve A's private metadata or stats. Public product payloads contain no lab data. A deliberately shared legacy feedback token still works, and a random token does not.

### DT-05 — Reject engagement on unpublished products

**Where:** `productRepository.ts` save, feedback and support operations; `productRoutes.ts`.

**Error:** These writes check existence but not published status.

**Fix:** Require a published product for community save/feedback/support creation or update. Apply role and self-support checks as well. Check current status at the write boundary; do not rely on the UI or an earlier detail fetch. Define unsave cleanup for previously saved products that later become drafts without revealing draft contents.

**Acceptance:** Draft IDs cannot be used by other accounts to add saves, feedback or proposals; no rows/counts change. Published-product operations continue to work for all allowed roles. Cover a published-to-draft transition and self-support rejection.

### DT-06 — Make seed execution preserve real interactions

**Where:** `server/src/app.ts`, `server/src/db/seed.ts`, optional seed migration marker.

**Error:** Every startup upserts demo saves/answers/proposals, reverting users' changes and unsaves.

**Fix:** Prefer seeding accounts/products with zero engagement for the demo. If engagement fixtures are retained, initialize them once using a durable seed-version marker and label them in aggregates as well as details. Do not use “insert if missing” on every boot for saves: that would recreate a user's deliberate unsave. Preserve existing live records; do not infer that every record belonging to a demo account is disposable.

**Acceptance:** Seed twice without count growth. Then unsave, change feedback and update a proposal; restart and seed again. All live changes remain identical, including relevant timestamps. Document starting counts and any seeded counts clearly.

### DT-07 — Validate actual publishing requirements

**Where:** `shared/src/validation.ts`, shared product types, publish form, product routes.

**Error:** Empty arbitrary category data and empty availability lists pass publishing.

**Fix:** Define one shared category-aware publish contract: apparel material/fit/sizes; food portion/known ingredients; digital main function/platform/language; other specification text. Represent explicit undecided values consistently instead of silently omitting fields. Require a nonempty market list plus fulfillment, or explicit undecided availability. Require a real image or dedicated clear visual/functional description; unrelated object keys must not satisfy this check. Preserve permissive draft saving under DT-21.

**Acceptance:** Per-category missing/blank fields fail publication with field-specific issues. Valid facts or explicit undecided choices pass. Empty arrays/whitespace cannot bypass checks. UI/API contracts agree; draft save remains possible.

### DT-08 — Distinguish unknown price, trial price and free products

**Where:** shared option/schema/types/finance, lab prefilling, setup/preflight, evaluator and snapshots, results.

**Error:** Null/blank price becomes numeric zero, yet the UI calls the run concept-only.

**Fix:** Introduce an explicit unknown-price representation, such as nullable price plus a documented price status. Carry it through persistence, API, snapshots and prompts. A private trial price belongs to lab data and must not change the public product. Genuine zero is a known free price. Concept-only evaluation must state missing price, avoid affordability/value-for-price conclusions, and show missing-price finance rather than computing with zero. Prevent a price-lever comparison unless both prices are known. Migrate legacy numeric prices without reinterpreting all zeros as unknown.

**Acceptance:** Test null, blank, known 0, and positive trial price separately. Inspect the evaluator input for each. Unknown-price results contain the limitation and no price/finance conclusion; known free products remain correctly represented. Public price stays undecided when a trial price is entered.

### DT-09 — Require independent budgets and confirmed coverage

**Where:** `productRoutes.ts` lab/preflight mapping, `SetupTestPage.tsx`, audience form, schemas/eligibility.

**Error:** Undecided coverage becomes `All Online`; fulfillment becomes delivery; budget bounds derive from candidate price.

**Fix:** Remove these inferred facts. Prefill only explicitly entered product markets/fulfillment/buyer facts. Keep private audience markets, adjacent group and budget bounds missing until entered/confirmed. Use a compact preflight that blocks run with actionable missing fields while allowing draft save. Price changes must never rewrite the audience budget. Unknown access is not eligible by default.

**Acceptance:** A product with undecided coverage cannot silently run an all-served panel. Changing price alone leaves entered budget bounds, profile seed and intended panel identity stable for paired evaluation. Missing costs do not block a run. Real entered coverage still produces deterministic unavailable records.

### DT-10 — Wire explicit research-failure recovery

**Where:** `runRoutes.ts`, `PreflightLabCard.tsx`, `SetupTestPage.tsx` run request/progress.

**Error:** Failed search proceeds directly to evaluation; skip callback is never passed and request body omits the choice.

**Fix:** On search failure, persist/display that state and return a structured recoverable response before model evaluation starts. Wire Retry and Continue without research through parent state to the API. Validate skip as a boolean and tie it to the current intended review. Show real search/evaluation phases, not fabricated progress. Zero relevant matches is a successful research outcome, not an error requiring a bypass.

**Acceptance:** Forced search failure results in zero evaluator calls until an explicit fallback choice. Retry can succeed; Continue runs with honest research status. Buttons work in the browser and after restoring saved state. No-match searches can proceed normally. No fabricated model fallback when Groq is unavailable.

### DT-11 — Persist research attempts independently of reference selection

**Where:** migrations, reference/research persistence, research routes, run launch and preflight state.

**Error:** Any selected reference implies completed research, including founder notes and sources for old product details; empty-result attempts are not reusable.

**Fix:** Store a research attempt with product/input snapshot fingerprint, query, provider, state, timestamps and error, plus references linked to that attempt. Define fingerprint inputs from the actual confirmed proposal used for research/evaluation. Reuse an applicable completed/no-match attempt and its selection even when zero sources are selected. Do not satisfy automatic-search completion with manual URLs. Product changes invalidate reuse for new runs; old runs retain frozen evidence. Refresh source facts/date on an actual new retrieval without rewriting frozen snapshots.

**Acceptance:** Manual-only sources do not suppress the required automatic attempt. A matching completed attempt is reused without another call; changed relevant product facts trigger new research. No-match and deliberately deselected results survive refresh without unwanted searches. Failed/skipped/completed states remain distinct.

### DT-12 — Validate citations against exact run-scoped sources

**Where:** `groqEvaluator.ts`, prompt/schema, `referenceRepository.ts` reference formatting.

**Error:** Any `REF-*` alias matches the first source; invalid IDs can be discarded while unsupported prose remains accepted.

**Fix:** Build a deterministic alias-to-full-ID map from the ordered frozen source set and use the same map in prompt, validator and UI. Prefer full IDs in structured output. Accept only exact documented aliases/full IDs; remove prefix/substring/domain guesses. Reject and retry the affected profile's invalid citation record rather than silently accepting unsupported prose. Keep unrelated valid evaluations. Ensure structured comparison claims require an accompanying valid source ID without requiring citations for observations based solely on supplied product facts.

**Acceptance:** `REF-2` resolves only to source 2; `REF-999`, empty IDs, another run's IDs and ambiguous prefixes fail. Valid full IDs survive storage. A failed item retries without duplicating completed profiles. A local product-only objection can legitimately have `source_ids: []`.

### DT-13 — Never supplement a frozen run with current references

**Where:** `GroqEvaluator.executeRun`, run snapshot schema/repository, retry path.

**Error:** An empty snapshot source array falls back to current product sources.

**Fix:** Treat `references: []` as a valid immutable source set. Read test, private inputs, profiles and references exclusively from the run snapshot during execution/retry. A missing/invalid legacy snapshot gets a clear “create a new review” state rather than reconstruction from mutable data.

**Acceptance:** Start a partial run with no sources, add sources, then retry: all batches still receive no sources and the snapshot stays unchanged. Repeat with nonempty sources followed by edits/deletion/deselection. Existing valid evaluations and profile IDs remain intact.

### DT-14 — Make new reviews use the current product coherently

**Where:** product lab endpoint, setup new/copy workflow, test/run snapshot persistence, research query source.

**Error:** Existing tests always win over edited product data, while search uses the current product; evaluation and research can describe different proposals.

**Fix:** Separate “inspect/resume existing review” from “new review from current product.” Prefill a new draft from the current public product while preserving explicitly reusable private settings only with visible semantics. Store the originating product snapshot plus the final lab/private inputs and selected source facts in each run. Build research from that same intended snapshot. If “copy old review” is kept, label it clearly and use the copied proposal for research too.

**Acceptance:** Run v1, edit product price/text/images, create v2: v2 inputs/research match edits; v1 remains byte-for-byte stable in its meaningful snapshot fields. Refresh restores the correct run. Optional copying never silently mixes product versions.

### DT-15 — Support all product categories through lab adapters

**Where:** publish category data, shared domain schemas/types, lab adapter, profile traits, seed fixtures.

**Error:** Digital posts omit required lab `pricing_type`; “other” is silently treated as clothing; seeded brewing equipment lacks food fields.

**Fix:** Implement explicit category-to-lab mappings. Persist and preflight digital billing type, including undecided handling that disables unsupported finance. Do not present a UI default that is absent from state. Reuse the engine with generic specification-based traits for other products rather than requiring invented clothing attributes. Reconcile seed categories/details with their actual product. Keep the established 20/20/10 engine and do not create a separate simulator.

**Acceptance:** Publish then open the lab for apparel, food, digital and other products. Each preserves supplied facts and asks only relevant missing questions. An otherwise valid digital post does not fail on a hidden field. Single runs store 50 responses and comparisons 100; subscriptions use an explicitly named first period.

### DT-16 — Render finance for only the options that exist

**Where:** `ResultsPage.tsx`, `FinancialScenarioPanel.tsx`, related shared prop contracts.

**Error:** Single mode passes A's finance as B and renders blank-name/zero-price B economics and variance.

**Fix:** Make the finance component accept one or two explicit options, or a genuinely optional B. Do not substitute A for B. In single mode show A only, including revenue, variable cost and net result for entered scenarios. In comparison mode retain both and meaningful variance. Respect unknown-price handling from DT-08 and actual missing-field messages.

**Acceptance:** Single mode contains no B card/column/variance, with or without cost inputs. Comparison arithmetic remains correct. Test zero fixed cost, nonpositive margin, capacity breach and invalid scenario units; scenario quantities never derive from synthetic interest.

### DT-17 — Show community feedback in product-linked lab results

**Where:** `ResultsPage.tsx`, `RealFeedbackSection.tsx`, product feedback APIs.

**Error:** Results query old anonymous test feedback and ask a completed single review to finish an A/B comparison.

**Fix:** For product-linked labs, query product community feedback by product ID and display Yes/Maybe/No with its own respondent total. Owner-only reasons use authorized endpoints. Keep anonymous A/B feedback separately labeled and only where applicable; never merge its counts with community or synthetic records. Link back to the actual public product.

**Acceptance:** One community answer appears as one person in lab results; editing it keeps total one. A completed single run has no misleading comparison-required message. Anonymous legacy A/B feedback still works separately. Public accounts cannot access private owner reasons.

### DT-18 — Repair all four quick demo logins

**Where:** `AuthModal.tsx`, `AuthContext.tsx`, `authRoutes.ts` demo endpoint, seed credential definition.

**Error:** UI uses old emails and `password123`, while seed uses current local accounts and `Password123!`; login failure is ignored.

**Fix:** Use one coherent demo account definition for seed and UI metadata. Demo credentials must be explicitly demo-only, never real-user credentials. Return/handle the sign-in result; close the modal only after success and show failures. Resolve role from the authenticated session, never from a selected tile.

**Acceptance:** Each of the four buttons signs in to the correct seeded identity/role on a clean database. Wrong credentials leave the modal open with a readable error. Existing non-demo sign-in/signup continue working.

### DT-19 — Restore navigation state from URLs

**Where:** `client/src/App.tsx`, publish/edit and lab/results navigation.

**Error:** `/publish?edit=ID` loses edit identity on refresh; back navigation to `/` does not restore Explore; some actions change the view without URL changes.

**Fix:** Centralize parsing and navigation for the current route scheme, using existing conventions or a small router. Parse the edit query and stable product/test/run IDs. Restore `/` and handle unknown routes. Make all page-changing actions update URL state consistently. Clear or partition active private selections on account change; do not restore another account's private screen from stale session state.

**Acceptance:** Refresh edit/product/lab/results pages and use Back/Forward across Explore, Saved and My Products. Edit save updates the same product rather than creating a duplicate. Direct links work in another session with appropriate access checks.

### DT-20 — Enforce explicit public product serializers

**Where:** product schemas/types, `ProductRepository.getPublicDetail`, public feed/detail serializers.

**Error:** Arbitrary category objects can include private manufacturing costs/scenarios and are returned publicly.

**Fix:** Share an allowlist of public category fields with DT-07. Reject private/unknown structured payload keys or strip them deliberately at the input boundary, and independently serialize only approved public fields on read. Sanitize existing stored category objects on output; a migration may separate recognized private data without deleting it. Lab-only costs stay in authorized lab storage.

**Acceptance:** Inject unit costs, fixed costs, scenarios and nested lab data into product requests and existing fixture rows. Public feed/detail never emit them. Allowed category facts remain intact; the owner can still access separately stored private lab economics.

### DT-21 — Separate incomplete draft validation from publish/run validation

**Where:** shared schemas, draft repositories/routes, product/lab save UI.

**Error:** Draft saving requires fields needed only for publishing/running.

**Fix:** Create bounded partial draft contracts that can persist missing fields safely. Apply complete validation only at publish/run transitions. Adjust persistence/read types so incomplete drafts do not crash consumers; do not insert invented product facts to satisfy NOT NULL columns. Keep authorization and payload size/type limits for drafts.

**Acceptance:** Save/reload a draft containing only an entered name and partial concept. Missing fields remain missing. Publish/run returns actionable validation errors until completed. Existing complete drafts and frozen runs still load.

### DT-22 — Remove invented form values and preserve edit round trips

**Where:** `PublishProductPage.tsx`, category data adapters, image description inputs.

**Error:** New forms use example prices/materials/markets/ingredients as actual values. Digital edits append the default language repeatedly. Product names are automatically marked as confirmed image descriptions.

**Fix:** Use empty/explicit undecided state and examples as placeholders or an intentionally chosen demo preset. Reset all state when changing edit targets/categories. Store platform/language separately or implement a lossless migration/adapter for the existing combined field. Loading and saving without edits must not change facts. Require explicit image description entry/confirmation; a filename/product name is not confirmed visual evidence.

**Acceptance:** New product submits no untouched example facts. Save the same digital product three times without edits and compare stored facts: unchanged. Missing fields stay undecided. Uploaded images with no confirmed description are labeled honestly and are not treated as visually analyzed.

### DT-23 — Complete source-grounded comparable-product research

**Where:** `searchService.ts`, `referenceRepository.ts`, snapshot summary and reference/persona UI.

**Error:** Queries omit useful supplied facts and add unsupported attributes; domain-based dedup drops distinct products; manual duplicates persist; no actual selected-source comparison is stored; persona citations are not inspectable.

**Fix:** Build concise queries from entered purpose, category, distinguishing features, market and known price, without inventing traits. Normalize canonical HTTP(S) URLs and deduplicate by product URL rather than entire domain. Apply simple relevance/product-page prioritization; record excluded or thin evidence honestly without building a crawler. Keep snippet versus page versus founder-note provenance. Produce a concise selected-source comparison of overlapping need, verified differences and missing facts, with source IDs. When evidence cannot support a difference, say unknown. Persist the comparison with the run and make persona source IDs clickable against its frozen sources.

**Acceptance:** Fixture results include two relevant products on one domain, duplicate URL variants, irrelevant results, thin snippets and a manual note. Useful distinct products survive, duplicates do not, and invented price/features never appear. Selecting/deselecting sources changes only new-run context. Report links, check dates and provenance correspond to frozen records.

### DT-24 — Distinguish missing evaluations from unavailable access

**Where:** `shared/src/analysis.ts`, response/transition display contracts, breakdown/persona UI.

**Error:** Missing responses default to `unavailable` and reduce eligible counts even when the market is served.

**Fix:** Calculate eligibility from frozen coverage independently of evaluation completion. Represent missing/pending evaluations in analysis/UI separately from the four evaluated response categories; do not insert fabricated evaluation rows. Only compute paired transitions when both responses exist. Keep complete-result headlines gated on actual completion.

**Acceptance:** Fail several served-profile batches: those rows show missing/pending, not unavailable, and coverage counts remain correct. Actually unserved profiles remain unavailable with coverage reasons. Retry fills only missing records and restores correct complete counts/transitions.

### DT-25 — Store support amounts exactly

**Where:** support migration/schema/repository, API and amount formatting.

**Error:** SQLite REAL plus unrestricted positive numbers violates the exact-money contract.

**Fix:** Use integer minor units or an exact decimal representation end to end. Define supported currencies and precision explicitly; reject fractional minor units, nonfinite values and unsafe magnitudes. Parse decimal inputs without an accidental floating-point round trip where possible. Migrate existing REAL amounts once with an explicit rounding policy and report anomalies; do not silently lose existing proposals. Keep amounts described as proposed, never paid/raised.

**Acceptance:** Test 0.10, 0.29, 500 and the smallest supported unit, round trips and proposal updates. Reject zero, negative, excessive precision and unsafe amounts. Migration is idempotent and preserves proposal identity/ownership/message.

### DT-26 — Require startup descriptions on signup

**Where:** signup schema and auth modal.

**Error:** A startup can sign up without its required short description.

**Fix:** Require trimmed nonempty startup name and description for startup signup, with reasonable existing length limits and field errors. Keep display-name requirements for other roles. Do not break sign-in of historical accounts; any legacy completion policy must be explicit.

**Acceptance:** Missing/blank startup description fails at the server and UI; valid startup signup succeeds. Shopper/sponsor registration and saved-role sign-in are unaffected.

### DT-27 — Complete keyboard and responsive behavior

**Where:** Explore cards, publish labels, auth/support modals, Navbar, product detail and styles.

**Error:** Click-only product cards, unassociated labels, incomplete dialog behavior and inline layout overrides undermine accessibility/mobile use. Exact layout effects still need browser confirmation.

**Fix:** Use real product links/buttons without nested interactive controls. Associate labels and fields. Add dialog semantics, focus entry/trap/return and Escape close. Move conflicting inline sizes/grids to responsive classes; constrain minimum card widths to the viewport. Preserve readable tables with intentional inner scrolling rather than page overflow. Retain visible focus and meaningful loading/error states.

**Acceptance:** At approximately 390px and desktop width, complete sign-in, publish, save, feedback, support, research and results. Repeat essential actions with keyboard only. Record screenshots and viewport sizes; verify page overflow, labels, focus order and modal return focus. Do not mark visually verified from source inspection alone.

### DT-28 — Correct documentation after behavior is verified

**Where:** `walkthrough.md`, `README.md`, `built_status.md`, `v2_inventory.md`, `.env.example` where needed.

**Error:** Claims include nonexistent heuristic model fallback, provider cascading, JWT/SESSION_SECRET, wrong URLs, old counts and overclaimed research/concept behavior.

**Fix:** Document actual commands, current credentials, routes, provider selection/failure behavior and environment names without secrets. Explain Groq unavailability honestly. Describe research evidence level and known limitations. Reconcile the v2 primary journey and mark historical status records as historical. Record actual latest test counts/results and live/browser checks with dates. Do not add unnecessary multi-provider fallback or fabricated simulation merely to satisfy incorrect prose.

**Acceptance:** Follow the documented setup/demo in a clean isolated environment. Every route/action/credential works as written. Search credentials/model absence show documented behavior. No unexecuted check is described as passed. Missing auxiliary PRD documents remain explicitly noted unless genuinely supplied.

### DT-29 — Persist and display the viewer's saved state in Explore

**Where:** public feed query/serializer, `ExplorePage.tsx`, save endpoint request schema.

**Error:** Feed exposes only aggregate count and sends a toggle, leaving users unable to see whether a product is already saved.

**Fix:** Include authenticated viewer-specific `is_saved` without exposing other users' save identities. Render Save/Saved and accessible pressed state. Send strict `{saved: boolean}` desired-state writes, validating booleans rather than coercing strings. Update state/count from the server response; show recoverable failure feedback. Refresh appropriately on account change and avoid caching personal save state as public data.

**Acceptance:** Save from Explore, refresh, open Saved/detail, then unsave: state/count agree everywhere. Repeating `saved: true` does not duplicate or toggle off. A second account sees its own state and the shared aggregate. Invalid boolean payloads fail and network errors remain visible.

## Integrated verification plan

The original review passed a production build and **93 tests (19 shared + 74 server)**, yet the defects remained. This is a historical baseline, not the required final test count.

1. Use an isolated fresh database and also test additive migrations against an isolated pre-fix database containing users, drafts, completed/partial runs, references and proposals. Preserve old snapshots; validate migration reruns.
2. Run focused regression suites, then `npm.cmd test` and `npm.cmd run build` on Windows (`npm test`/`npm run build` in compatible shells). Record exit codes and actual counts. A build warning is not a test failure; a tool/environment failure is not a passing check.
3. Repeat the authorization matrix using anonymous, shopper, sponsor, founder A and founder B. Assert both rejection and unchanged stored state. Check alternative routes and omitted/conflicting IDs, not only ordinary GET requests.
4. Execute the actual UI community loop with separate sessions: founder publishes a valid product; shopper saves and answers; edits answer; unsaves; sponsor and founder B each propose support; owner sees correct records. Refresh, restart and reseed; verify persistence and unchanged real data.
5. Verify all four product categories. Include explicit unknown price/availability, private trial price, genuine free price, incomplete drafts and optional costs. Confirm private inputs never enter public payloads.
6. Research/evaluation cases: matching completed search, successful no matches, manual-only, failed search with Retry, explicit Continue, source deselection, product edits, partial batches, rate limits and retries after sources change. Inspect frozen snapshots and exact citations, not just HTTP status.
7. With configured credentials, perform one real backend search and one genuinely completed 50-profile review. Confirm stored source provenance and 50 distinct profile IDs/valid responses; qualify unavailable records as deterministic coverage outcomes rather than model calls. Verify 100 paired records for optional A/B mode, including an eligible live evaluation path where feasible. Report any unavailable credentials/network/model support as a blocker; mocks do not replace live proof.
8. Verify finance numerically and single-mode rendering. Community feedback, research sources and synthetic evaluations must remain in separate collections and counts.
9. Run the desktop/~390px and keyboard journey. Record actual screenshots and failures. Validate refreshed edit URLs, direct links, Back/Forward and account changes.
10. Reconcile documentation and issue statuses with the collected evidence. List unresolved items and new regressions explicitly. Never report full compliance while required checks remain unverified.

### Isolated verification environment example (PowerShell)

Choose a fresh workspace-local review directory for each run. Set these variables in the same process that runs tests/server so default data paths are not used:

```powershell
$reviewRoot = Join-Path (Get-Location) '.cache\verification-01'
New-Item -ItemType Directory -Force -Path $reviewRoot | Out-Null
$env:DATA_DIR = Join-Path $reviewRoot 'data'
$env:UPLOAD_DIR = Join-Path $reviewRoot 'uploads'
npm.cmd test
# Record the exit code before running the next command.
npm.cmd run build
```

Inspect test setup before executing it: some existing tests may use their own in-memory databases or mocks. Do not run a test that ignores isolation and writes to normal user data. The review's optional `.cache/prd-review-probes.mjs` can help reproduce historical behavior if present, but it is not a substitute for permanent assertions, and its compiled imports require an up-to-date build.

## Agent execution log

Date / agent / branch or revision: 2026-09-25 / Codex / existing working tree
Assigned issue IDs: DT-01, DT-02, DT-03, DT-04, DT-05, DT-20
Status changes: OPEN -> VERIFIED for all assigned IDs after a fresh isolated focused run and full isolated suite.
Current reproduction and root cause: Confirmed submitted-relation authorization, ref-ID-only mutations, anonymous/untracked uploads, global lab metadata, missing published-state write checks, and unrestricted category objects.
Files and API/schema/migration contracts changed: Test/product/upload routes and repositories; upload metadata migration; product category validation/public serialization; authenticated upload/list/stats client calls; focused security regressions.
Verification commands, exit codes, counts and evidence paths: `npm.cmd run build` exit 0; isolated `npm.cmd test` exit 0 with 19 shared + 80 server tests; fresh sequence 1 suite 6/6 passed under `.cache/seq1-verify/`.
Browser/live checks actually performed: None required for these server-boundary repairs; client TypeScript and production Vite build passed.
Remaining limitations/blockers: The final independent audit and full browser journey remain scheduled after all work packages; the focused security/privacy suite and integrated tests passed.
Dependencies or handoff for next agent: Strict product category allowlist and authenticated upload contract are established; preserve both.

Date / agent / branch or revision: 2026-09-25 / Codex / existing working tree
Assigned issue IDs: DT-06, DT-18, DT-25, DT-26
Status changes: OPEN -> IMPLEMENTED; focused and full isolated integrated verification passed.
Current reproduction and root cause: Repeat seed mutates engagement, quick-login identities/password differ from the seed, proposal amounts are REAL, and startup descriptions are optional.
Files and API/schema/migration contracts changed: Shared demo account and money contracts; seed/auth/client demo login; proposal minor-unit migration and repository; signup validation/form; signup test fixtures; sequence 2 regression tests.
Verification commands, exit codes, counts and evidence paths: `npm.cmd run build` exit 0; focused isolated sequence 2 test exit 0, 4/4 tests under `.cache/seq2-focused-2/`; integrated `npm.cmd test` exit 0, 19 shared + 84 server tests (103 total) under `.cache/sequence-2-full/`.
Browser/live checks actually performed: No browser check yet; client TypeScript and Vite build passed.
Remaining limitations/blockers: The quick-login button flow has not yet been exercised in a browser; API identity/password checks passed and the client production build passed. Legacy money migration rounds persisted REAL amounts to currency precision once and logs any rounding count.
Dependencies or handoff for next agent: None.

Date / agent / branch or revision: 2026-09-25 / Codex / existing working tree
Assigned issue IDs: DT-07, DT-08, DT-09, DT-14, DT-15, DT-21, DT-22
Status changes: OPEN -> IMPLEMENTED for all assigned IDs; acceptance regressions and integrated suite pass. Kept IMPLEMENTED pending browser review.
Current reproduction and root cause: Publishing accepted incomplete category/availability objects; missing public price was represented as zero in lab input; audience facts were inferred from price and product coverage; current product data and saved lab/research could diverge; other/digital mappings were incomplete; drafts required run-complete fields; publish examples became stored values and combined digital edit fields were lossy.
Files and API/schema/migration contracts changed: Shared product/category/publish and partial-draft schemas; publish/edit and lab UI; product lab/preflight and test draft routes; server-owned product snapshots used for research; evaluator/finance unknown-price handling; generic profile traits; seed category correction; regressions.
Verification commands, exit codes, counts and evidence paths: `npm.cmd run build` exit 0; isolated `npm.cmd test` exit 0 with 21 shared + 86 server tests (107 total) under `.cache/seq3-final2/`. Stage 4 regressions cover digital prefills, unconfirmed audience inputs, partial draft persistence/run rejection, current-product vs resume flow, snapshot refresh, and private trial price without public-price mutation.
Browser/live checks actually performed: None. Client typecheck and production build passed; publish/edit controls were not browser- or keyboard-tested.
Remaining limitations/blockers: Blank category fields are stored explicitly as `not_decided` with helper text; browser review should confirm the choice reads clearly. Legacy seed correction applies only to the recognized original brewware fixture signature, avoiding reclassification of edited records.
Dependencies or handoff for next agent: Sequence 4 can rely on stable category, price-status, audience, and saved product-snapshot contracts; preserve those contracts.

Date / agent / branch or revision: 2026-09-25 / Codex / existing working tree
Assigned issue IDs: DT-16, DT-17, DT-24
Status changes: OPEN -> IMPLEMENTED; production build passes. Acceptance behavior remains pending explicit focused/UI verification.
Current reproduction and root cause: Single-mode results substituted A finance for B and rendered a false B comparison; product-linked results queried legacy anonymous test feedback instead of community feedback; absent model rows were mapped to unavailable and counted as unserved.
Files and API/schema/migration contracts changed: Financial panel and ResultsPage now use optional B; ResultsPage loads owner-scoped community feedback by product while preserving comparison-link responses separately; shared analysis distinguishes missing evaluations, derives coverage from the saved option markets, and omits incomplete pairs from transition movement counts. Persona and breakdown views label missing responses separately.
Verification commands, exit codes, counts and evidence paths: `npm run build` exit 0 (shared, server, client TypeScript and Vite production bundle). Tests were not run in this work package.
Browser/live checks actually performed: None.
Remaining limitations/blockers: DT-16/17/24 require focused regression and browser checks before VERIFIED; product feedback detail remains available only to the product owner through the existing authorized endpoint.
Dependencies or handoff for next agent: Results can rely on explicit `missing` response and `incomplete_pairs` fields; consumers should keep unserved access separate from absent evaluations.

Date / agent / branch or revision: 2026-09-25 / Codex / existing working tree
Assigned issue IDs: DT-19, DT-27, DT-29
Status changes: OPEN -> IMPLEMENTED for all assigned IDs; browser verification not performed.
Current reproduction and root cause: Publish edit IDs and results/lab selections were not restored from URLs, Explore did not reliably return to its root state on history navigation, and product cards/save controls lacked complete link and viewer-specific save behavior.
Files and API/schema/migration contracts changed: App route parsing/navigation and account-change handling; Explore feed and save UI; optional `is_saved` field in feed serialization/query with private authenticated responses marked no-store; auth/support dialog focus semantics; Navbar home keyboard control; publish field label associations; global visible focus styling.
Verification commands, exit codes, counts and evidence paths: `npm.cmd run build` exit 0 (shared/server/client TypeScript and Vite production bundle); no tests run. Existing Vite chunk-size warning remains (>500 kB).
Browser/live checks actually performed: None. URL refresh/back/forward, keyboard focus, 390px layout, and two-account save state remain unverified.
Remaining limitations/blockers: DT-19/27/29 stay IMPLEMENTED pending focused regressions and browser acceptance. Auth and support dialogs implement focus entry/trapping/return and Escape, but those behaviors and responsive visuals still need browser review.
Dependencies or handoff for next agent: Use `/results?test=ID` and `/lab?test=ID` for direct run links; personal feed state is returned only for the authenticated viewer and must remain uncacheable/shared-state-safe.

Date / agent / branch or revision: 2026-09-26 / Codex / main working tree
Assigned issue IDs: DT-28 and integrated audit DT-01 through DT-29
Status changes: DT-28 OPEN -> IMPLEMENTED. Existing VERIFIED claims were retained only where focused checks exist; browser-dependent items remain IMPLEMENTED/UNVERIFIED rather than being promoted.
Current reproduction and root cause: User-facing guides contained obsolete fallback/provider-cascade claims, routes, environment names, test totals and demo instructions. The final audit also found one stale analysis-test expectation that declared a winner despite increased unserved coverage; the test now asserts the intended conflict warning. Added missing DT-29 feed assertions for idempotent desired-state writes and viewer-specific state.
Files and API/schema/migration contracts changed: README, walkthrough, built status and v2 inventory rewritten to current behavior; `.env.example` synchronized with actual config; unused `GROQ_VISION_MODEL` config removed; issues ledger and `verification_results.md` updated; analysis and saved-feed regression expectations strengthened.
Verification commands, exit codes, counts and evidence paths: Isolated `$env:DATA_DIR='.cache/final-audit-20260926-final/data'; $env:UPLOAD_DIR='.cache/final-audit-20260926-final/uploads'; npm.cmd test` exit 0 (21 shared + 90 server = 111; 0 failed). `npm.cmd run build` exit 0 (three workspaces; Vite >500 kB chunk warning). `git diff --check` reported no whitespace errors. Read-only local HTTP checks: client 200, API health healthy, feed 71 products with boolean anonymous saved state.
Browser/live checks actually performed: Computer-use surface returned no browsers and refused IAB/Chrome; no screenshot/keyboard/390px validation could be performed. No live Groq certification; tests use controlled provider behavior. No live search certification claimed.
Remaining limitations/blockers: DT-14, DT-17, DT-19, DT-22, DT-27 and DT-29 require remaining browser/E2E acceptance described in `verification_results.md`; live provider status is unverified. Vite large-bundle warning remains non-blocking. `prompts_v2.md` and `bp_reference_v2.md` were not present.
Dependencies or handoff for next agent: Before claiming fully verified, run the owner/community flow in separate browser sessions; refresh/back/forward edit/lab/results routes; exercise sign-in, publish/edit, save/unsave, feedback/support and lab failure/retry at desktop and ~390 px with keyboard. Separately smoke-test configured Groq and one actual search provider without describing mocks as live evidence.

Append entries in this format:

```text
Date / agent / branch or revision:
Assigned issue IDs:
Status changes:
Current reproduction and root cause:
Files and API/schema/migration contracts changed:
Verification commands, exit codes, counts and evidence paths:
Browser/live checks actually performed:
Remaining limitations/blockers:
Dependencies or handoff for next agent:
```

## Implementation prompt for an assigned agent

Replace the bracketed assignment before use:

```text
Work in this DROPTEST repository. Read applicable repository instructions,
issues.md, PRD_REVIEW.md and update_prd_v2.md. Read the original PRD for the
simulation/finance guarantees v2 preserves. Fix [ISSUE IDS OR WORK PACKAGE].

Inspect current code and git status; preserve unrelated work and application
data. Claim your IDs in issues.md and coordinate shared-file/API/schema edits
with other agents. Reproduce each assigned issue before changing it. Implement
the complete server/persistence/client fix described by its acceptance checks,
adapting file names to current code. Do not change the product scope, fabricate
model/search data, weaken tests, or hide broken behavior to claim completion.

Use isolated test data and additive migrations. Add meaningful regressions for
the defects, run relevant checks, then the integrated build/tests when ready.
Perform relevant browser checks for UI changes. Separate mocked, live and
unverified evidence. Update only your ledger rows and append an execution log
entry with files, commands/results and blockers. Mark IMPLEMENTED until the
required acceptance evidence exists; never mark an unrun check as VERIFIED.
Finish with repaired IDs, evidence, unresolved items and next-agent handoff.
```

## Final independent verification prompt

Copy this prompt into a fresh agent after the repair work:

```text
Independently verify this DROPTEST implementation against issues.md and the
product requirements. Read repository instructions, update_prd_v2.md,
DROPTEST_PRD.md, PRD_REVIEW.md, walkthrough.md, README.md, built_status.md and
v2_inventory.md. V2 supersedes the original primary journey; preserve the
original guarantees that v2 explicitly retains. Note missing referenced docs.

Your task is verification, not accepting prior agents' completion claims.
Review the CURRENT code and migrations for ALL DT-01 through DT-29, including
items already marked VERIFIED. Do not modify application code in this pass;
write verification_results.md and update issue statuses only with evidence.
Preserve existing changes/data and use isolated fixture databases/uploads.

For every issue:
1. Identify the current relevant files and the repair, if any.
2. Run or inspect its concrete acceptance checks. Reproduce authorization and
   persistence edge cases, including omitted/conflicting IDs, another owner's
   reference ID, unpublished products, restart/reseed, and legacy records.
3. Record PASS, FAIL or UNVERIFIED, exact evidence and remaining defects.
   Passing tests, comments, UI labels or an agent summary alone are not proof.

Run the integrated verification plan in issues.md. Run the full build and
test suite; record commands, exit codes and actual totals. Verify fresh and
existing-data migration paths. Walk the real browser flow at desktop and
approximately 390px with keyboard checks and separate account sessions.
Check publish/edit/refresh/history, save/unsave, editable feedback, support,
owner-only lab access, unknown inputs, single finance and community counts.

Exercise real search and a genuinely completed 50-profile run when credentials
and network access permit; verify optional paired 100-response mode. Inspect
stored IDs, source facts, immutable snapshots, citations, retry preservation
and counts. Separately test search/model failures with deterministic mocks.
Never claim mocked completion proves live-provider correctness. If a required
environment capability is missing, report the specific blocker and mark that
check UNVERIFIED; continue all independent checks. Never expose secrets.

Inspect beyond the issue list for regressions or other unmet v2 requirements.
Do not treat deferred payments/chat/rewards as missing features. Do not invent
new scope or rewrite the PRD to make the implementation pass.

Produce verification_results.md containing:
- Overall verdict: complete, incomplete, or blocked verification, with reasons.
- A 29-row table: ID, PASS/FAIL/UNVERIFIED, current file references, evidence.
- New findings ranked by severity with reproduction steps and expected/actual.
- Build/test/migration results and evidence artifact paths.
- Actual browser viewport/session and live search/model checks performed.
- Remaining blockers, unverified acceptance checks and documentation conflicts.

Update issues.md ledger rows consistently and append your dated execution log.
If a formerly fixed issue fails, reopen it and explain why. Do not mark the
product fully compliant unless all applicable requirements are implemented
and the required evidence is present. End with a concise user-facing verdict
and the highest-priority remaining fixes.
```
