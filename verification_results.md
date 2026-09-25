# DROPTEST final acceptance audit

Date: 2026-09-26. Scope: DT-01 through DT-29, the v2 product contract, isolated automated tests, real browser journeys, accessibility, production build, and bounded live-provider checks.

## Overall verdict

**The application passes its local product acceptance gate; external Groq execution remains blocked by network reachability.** The isolated suite passes 112 tests (21 shared + 91 server), all 8 Playwright journeys pass in desktop Chromium and a Pixel 5/393px mobile profile, and the production build passes without warnings. Live DuckDuckGo research completed with eight processed references.

The configured Groq endpoint could not be certified from this machine. A post-fix smoke request returned `Connection error`, and a direct authenticated request to `https://api.groq.com/openai/v1/models` failed with `ECONNRESET`. The strict-schema defect found earlier is fixed and regression-tested, but DT-10 remains UNVERIFIED until the network permits a real smoke and 50-profile run.

## Issue-by-issue result

| ID | Result | Evidence / remaining check |
| --- | --- | --- |
| DT-01 | PASS | `security_privacy_regressions.test.ts`: stored ownership, relation changes, legacy claim and valid owner update. |
| DT-02 | PASS | Cross-product reference access/update/delete remains owner-scoped. |
| DT-03 | PASS | Authenticated upload mutation, cross-user rejection and referenced-image protection pass. |
| DT-04 | PASS | Owner-scoped listings/stats and token-free serialization pass. |
| DT-05 | PASS | Engagement writes against unpublished products are rejected. |
| DT-06 | PASS | Repeat seeding preserves deliberate unsaves, edited feedback, proposals and counts. |
| DT-07 | PASS | Domain validation plus browser product publish/upload/edit/reload pass. |
| DT-08 | PASS | Unknown-price Lab and finance regressions pass; decimal browser price entry is accepted. |
| DT-09 | PASS | Unknown audience facts remain explicit and profile budget/coverage checks pass. |
| DT-10 | UNVERIFIED | Retry/failure handling and strict response schema pass automated checks. Live Groq is blocked by local `ECONNRESET`; no successful provider response or full live run was obtained. |
| DT-11 | PASS | Persistent research attempts, retry/failure states and frozen reference snapshots pass. |
| DT-12 | PASS | Exact aliases/full IDs, invalid citation rejection and frozen-source links pass. |
| DT-13 | PASS | Empty/failure/no-research behavior and immutable snapshots pass. |
| DT-14 | PASS | Browser checks cover owner Lab direct URL, reload, resume and `review=new`; server snapshot tests pass. |
| DT-15 | PASS | Clothing, food, digital and generic `other` adapters persist correctly. |
| DT-16 | PASS | Single/A-B finance, arithmetic and scenario regressions pass. |
| DT-17 | PASS | Browser founder session renders private registered-user feedback; shopper session cannot see it. Server authorization/separation checks pass. |
| DT-18 | PASS | All four demo credentials pass API checks; browser quick-login paths pass for shopper, sponsor and founder. |
| DT-19 | PASS | Browser direct routes, reload, Back/Forward and unknown-route fallback pass. |
| DT-20 | PASS | Unknown category fields are rejected and legacy public serialization strips private fields. |
| DT-21 | PASS | Bounded partial drafts save while incomplete full runs are rejected. |
| DT-22 | PASS | Browser blank-form, image upload/description, publish, edit and reload round trip pass. |
| DT-23 | PASS | Query grounding, URL canonicalization, evidence IDs and comparison snapshots pass; live DuckDuckGo returned 8 processed references. |
| DT-24 | PASS | Frozen eligibility denominators, missing evaluations and paired movement behavior pass. |
| DT-25 | PASS | Minor-unit persistence, decimal browser inputs, currency precision and scenario calculations pass. |
| DT-26 | PASS | Trimmed startup description remains required without breaking other roles. |
| DT-27 | PASS | Desktop/mobile overflow, dialog focus/Escape/return, labels and representative Axe WCAG 2 A/AA checks pass. Muted text contrast was corrected from 4.01:1. |
| DT-28 | PASS | README, walkthrough, build status, inventory, environment and test commands match current behavior/evidence. |
| DT-29 | PASS | Idempotent desired-state API writes and browser save/reload/Saved-page behavior pass; viewer-specific state remains private/no-store. |

## Verification evidence

- `$env:DATA_DIR='.cache/final-acceptance-20260926/data'; $env:UPLOAD_DIR='.cache/final-acceptance-20260926/uploads'; npm test` — exit 0; shared 21/21 and server 91/91, 112 total, 0 failed/skipped.
- `npm run test:e2e` — exit 0; 8/8 Playwright tests. Projects: desktop Chromium and Pixel 5 (393px). The suite runs real server/client processes against `.cache/playwright-acceptance/`.
- Browser coverage: local/fallback images, direct product routes, refresh/history, unknown path fallback, auth focus/Escape, save persistence, editable feedback, owner-only feedback, exact decimal support proposal, founder inbox, upload/publish/edit/reload, Lab URL/reload and new-review route.
- Accessibility: Axe WCAG 2 A/AA serious/critical scan passes on the public feed, publish form and support dialog; mobile horizontal overflow assertion passes.
- `npm run build` — exit 0 for shared/server/client. Output is split into application (386.13 kB), React vendor (223.22 kB) and icons (33.83 kB); the previous >500 kB warning is gone.
- Live search — completed through DuckDuckGo with 8 processed references across independent product domains/pages.
- Live Groq — failed at network transport (`ECONNRESET`) both through the SDK smoke and direct `/models` probe. Credentials were not printed. A real 50-profile provider run was not attempted after reachability failed.
- `npm audit` during dependency installation reported 0 vulnerabilities.
- `git diff --check` is part of the final pre-commit gate.

## Defects found and fixed during browser acceptance

1. Decimal product prices and support proposals were blocked by the browser because numeric controls inherited the default integer step. Both now use a `0.01` step; the support amount minimum is `0.01`, matching exact-money validation.
2. Support amount/message controls lacked explicit label associations and the dialog close control lacked an accessible name. IDs, `htmlFor`, and an `aria-label` were added.
3. Muted small text measured 4.01:1 on the secondary surface. The shared muted token was darkened; Axe now passes the audited states.
4. The production client emitted a >500 kB chunk warning. React and icon dependencies are now split into stable chunks; the clean build has no warning.

## Remaining external blocker

Only DT-10 live-provider acceptance remains. When Groq connectivity returns, run the one-profile smoke first, then the opt-in `npm run verify:live` full-domain exercise. The deterministic tests prove schema, persistence, retry and incomplete-run behavior, but they are not represented as proof of live model availability.

`update_prd_v2.md` remains the active product contract. `prompts_v2.md` and `bp_reference_v2.md` were not present and were not invented.
