# DROPTEST — AI-Assisted Launch Decision Workspace

> **Product Type:** AI-assisted launch decision workbench for first-time sellers, creators, and early founders.  
> **Core Question:** *"What should I change or test before I commit money to this launch?"*

DROPTEST surfaces hypotheses, trade-offs, and critical friction before money is committed to inventory, production, or ads. It compares a baseline offering (**Option A**) against one alternative (**Option B**) across **50 distinct, reproducible buyer personas** (20 intended / 20 adjacent / 10 contrasting) and provides a shareable public feedback link to collect anonymous real-person responses separately.

---

## 1. Quick Start & Setup Commands

### Prerequisites
- **Node.js:** v22.5+ or v24+ (uses native built-in `node:sqlite` — zero native compilation dependencies)
- **npm:** v10+

### Environment Configuration
Create a `.env` file in the project root or in `server/.env`:
```env
PORT=3001
NODE_ENV=development
DATA_DIR=./data
UPLOAD_DIR=./uploads
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_VISION_MODEL=openai/gpt-oss-20b
GROQ_TEMPERATURE=0.2
GROQ_MAX_RETRIES=3
```

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
# Starts both Express backend (localhost:3001) and Vite client (localhost:5173)
npm run dev
```

### Run Full Test Suite
```bash
# Runs all 38 unit and integration tests across @droptest/shared and @droptest/server
npm test
```

### Production Build
```bash
npm run build
```

---

## 2. Localhost Links

- **Research Workbench (Client UI):** [http://localhost:5173/](http://localhost:5173/)
- **Backend API & Server:** [http://localhost:3001/](http://localhost:3001/)
  - Health Check: `GET http://localhost:3001/api/health`
  - Public Feedback Endpoint: `GET http://localhost:3001/api/feedback/:token`

---

## 3. Architecture in a Few Lines

- **Frontend (`client/`):** React 19 + TypeScript + Vite. Desktop-first 2-column research workbench with custom CSS design tokens, tabular numerals, accessible inputs, and standalone public feedback view (`/feedback/:token`).
- **Backend (`server/`):** Express + TypeScript + Node native `node:sqlite`. Manages atomic persistence (`droptest.sqlite`), image uploads, Groq LLM batch evaluation with bounded concurrency (default 2) and exponential backoff retry manager, and anonymous human response storage.
- **Shared Domain Layer (`shared/`):** Shared TypeScript contracts, Zod runtime schemas, deterministic 50-persona eligibility engine, comparison analysis synthesizer, and deterministic break-even finance calculation engine.

---

## 4. Actual Working Features (Phases 0–6)

1. **Working Domain Presets:**
   - **Clothing & Accessories:** Sizes, materials, unit production cost, image uploads with confirmed visual descriptions.
   - **Local Food & Beverages:** Portion, availability window, allergens, pickup vs doorstep delivery modes.
   - **Digital Products & Services:** Core use cases, supported platforms/languages, and first-period subscription calculations.
2. **Single Comparison Lever (A &rarr; B):**
   - Isolate and test exactly one primary lever: `price`, `message`, `served_markets`, or `creative`.
3. **50-Profile Panel & Deterministic Access Gating:**
   - Exact 20 intended / 20 adjacent / 10 contrasting distribution across 1–4 user-entered audience markets.
   - Budget bands derived strictly from user's expected spend range (independent of candidate prices).
   - Unserved markets are deterministically marked `unavailable` with explicit coverage reasons (zero Groq calls).
4. **Groq LLM Simulation & Incomplete Run Recovery:**
   - Server-side Groq evaluation executed in 5–10 persona batches.
   - Resilient retry resumption: retries only missing evaluations without altering the frozen 50-persona panel.
5. **Comparison Analysis & Synthesis:**
   - Exact A/B single-lever diff banner with linked unit cost variance disclosures.
   - Response rates with visible denominators ($n/50$ total, $n/\text{eligible}$).
   - 4x4 paired response transition matrix and net interest shift calculation.
   - 50-persona inspectable response rows with keyword search and trait drawers.
   - Top **Decision Card** recommending practical next tests rather than promises of success.
6. **Deterministic Financial Scenarios:**
   - Contribution margin ($P - C$), break-even units $\lceil F / (P - C) \rceil$, zero fixed cost handling, and capacity limit alerts.
   - User-entered sales volume scenarios ($Q$): revenue $Q \times P$, variable cost $Q \times C$, net $Q \times (P - C) - F$.
   - Explicit missing-cost guidance when financial inputs are omitted.
7. **Public Shareable Feedback & Real-Person Validation:**
   - Unguessable feedback link (`/feedback/:token`) serving an unguided comparison asking *"Which would you consider?"* with choices `A`, `B`, `neither`, `unsure` and optional short reason.
   - Strictly anonymous (zero names, email addresses, or phone numbers collected).
   - Zero simulated data leakage on public endpoints.
   - Dedicated "Responses from real people" section with its own distinct denominator, response quotes, and embedded SVG QR code.

---

## 5. 90-Second Demo Path

1. **Step 1 — Setup Test:**
   - Open `http://localhost:5173/`. Click the **Clothing & Accessories** preset.
   - Inspect baseline Option A (₹699) vs Alternative B (₹899), fixed cost ₹6,000, variable unit cost ₹350.
   - Inspect the **50-Profile Review Panel** showing 20 intended, 20 adjacent, 10 contrasting buyer personas.
2. **Step 2 — Run Simulation:**
   - Click **"Run 50 simulated profiles"**.
   - Watch the live progress banner complete 100 paired evaluations via Groq.
3. **Step 3 — Review Results & Decision Card:**
   - Click **"View Results Workbench"**.
   - Review the Top Decision Card with the key observation (with denominators), leading objection, and break-even comparison (18 units for ₹699 vs 11 units for ₹899).
   - Inspect the 4x4 transition matrix and explore individual persona responses.
4. **Step 4 — Test Real-Person Validation:**
   - Scroll to **"Responses from real people"**. Click **"Open Link"** or scan the SVG QR code from a separate browser window.
   - Submit an anonymous vote (e.g. Option A + reason).
   - Refresh the results dashboard to observe the response recorded under real human feedback with its own denominator ($1/1$), completely separated from simulated profiles.

---

## 6. Model Details & Reproduction

- **Evaluator Model:** `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile`) via official `groq-sdk`.
- **Response Format:** Schema-constrained JSON mode with server-side Zod validation (`GroqBatchEvaluationResponseSchema`).
- **Temperature:** `0.2` (for stable, deterministic persona evaluations).
- **Concurrency:** 2 parallel batches of 5 profiles per API request.

---

## 7. Limitations & Honest Boundaries

- **Simulated Personas are Not Real Buyers:** 50 simulated profiles represent diverse perspectives, constraints, and questions worth checking. They do not predict real-world conversion, market demand, or population reach.
- **Convenience Sample Real Feedback:** Real feedback collected from public links represents a convenience sample of whoever received the link. Do not apply statistical confidence or population claims.
- **Digital Subscriptions:** Financial calculations apply strictly to the **first billing period only**; customer lifetime value, churn rates, or retention are never invented.
- **Location Coverage:** Market labels are categorical coverage checks supplied by the user, not real-time GPS distances or verified travel times.
