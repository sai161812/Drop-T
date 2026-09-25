# DROPTEST — Project Build Status & Agent Handoff Document

> **File purpose:** Living handoff document tracking build status, architecture decisions, locked contracts, and implementation details across phases. Update after each phase.

---

## 1. Project Overview

- **Product:** DROPTEST — AI-assisted launch decision workspace for first-time sellers, creators, and early founders.
- **Specification:** [`DROPTEST_PRD.md`](./DROPTEST_PRD.md)
- **Primary Core Question:** *"What should I change or test before I commit money to this launch?"*
- **Stack:**
  - **Frontend:** Vite + React 19 + TypeScript + Custom CSS Tokens (Desktop Research Workbench).
  - **Backend:** Express + TypeScript + Node 24 native built-in `node:sqlite`.
  - **Shared Layer:** Domain models, TypeScript interfaces, Zod runtime validation schemas, deterministic finance engine, deterministic eligibility engine.
  - **AI Integration (Server-Only):** Groq SDK configured via server `.env` (zero client-side exposure).

---

## 2. Phase-by-Phase Progress

### Phase 0: Foundation, Persistence, Contracts & Research Workbench Shell
- **Status:** `COMPLETED & VERIFIED` (Local commit: `272d662`)
- **Deliverables:**
  - Initial scaffolding, locked domain contracts, SQLite migrations, Zod validation schemas, deterministic finance engine, base test suites.

### Phase 1: "Set up test" Screen & Durable Draft Persistence
- **Status:** `COMPLETED & VERIFIED` (Local commit: `c23f012`)
- **Deliverables:**
  - First-fold guidance banner, saved drafts switcher, quick starter presets (Apparel, Food, Digital SaaS).
  - Domain-tailored forms for clothing, food, and digital products.
  - 0–3 local image uploads with thumbnail preview, size checks, accessible deletion, and confirmed visual descriptions.
  - Audience & location configuration with character trackers, expected spend bounds, and 1–4 audience markets.
  - Option B single-lever comparison and A &rarr; B diff engine (`price`, `message`, `served_markets`, `creative`).
  - Deterministic finance scenario calculator (PRD Section 8) with break-even $\lceil F / (P - C) \rceil$ and net calculations.
### Phase 2: 50-Profile Builder, Deterministic Eligibility Engine & UI Review Panel
- **Status:** `COMPLETED & VERIFIED` (Local commit: `c23f012`, `ea63b72`)
- **Key Deliverables:**
  1. **Deterministic 50-Profile Builder (`server/src/simulation/profileGenerator.ts`)**:
     - Generates exactly 50 distinct personas: **20 Intended**, **20 Adjacent**, **10 Contrasting**.
     - Assigns stable IDs (`prof_01` .. `prof_50`) preserved across Option A, Option B, and re-evaluations.
     - Uses deterministic PRNG (`Mulberry32`) with configurable integer seed.
     - Enforces budget bands derived strictly from `expected_spend_min` & `expected_spend_max`, completely independent of candidate prices $P_A$ or $P_B$.
     - Rich domain traits matrix for Clothing & Accessories, Local Food & Beverages, and Digital Products & Services.
     - Stratified market allocation across the user's 1–4 configured audience markets.
     - Stride-based co-prime assembly and combinatorial collision avoidance ensuring 100% attribute combination uniqueness across use cases, constraints, priorities, and markets.
     - Avoids names, photos, and demographic stereotypes (focuses purely on use case, constraints, priorities, purchasing context, market, budget).
  2. **Deterministic Eligibility Engine (`shared/src/eligibility.ts`)**:
     - `evaluateEligibility(profile, option)`: Computes access status (`served` vs `unserved`).
     - Strictly marks unserved markets as `unavailable` with an explicit reason string (e.g. `Market "Chennai Central" is outside "Option B" served markets (Bangalore Urban)`).
     - No LLM model calls or heuristic overrides permitted for unserved markets.
     - `calculatePanelEligibilityStats(profiles, option)`: Calculates eligible/unserved counts across segments and markets.
     - Transitioning an unserved market to served across options directly moves profiles to evaluation while keeping profile IDs and attributes identical.
  3. **Database & Repository Persistence (`server/src/db/testRepository.ts`)**:
     - `saveProfiles(testId, profiles)`: Atomically saves/replaces the 50 profiles in SQLite `profiles` table within a transaction.
     - `getProfiles(testId)`: Retrieves saved profiles ordered by `id ASC`.
     - `deleteProfiles(testId)`: Cascading profile deletion.
  4. **Server API Routes (`server/src/routes/testRoutes.ts`)**:
     - `POST /api/tests/preview-panel` — In-memory 50-profile preview with Option A/B eligibility and stats.
     - `GET /api/tests/:id/panel` — Retrieves saved panel profiles and computes Option A/B stats (generates & saves on first request if absent).
     - `POST /api/tests/:id/panel/generate` — Regenerates panel profiles with a new seed and persists to database.
  5. **UI Review Panel Component (`client/src/components/SetupTest/ProfileReviewPanel.tsx`)**:
     - Embedded in `SetupTestPage.tsx` below the intake forms.
     - Visual 20/20/10 segment bar with exact counts.
     - Audience market allocation breakdown badges.
     - Option A vs Option B served coverage metrics and unserved counts.
     - "Regenerate Panel" button (re-rolls seed and re-generates unique personas).
     - Filter controls: segment tabs ("All 50", "Intended 20", "Adjacent 20", "Contrasting 10"), market dropdown, and keyword search.
     - Inspectable 50-row persona table with Option A & Option B access badges and explicit unserved reason tooltips.
     - Expandable persona inspection card detailing use cases, purchasing constraints, priorities, and access channels.
     - Explicit panel lock disclaimer: *"When a simulation run begins, these exact 50 profiles are frozen with identical IDs and traits across both options."*

### Phase 3: Real Groq LLM Evaluation Engine, Access Gating & Run Recovery
- **Status:** `COMPLETED & VERIFIED`
- **Key Deliverables:**
  1. **Groq Evaluator Engine (`server/src/simulation/groqEvaluator.ts`)**:
     - Evaluates Option A and Option B independently across the frozen 50 profiles (total 100 evaluation records).
     - **Deterministic access pre-gating**: Profiles in unserved markets are immediately recorded as `access_status: 'unserved'`, `response: 'unavailable'`, and explicit coverage reasons (e.g. `Market "Chennai Central" is outside "Option B" served markets (Bangalore Urban)`) with **zero** Groq API calls.
     - **Batching & Concurrency**: Served profiles are grouped into batches of 5–10 profiles per API request, executed with bounded concurrency (default 2 parallel batches) via `Promise.all` chunking.
     - **Timeouts & Exponential Retries**: 30-second `AbortSignal.timeout` per API request, exponential backoff (1s, 2s, 4s) with `retry-after` header extraction on HTTP 429 / 5xx errors.
     - **Zod Response Validation**: `GroqBatchEvaluationResponseSchema` validates structured JSON responses; rejects/repairs invalid response enums or missing profile IDs with bounded retries; never invents missing output.
     - **Partial Run Resumption**: Persists each batch immediately to SQLite `evaluations` table. Resuming or retrying an incomplete run evaluates strictly missing `(profile_id, option_id)` tuples without altering the frozen panel or re-evaluating completed profiles.
  2. **Database & Repository Persistence (`server/src/db/testRepository.ts`)**:
     - `createRun()`, `updateRun()`, `getRunById()`, `getLatestRunByTestId()` for simulation run lifecycle (`pending`, `running`, `completed`, `partial`, `failed`).
     - `saveEvaluations()`, `getEvaluationsByRunId()`, `getMissingEvaluations()` for evaluation records.
     - Extended SQLite `runs` table schema with `model_id`.
  3. **Server API Routes (`server/src/routes/runRoutes.ts`)**:
     - `GET /api/simulation/status` & `POST /api/simulation/smoke-test` — Reports Groq configuration state and executes smoke test.
     - `POST /api/tests/:id/run` — Freezes test draft and profiles, runs 100 evaluations (Option A & B).
     - `GET /api/tests/:id/runs/latest` & `GET /api/tests/:id/runs/:runId` — Retrieves run progress and evaluation records.
     - `POST /api/tests/:id/runs/:runId/retry` — Resumes incomplete runs targeting only missing profiles.
  4. **Frontend Workbench & Results UI**:
     - **Simulation Run Controller (`client/src/pages/SetupTestPage.tsx`)**: Run simulation action with live banner indicating state (`running`, `completed (100/100)`, `partial (X/100)`, `unconfigured`, `failed`), link to Results tab, and "Retry Incomplete" button.
     - **Results Workbench (`client/src/pages/ResultsPage.tsx`)**: Displays run metadata, model ID, response counts for Option A vs Option B, side-by-side 50-persona evaluation table with qualitative reasons, objections, factor tags, and "Retry Missing Evaluations" action.
     - **App Navigation (`client/src/App.tsx`)**: Manages shared `activeTestId` across tabs and navigates seamlessly to Results.
  5. **Automated Test Suite & Live Smoke Test Verification (`server/test/groqEvaluator.test.ts`)**:
     - 18 automated tests passing across `@droptest/shared` and `@droptest/server`.
     - Verifies schema validation, unconfigured smoke test behavior, deterministic access gating with zero model calls, and partial run tracking with clean retry resumption to 100 records.
     - Live Groq API key configured in server environment (`.env`) and verified working with `openai/gpt-oss-120b` via official `groq-sdk`.

---

## 3. Directory Map & Component Structure

```
DROP-T/
├── package.json               # Root monorepo workspace & orchestration scripts
├── built_status.md            # Living build & handoff document
├── README.md                  # Quick-start and command reference
├── DROPTEST_PRD.md            # Product Requirements Document
├── .env.example               # Example server environment configuration
│
├── shared/                    # Shared TypeScript library
│   ├── src/
│   │   ├── types.ts           # Domain entities, enums, interfaces (TestDraft, Profile, Run, Evaluation)
│   │   ├── validation.ts      # Zod runtime validation schemas (inc. GroqBatchEvaluationResponseSchema)
│   │   ├── finance.ts         # Deterministic financial scenario engine
│   │   ├── eligibility.ts     # Deterministic access status & panel stats engine
│   │   └── index.ts           # Exports
│   └── test/
│       └── shared.test.ts     # Unit tests for contracts, splits, math, and eligibility
│
├── server/                    # Express + SQLite Backend
│   ├── src/
│   │   ├── config.ts          # Server-only env & Groq model configuration
│   │   ├── simulation/
│   │   │   ├── profileGenerator.ts # 50-profile generator & domain traits matrix
│   │   │   └── groqEvaluator.ts    # Groq LLM batch evaluator, access gating & retry manager
│   │   ├── db/
│   │   │   ├── database.ts    # SQLite DatabaseSync connection wrapper
│   │   │   ├── migrations.ts  # DDL schema definitions & migrations (tests, profiles, runs, evaluations)
│   │   │   └── testRepository.ts # SQL queries for test drafts, profiles, runs, evaluations & feedback
│   │   ├── routes/
│   │   │   ├── testRoutes.ts  # Test CRUD & panel generation endpoints
│   │   │   ├── runRoutes.ts   # Simulation run, status, smoke test & retry endpoints
│   │   │   ├── uploadRoutes.ts# Multer file upload & delete endpoints
│   │   │   └── feedbackRoutes.ts # Public feedback submission & stats
│   │   ├── app.ts             # Express application setup & middleware
│   │   └── index.ts           # Server entrypoint (Port 3001)
│   └── test/
│       ├── server.test.ts     # In-memory SQLite API & repository tests
│       ├── profileGenerator.test.ts # 50-profile generator & eligibility tests
│       └── groqEvaluator.test.ts    # Groq evaluator, access gating & recovery tests
│
└── client/                    # Vite + React 19 Frontend
    ├── src/
    │   ├── config/
    │   │   └── templates.ts   # Editable domain presets & starter templates
    │   ├── components/
    │   │   ├── Navbar.tsx     # Workbench header with tab navigation & save state
    │   │   ├── Common/
    │   │   │   └── EmptyState.tsx # Actionable empty state component
    │   │   └── SetupTest/
    │   │       ├── DomainSelector.tsx       # 3 domain template selectors
    │   │       ├── AudienceLocationForm.tsx # 1-4 markets, 20/20 audience, budget
    │   │       ├── OfferingForm.tsx         # Baseline A & domain-specific fields
    │   │       ├── AlternativeBForm.tsx     # Option B diff & comparison lever
    │   │       ├── FinancialsForm.tsx       # Fixed/variable costs & scenarios
    │   │       ├── ProfileReviewPanel.tsx   # 50-persona preview & eligibility review
    │   │       └── AssumptionSummary.tsx    # 35% sticky assumption sidebar
    │   ├── pages/
    │   │   ├── SetupTestPage.tsx            # Complete interactive workbench with Run simulation trigger
    │   │   ├── ResultsPage.tsx              # Results workbench & 50-persona evaluation matrix
    │   │   └── PublicFeedbackPage.tsx       # Public feedback shell & empty state
    │   ├── styles/
    │   │   ├── tokens.css     # CSS custom properties (colors, typography, spacing)
    │   │   └── main.css       # Research workbench layout & utility classes
    │   ├── App.tsx            # Top-level state, shared activeTestId & tab router
    │   └── main.tsx           # React DOM root
    ├── index.html
    └── vite.config.ts         # Vite configuration with API proxy to port 3001
```

---

## 4. How to Run, Test, and Build

```bash
# 1. Install dependencies across all workspaces
npm install

# 2. Run all unit, database, and simulation tests (18 passing)
npm test

# 3. Build all packages (shared, server, client)
npm run build

# 4. Start local development (Server on :3001, Client on :5173)
npm run dev
```

---

## 5. Next Steps for Phase 4 (Incoming Agent Handoff)

When starting Phase 4, implement the Deep Results & Decision Synthesis Dashboard:
1. **Decision Summary & Synthesis Engine**:
   - Compute top recommendation / decision card: Best next test, key simulated observation, dominant objection, missing evidence required before launch.
   - Paired A &rarr; B transition matrix (e.g. `unsure -> interested`, `not_interested -> unsure`, `interested -> unsure`).
   - Break-even vs simulated conversion comparison (mapping simulated demand against required units to avoid financial loss).
2. **Detailed Breakdown Views**:
   - Segment breakdowns (Intended 20, Adjacent 20, Contrasting 10) with exact denominators ($n / 20$, $n / 50$).
   - Market-by-market breakdown highlighting served vs unserved access barriers.
   - Persona drill-down drawer with full rationale, objection tags, and references to user's input fields.
3. **Evidence Strength & Uncertainty Badges**:
   - Distinguish high-confidence signals from sensitive/fragile assumptions.
   - Flag unserved markets where zero demand was due to distribution/access rather than offering flaws.
