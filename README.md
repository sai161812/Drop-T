# DROPTEST — AI-Assisted Launch Decision Workspace

> **Phase 0:** Research workbench shell, typed domain models, built-in SQLite persistence, shared validation schemas, and deterministic financial calculation engine.

DROPTEST helps first-time sellers, creators, and early founders evaluate launch decisions by comparing baseline and alternative options across 50 stable simulated profiles and collecting separate real-person feedback.

---

## 1. Quick Start

### Prerequisites
- **Node.js:** v22.5+ or v24+ (uses native built-in `node:sqlite` — zero native compilation dependencies)
- **npm:** v10+

### Setup Environment
```bash
# Copy example env file
cp .env.example .env
```

### Install Dependencies
```bash
npm install
```

---

## 2. Development & Test Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Starts both backend API server (`localhost:3001`) and Vite frontend (`localhost:5173`) concurrently |
| `npm test` | Runs the full automated test suite (validation schemas, panel constraints, deterministic finance, server repository) |
| `npm run build` | Compiles TypeScript across `@droptest/shared`, `@droptest/server`, and `@droptest/client` |
| `npm start` | Runs the production backend server |

---

## 3. Architecture Overview

- **Frontend (`client/`):** Vite + React 19 + TypeScript.
  - Desktop-first research workbench with 2-column layout (65% task intake, 35% sticky assumption panel).
  - Custom CSS tokens for surfaces, restrained slate accents, and tabular figures.
  - Routes / page states for `Set up test`, `Results` (actionable empty state), and `Public feedback` (actionable empty state).
- **Backend (`server/`):** Express + TypeScript + `node:sqlite`.
  - Server-only Groq configuration and key handling (zero client-side exposure).
  - Multipart image upload with strict type (PNG, JPEG, WEBP, GIF) and 5MB size limits.
  - REST endpoints for test drafts, uploads, and human feedback.
- **Shared Contracts (`shared/`):**
  - Typed domain models (`Test`, `Offering`, `Option`, `AudienceConfig`, `Profile`, `Run`, `Evaluation`, `HumanResponse`).
  - Strict Zod validation schemas for text lengths, numerical bounds, image metadata, and list invariants.
  - Deterministic financial calculation engine per PRD Section 8.
- **Persistence (`server/src/db/`):**
  - SQLite with foreign key enforcement and WAL mode.
  - Tables: `tests`, `offerings`, `options`, `audience_configs`, `profiles`, `runs`, `evaluations`, `human_responses`.

---

## 4. Locked Phase 0 Contracts

- **3 Domain IDs:** `clothing_accessories`, `local_food_beverages`, `digital_products_services`.
- **Option IDs:** `A` (Baseline), `B` (Alternative).
- **Primary Levers:** `price`, `message`, `served_markets`, `creative`.
- **Response Categories:** `interested`, `unsure`, `not_interested`, `unavailable`.
- **Audience Segments:** `intended` (20), `adjacent` (20), `contrasting` (10) — exactly 50 distinct profiles per test.
- **Deterministic Access Gate:** Profiles in unserved markets are marked `unavailable` with explicit coverage reasons.
