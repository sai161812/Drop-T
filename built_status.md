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
  - **Shared Layer:** Domain models, TypeScript interfaces, Zod runtime validation schemas, deterministic finance engine.
  - **AI Integration (Server-Only):** Groq SDK configured via server `.env` (zero client-side exposure).

---

## 2. Phase-by-Phase Progress

### Phase 0: Foundation, Persistence, Contracts & Research Workbench Shell
- **Status:** `COMPLETED & VERIFIED` (Local commit: `272d662`)
- **Key Deliverables:**
  1. **Locked Domain Contracts & Enums (`shared/src/types.ts` & `shared/src/validation.ts`)**:
     - 3 Working Domains: `'clothing_accessories'`, `'local_food_beverages'`, `'digital_products_services'`
     - Option IDs: `'A'` (Baseline), `'B'` (Alternative)
     - Primary Levers: `'price'`, `'message'`, `'served_markets'`, `'creative'`
     - Response Categories: `'interested'`, `'unsure'`, `'not_interested'`, `'unavailable'`
     - Fixed 50-Profile Split: 20 intended (40%), 20 adjacent (40%), 10 contrasting (20%) = 50 total profiles (100 evaluations across A & B)
     - Single currency and period per test
     - Deterministic location access gating: unserved markets marked `unavailable`
     - Runtime validation with Zod enforcing text lengths, numerical limits, image metadata (max 5MB, PNG/JPEG/WEBP), and 1–4 audience markets
  2. **Deterministic Financial Scenario Engine (`shared/src/finance.ts`)**:
     - Calculates contribution per sale ($P - C$), break-even units ($\lceil F / (P - C) \rceil$), capacity constraints ($M$), and user-entered scenario profits ($Q \times (P - C) - F$)
  3. **SQLite Database & Repository (`server/src/db/`)**:
     - Tables: `tests`, `offerings`, `options`, `audience_configs`, `profiles`, `runs`, `evaluations`, `human_responses`
     - Foreign key integrity, WAL mode, cascading deletes
  4. **Backend REST APIs (`server/src/routes/`)**:
     - `GET /api/health` — Health check & configured Groq models
     - `GET /api/tests` — List test drafts
     - `GET /api/tests/:id` — Retrieve test draft with options and audience configuration
     - `POST /api/tests` — Save / update test draft with Zod validation
     - `POST /api/upload` — Multipart image upload with MIME & size validation
     - `GET /api/feedback/:testId` — Public view of Option A & Option B (no simulated data)
     - `POST /api/feedback/:testId` — Submit real human feedback
     - `GET /api/feedback/:testId/stats` — Retrieve human feedback stats
  5. **Desktop Research Workbench UI (`client/src/`)**:
     - 2-Column layout: 65% intake column (Domain Template &rarr; Audience & Location &rarr; Core Offering Baseline A &rarr; Alternative B Diff &rarr; Financial Scenarios) and 35% sticky assumption panel (20/20/10 split preview, market coverage counts, diff overview, missing inputs checklist, Run action).
     - Actionable empty states on `Results` and `Public feedback` pages.
     - Centralized editable presets (`client/src/config/templates.ts`) with quick-action buttons for Apparel, Food & Beverage, Digital SaaS, and Clear Form.
     - Custom design tokens in `client/src/styles/tokens.css` with tabular figures and restrained styling.

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
│   │   └── index.ts           # Exports
│   └── test/
│       └── shared.test.ts     # Unit tests for contracts, splits, and math
│
├── server/                    # Express + SQLite Backend
│   ├── src/
│   │   ├── config.ts          # Server-only env & Groq model configuration
│   │   ├── db/
│   │   │   ├── database.ts    # SQLite DatabaseSync connection wrapper
│   │   │   ├── migrations.ts  # DDL schema definitions & migrations
│   │   │   └── testRepository.ts # SQL queries for test drafts & feedback
│   │   ├── routes/
│   │   │   ├── testRoutes.ts  # Test CRUD endpoints
│   │   │   ├── uploadRoutes.ts# Multer file upload endpoint
│   │   │   └── feedbackRoutes.ts # Public feedback submission & stats
│   │   ├── app.ts             # Express application setup & middleware
│   │   └── index.ts           # Server entrypoint (Port 3001)
│   └── test/
│       └── server.test.ts     # In-memory SQLite API & repository tests
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

# 2. Run all unit and database tests
npm test

# 3. Build all packages (shared, server, client)
npm run build

# 4. Start local development (Server on :3001, Client on :5173)
npm run dev
```

---

## 5. Next Steps for Phase 1 (Incoming Agent Handoff)

When starting Phase 1, build upon the locked models and persistence:
1. **Profile Generation (`server/src/simulation/profileGenerator.ts`)**:
   - Deterministic 50-persona matrix generation (20 intended, 20 adjacent, 10 contrasting) spread across the configured 1–4 audience markets.
   - Assign stable profile IDs (`prof_01` .. `prof_50`).
2. **Groq Evaluation Engine (`server/src/simulation/groqEvaluator.ts`)**:
   - Evaluate Option A and Option B across the same 50 profiles in batches (5–10 per call).
   - Deterministic access gate: unserved profiles are immediately marked `unavailable` without calling the model.
   - Structured JSON response parsing into `evaluations` table.
   - Bounded retries for rate limits (`429`).
3. **Results UI (`client/src/pages/ResultsPage.tsx`)**:
   - Decision card at top (best next test, key observation with denominator, main objection, missing evidence).
   - Paired A &rarr; B transition matrix.
   - Audience segment & market breakdowns.
   - Persona inspection drawer.
4. **Public Feedback Sharing (`client/src/pages/PublicFeedbackPage.tsx`)**:
   - Render public A vs B comparison page with voting controls (A, B, neither, unsure + optional reason).
