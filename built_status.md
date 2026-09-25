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
- **Deliverables:**
  - Initial scaffolding, locked domain contracts, SQLite migrations, Zod validation schemas, deterministic finance engine, base test suites.

### Phase 1: "Set up test" Screen & Durable Draft Persistence
- **Status:** `COMPLETED & VERIFIED`
- **Key Deliverables:**
  1. **First Fold Guidance & Research Hierarchy**:
     - Concise guidance banner explaining the 5 intake steps and the 50-persona simulated panel.
     - Saved Drafts Switcher dropdown with durable rehydration from SQLite.
     - Quick Starter Presets bar: one-click loading for Apparel, Food & Beverage, Digital SaaS, and Clear Form.
  2. **Domain-Tailored Intake Forms**:
     - `clothing_accessories`: Item type, material composition, sizes, unit production cost, shipping details.
     - `local_food_beverages`: Item name, portion size, ingredients/allergens, pickup/delivery mode, availability window, unit preparation cost.
     - `digital_products_services`: Core use case, platform & language compatibility, pricing model (one-time vs recurring subscription for first-period calculation), support availability.
     - Displays strictly relevant tailored fields per selected domain.
  3. **0–3 Image / Screenshot Management**:
     - Local multipart uploads via `/api/upload` (and deletion via `/api/upload/:filename`).
     - Image cards with formatted file sizes (KB/MB), thumbnail preview, accessible removal button (`aria-label="Remove image"`).
     - Confirmed visual description textarea for each image with honest disclaimer: *"Image attached; describe what it shows for the simulation."*
     - Enforced mandatory confirmed description when the creative lever is selected.
  4. **Audience & Location Configuration**:
     - Character count trackers on Intended (20 personas) and Adjacent (20 personas) buyer descriptions.
     - Expected spend range min and max with validation ($min \le max$).
     - 1–4 user-named audience markets with inline add/remove controls.
  5. **Option B Alternative & Single-Lever Diff Engine**:
     - Lever selector: `price`, `message`, `served_markets`, `creative`.
     - Exact A &rarr; B diff summary banner displaying all changed fields.
     - Linked cost change detector (discloses any per-sale unit cost variance as an explicit finance change).
     - Option B image uploads and confirmed visual descriptions when testing creative.
  6. **Deterministic Financial Scenarios (PRD Section 8)**:
     - Fixed launch cost, variable cost per sale, capacity ceiling, accounting period.
     - 3 user-entered unit scenarios (lower, central, higher).
     - Real-time break-even units $\lceil F / (P - C) \rceil$ and net scenario calculation.
     - Explicit missing-field disclosures when cost inputs are omitted.
  7. **Assumption Summary & Simulation Readiness Gate**:
     - 20/20/10 visual segment bar with exact counts (20 intended / 20 adjacent / 10 contrasting).
     - Reachable market coverage breakdown (Option A vs Option B).
     - Missing requirements checklist; Run button disabled with explicit reason until all mandatory fields are valid.
  8. **Responsive 1440px & 390px Styling**:
     - Desktop (1440px): 2-column research workbench with sticky assumption sidebar.
     - Mobile (390px): Single-column task order, $\ge 44\text{px}$ touch targets, zero horizontal overflow.
  9. **Backend Draft CRUD APIs**:
     - `POST /api/tests` — Save / update draft test.
     - `GET /api/tests/:id` — Retrieve test draft by ID.
     - `GET /api/tests` — List all saved drafts.
     - `DELETE /api/tests/:id` — Delete saved test draft.
     - `POST /api/upload` & `DELETE /api/upload/:filename` — Manage local images.

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
│   │   │   ├── testRoutes.ts  # Test CRUD endpoints (GET, POST, DELETE)
│   │   │   ├── uploadRoutes.ts# Multer file upload & delete endpoints
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

# 2. Run all unit and database tests (8 passing)
npm test

# 3. Build all packages (shared, server, client)
npm run build

# 4. Start local development (Server on :3001, Client on :5173)
npm run dev
```

---

## 5. Next Steps for Phase 2 (Incoming Agent Handoff)

When starting Phase 2, implement the Simulation Engine and Results Dashboard:
1. **Profile Generation Engine (`server/src/simulation/profileGenerator.ts`)**:
   - Deterministic 50-persona matrix generation (20 intended, 20 adjacent, 10 contrasting) spread across configured audience markets.
   - Assign stable IDs (`prof_01` .. `prof_50`).
   - Store profile snapshot with the run.
2. **Groq Evaluation Engine (`server/src/simulation/groqEvaluator.ts`)**:
   - Evaluate Option A and Option B across the same 50 profiles in batches (5–10 per request).
   - Deterministic access gate: unserved profiles are immediately recorded as `unavailable` with reason, without calling the LLM.
   - Parse structured output (`interested`, `unsure`, `not_interested`) with qualitative reason and primary objection.
   - Bounded retries on rate limits (`429`) and partial run resumption.
3. **Results UI (`client/src/pages/ResultsPage.tsx`)**:
   - Top decision card (best next test, key simulated observation, main objection, missing evidence).
   - Paired A &rarr; B transition matrix.
   - Segment & market breakdowns with visible denominators.
   - Inspectable individual persona response drawer.
