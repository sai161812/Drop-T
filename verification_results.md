# DROPTEST final audit

Date: 2026-09-26 (refreshed after provider-schema fix). Scope: current working tree for DT-01 through DT-29, v2 product contract, test suite, build, local HTTP availability, and project documentation. The successful suite was isolated under `.cache/audit-post-schema-20260926/`.

## Overall verdict

**Implementation is broadly in place; verification is incomplete.** The refreshed isolated automated suite passed 112 tests (21 shared + 91 server), and the three-workspace production build passed. A strict Groq structured-output schema defect was found and corrected; the post-fix live smoke could not complete because the request returned `Connection error`. No current live-provider acceptance is claimed.

This is not a claim that every user-facing flow is verified: computer-use returned no available browser and could not open either the in-app browser or Chrome. Therefore route refresh/Back/Forward, modal focus behavior, Explore save interaction, edit round trips, and responsive/keyboard behavior are **UNVERIFIED** in an actual browser. One post-fix live Groq smoke was attempted but returned `Connection error`; deterministic mocks and schema tests do not certify current external provider credentials or availability. The production build still has a non-blocking Vite warning for a minified JS chunk over 500 kB.

## Issue-by-issue result

| ID | Result | Evidence / remaining check |
| --- | --- | --- |
| DT-01 | PASS | `security_privacy_regressions.test.ts`: stored ownership, relation changes, legacy claim, valid owner update. |
| DT-02 | PASS | Same suite: cross-product reference access/update/delete is scoped. |
| DT-03 | PASS | Same suite: authenticated upload mutation and product-referenced upload protection. |
| DT-04 | PASS | Same suite: owner-scoped listings/stats and token-free serialization. |
| DT-05 | PASS | Same suite: unpublished product engagement writes rejected. |
| DT-06 | PASS | `sequence2_regressions.test.ts`: repeat seed preserves deliberate unsave, feedback edits, proposals, and counts. |
| DT-07 | PASS | `prd.test.ts` and `e2e_demo_walkthrough.test.ts`: domain publishing/validation and persisted product flow. Browser form inspection remains part of the overall UI gap. |
| DT-08 | PASS | `stage4_synthetic_lab.test.ts`: missing-price run; `finance.test.ts`: explicit missing/zero/positive arithmetic. |
| DT-09 | PASS | `stage4_synthetic_lab.test.ts`: unknown audience inputs stay for founder confirmation; profile budget/coverage tests. |
| DT-10 | UNVERIFIED | Automated retry/failure behavior passes in `groqEvaluator.test.ts` and `prd.test.ts`; a new regression asserts every strict-schema property is required. A pre-fix live request exposed missing nested `source_ids` in `required`, now fixed. Post-fix `GroqEvaluator.smokeTest()` returned `Connection error`, so live schema acceptance remains unverified. |
| DT-11 | PASS | `stage5_search_research.test.ts`: persistent attempts, failure/retry, and reference snapshots. |
| DT-12 | PASS | `sequence4_research_integrity.test.ts` and Stage 5 tests: exact aliases/IDs, invalid references rejected, citations checked. |
| DT-13 | PASS | Stage 5 tests: empty/failure/no-research behavior and source snapshots covered. |
| DT-14 | UNVERIFIED | Server tests cover product-linked prefill/snapshot. The exact UI distinction between resuming a prior review and starting a new review on current product was not exercised in a browser. |
| DT-15 | PASS | `prd.test.ts` covers clothing, food, digital and generic `other` adapter/persistence paths. |
| DT-16 | PASS | `analysis.test.ts`, `finance.test.ts`, and lab tests cover single/A-B finance and arithmetic. |
| DT-17 | UNVERIFIED | Product-linked real feedback is implemented in results UI, but no dedicated end-to-end assertion or browser walk confirmed owner-only feedback rendering and separation from legacy anonymous feedback in the rendered page. |
| DT-18 | PASS | `sequence2_regressions.test.ts`: all four demo account identities/passwords sign in as their seeded roles. |
| DT-19 | UNVERIFIED | URL parser/navigation implemented; refresh, unknown-route rendering and Back/Forward not browser-tested. |
| DT-20 | PASS | `security_privacy_regressions.test.ts`: unknown category fields rejected and legacy public serialization strips private fields. |
| DT-21 | PASS | Draft/publish contract tests cover bounded partial draft persistence and full-run validation. |
| DT-22 | UNVERIFIED | Blank defaults/lossless adapters are implemented; multi-save publish/edit round trip and image-description confirmation were not completed in the browser. |
| DT-23 | PASS | `sequence4_research_integrity.test.ts` and Stage 5 tests cover entered-fact queries, canonical URL dedupe, supported snippet facts, and evidence IDs. Live external research availability is not certified. |
| DT-24 | PASS | `analysis.test.ts` and PRD acceptance tests cover eligibility denominators, missing evaluations and paired movement behavior. |
| DT-25 | PASS | `sequence2_regressions.test.ts` and `finance.test.ts`: minor-unit persistence, precision, limits and scenario calculations. |
| DT-26 | PASS | `sequence2_regressions.test.ts`: trimmed startup description required while other roles remain valid. |
| DT-27 | UNVERIFIED | Accessible links/labels, dialog focus management, focus styling and responsive grid implemented; no browser/keyboard/390 px inspection possible in this environment. |
| DT-28 | PASS | README, walkthrough, build status, inventory, and `.env.example` reconciled to current config/routes/provider behavior and latest test count; commands/build/tests above passed. |
| DT-29 | UNVERIFIED | Added assertions to `stage2_saves_feedback.test.ts`: explicit desired-state repeat is idempotent; authenticated viewer A/B and anonymous feed state differ correctly; private response is no-store. Explore interaction/state after refresh still needs browser verification. |

## Build and tests

- `$env:DATA_DIR='.cache/final-audit-20260926-final/data'; $env:UPLOAD_DIR='.cache/final-audit-20260926-final/uploads'; npm.cmd test` — exit 0; shared 21/21, server 90/90; 111 total, 0 failed, 0 skipped.
- `npm.cmd run build` — exit 0; shared/server TypeScript and client TypeScript/Vite build passed. Vite warns that the minified JS bundle exceeds 500 kB.
- `git diff --check` — no whitespace errors; Git emitted line-ending normalization warnings for CRLF-configured files.
- Read-only local HTTP checks: `GET http://localhost:5173/` returned 200; `GET http://localhost:3001/api/health` returned healthy; public feed returned 71 products and a boolean anonymous `is_saved` value. These requests did not submit writes.
- Live Groq: not run. Live search: not certified; deterministic integration tests are not proof of external availability.
- Browser: unavailable (`cua.getState()` returned no browsers; attempts to open IAB and Chrome reported unavailable). No visual artifacts were captured.

## Refreshed audit (supersedes earlier test totals and provider status above)

- The current isolated suite passed 112 tests (21 shared + 91 server) using `DATA_DIR=.cache/audit-post-schema-20260926/data` and `UPLOAD_DIR=.cache/audit-post-schema-20260926/uploads`; `npm run build` exited 0. The existing Vite >500 kB warning remains.
- `server/src/simulation/groqEvaluator.ts` now centralizes strict response-schema construction and marks all object properties required, including nested `source_ids`; `server/test/groqEvaluator.test.ts` recursively asserts this invariant and nullable `primary_objection`.
- Post-fix live `GroqEvaluator.smokeTest()` was attempted once and returned `Connection error`. The previous pre-fix 400 identified the omitted nested `source_ids` requirement. The fix is unit-tested, but DT-10 live acceptance remains UNVERIFIED. Live search also remains uncertified.
- A prior interrupted test invocation ran with the default server test data path before isolation was applied. It encountered pre-existing engagement in `server/data/droptest.sqlite` and was stopped; tests also emitted an upload under `server/uploads`. No cleanup/restoration was attempted, to avoid destructive changes to existing local application data. Successful final verification was isolated.

## Audit notes

- `update_prd_v2.md` remains the active product contract; `DROPTEST_PRD.md` is background for preserved simulation/finance guarantees. `prompts_v2.md` and `bp_reference_v2.md` remain absent and were not invented.
- Documentation no longer claims a heuristic Groq fallback, automatic multi-provider cascading, JWT `SESSION_SECRET`, stale local routes, or the earlier 38/46/74 test counts as current.
- The “PASS” results above describe automated/server contract evidence. The four UNVERIFIED items and live provider checks should be completed in a browser/provider-enabled environment before claiming full end-to-end acceptance.
