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
  - 35% sticky assumption sidebar and validation readiness gate.

### Phase 2: 50-Profile Builder, Deterministic Eligibility Engine & UI Review Panel
- **Status:** `COMPLETED & VERIFIED`
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
  6. **Automated Test Suite (`server/test/profileGenerator.test.ts`)**:
     - 14 automated tests passing across `@droptest/shared` and `@droptest/server`.
     - Verifies 50 profile count, 20/20/10 split, stable IDs, budget independence, deterministic coverage transitions, attribute uniqueness, and domain drafts (Clothing, Food, SaaS).

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
│   │   ├── types.ts           # Domain entities, enums, interfaces
│   │   ├── validation.ts      # Zod runtime validation schemas
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
│   │   │   └── profileGenerator.ts # 50-profile generator & domain traits matrix
│   │   ├── db/
│   │   │   ├── database.ts    # SQLite DatabaseSync connection wrapper
│   │   │   ├── migrations.ts  # DDL schema definitions & migrations
│   │   │   └── testRepository.ts # SQL queries for test drafts, profiles & feedback
│   │   ├── routes/
│   │   │   ├── testRoutes.ts  # Test CRUD & panel generation endpoints
│   │   │   ├── uploadRoutes.ts# Multer file upload & delete endpoints
│   │   │   └── feedbackRoutes.ts # Public feedback submission & stats
│   │   ├── app.ts             # Express application setup & middleware
│   │   └── index.ts           # Server entrypoint (Port 3001)
│   └── test/
│       ├── server.test.ts     # In-memory SQLite API & repository tests
│       └── profileGenerator.test.ts # 50-profile generator & eligibility tests
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
    │   │   ├── SetupTestPage.tsx            # Complete interactive workbench
    │   │   ├── ResultsPage.tsx              # Results shell & actionable empty state
    │   │   └── PublicFeedbackPage.tsx       # Public feedback shell & empty state
    │   ├── styles/
    │   │   ├── tokens.css     # CSS custom properties (colors, typography, spacing)
    │   │   └── main.css       # Research workbench layout & utility classes
    │   ├── App.tsx            # Top-level state & tab router
    │   └── main.tsx           # React DOM root
    ├── index.html
    └── vite.config.ts         # Vite configuration with API proxy to port 3001
```

---

## 4. How to Run, Test, and Build

```bash
# 1. Install dependencies across all workspaces
npm install

# 2. Run all unit, database, and simulation tests (14 passing)
npm test

# 3. Build all packages (shared, server, client)
npm run build

# 4. Start local development (Server on :3001, Client on :5173)
npm run dev
```

---

## 5. Next Steps for Phase 3 (Incoming Agent Handoff)

When starting Phase 3, implement the LLM Simulation Runner and Results Dashboard:
1. **Groq LLM Evaluation Engine (`server/src/simulation/groqEvaluator.ts`)**:
   - Evaluate Option A and Option B across the frozen 50 profiles in batches (5–10 per request).
   - Deterministic access gate: profiles in unserved markets are immediately recorded as `unavailable` with explicit coverage reasons, skipping LLM calls.
   - For served profiles, call Groq model using structured JSON prompt (`interested`, `unsure`, `not_interested`) with qualitative reason, primary objection, factor tags, and referenced input fields.
   - Bounded retries on rate limits (`429`) with exponential backoff and partial run resumption.
2. **Simulation Run Controller (`server/src/routes/runRoutes.ts`)**:
   - `POST /api/tests/:id/run` — Freeze test & profiles, initiate simulation run, execute 100 evaluations.
   - `GET /api/tests/:id/runs/:runId` — Poll run progress (evaluations completed / 100).
3. **Results UI (`client/src/pages/ResultsPage.tsx`)**:
   - Top decision card (best next test, key simulated observation, main objection, missing evidence).
   - Paired A &rarr; B transition matrix (e.g. Unsure &rarr; Interested, Not Interested &rarr; Unsure).
   - Segment & market breakdowns with visible denominators ($n / 20$, $n / 50$).
   - Inspectable persona response drawer with full reasoning and objection tags.
