# DROP-T MVP Verification & Judge Demo Guide

## 1. Quick Start & Execution Commands

### Prerequisites & Dependencies
```bash
# Install all workspace dependencies (root, server, client, shared)
npm install
```

### Idempotent Database Seeding
Seeds 4 test accounts and 2 realistic products with marked demo activity:
```bash
npm run seed
```

### Run Full Test Suite
Runs all 12 test suites (74 automated unit, integration, and e2e tests):
```bash
npm test
```

### Build Production Artifacts
```bash
npm run build
```

### Start Development Server
Starts Express backend on port `3001` and Vite client on port `5173`:
```bash
npm run dev
```
- Web Application: `http://localhost:5173`
- Backend API: `http://localhost:3001`

---

## 2. Environment Variables & Search Providers

Configure these in `server/.env` (or project root `.env`). **Never commit secrets**.

| Variable Name | Purpose | Required / Optional |
|---|---|---|
| `GROQ_API_KEY` | Powers LLM-based 50-persona simulation and Groq inference | Optional (Falls back to deterministic heuristic simulation engine if missing) |
| `BRAVE_SEARCH_API_KEY` | Primary external search provider for market research | Optional (Auto-cascades to Tavily / Serper / DuckDuckGo fallback) |
| `TAVILY_API_KEY` | Secondary search provider fallback | Optional |
| `SERPER_API_KEY` | Tertiary Google Search provider fallback | Optional |
| `PORT` | HTTP Server port (Defaults to `3001`) | Optional |
| `DATA_DIR` | SQLite storage directory (Defaults to `./data`) | Optional |
| `SESSION_SECRET` | JWT auth & session signing secret | Optional (Uses local fallback in dev) |

---

## 3. Demo Credentials (Idempotently Seeded)

All demo accounts share the password: `Password123!`

| Role | Email | Password | Name / Entity | Capabilities & Initial State |
|---|---|---|---|---|
| **Startup A** | `founder.a@droptest.local` | `Password123!` | Kavita Rao (*EcoHemp Labs*) | Owner of Product 1 (*Organic Hemp Everyday Summer Tee*). Can edit product, access Synthetic Lab & Automated Research, view incoming support proposals & feedback breakdown. |
| **Startup B** | `founder.b@droptest.local` | `Password123!` | Rohit Verma (*TerraBrew Innovations*) | Owner of Product 2 (*Artisanal Cold Brew Press*). Can offer support (₹) to Product 1, give feedback, manage own product lab. |
| **Sponsor** | `sponsor@droptest.local` | `Password123!` | Vikram Malhotra | Angel/ecosystem sponsor. Can offer support proposals (₹ amount + custom message) to products, give feedback, save products. |
| **User (Shopper)**| `shopper@droptest.local` | `Password123!` | Ananya Sharma | Everyday community consumer. Can save/unsave products, submit structured feedback (Yes/Maybe/No + factor + reason), cannot submit sponsor proposals. |

---

## 4. What Works (MVP Features)

1. **Role-Based Auth & Discovery Feed (`Stage 1`)**:
   - Explicit 3-way account selection (*Community Shopper*, *Ecosystem Sponsor*, *Startup Founder*).
   - Startup founders provide Startup Name & Description; shoppers/sponsors provide Display Name.
   - Realistic product catalog with category badges, material/sizing breakdown, price formatting, and dedicated public share URLs (`/products/:id`).
   - Only product owner can access edit draft/publish workflows.

2. **Saved Products & Structured Feedback (`Stage 2`)**:
   - Save/Unsave toggle dynamically updates counts and saves to the user's dedicated `/saved` collection.
   - Structured 1-response feedback per account per product (Yes/Maybe/No, Primary Buying Factor, Reason).
   - Editing an existing response updates distribution without artificially inflating respondent counts.
   - Founder-only feedback breakdown with verified respondent role tags.

3. **Support Proposals & Founder Inbox (`Stage 3`)**:
   - Sponsors & startups can submit support proposals with a positive amount (e.g. ₹500), currency (`INR`), and a note.
   - Enforces strict role gating: Regular shoppers cannot submit proposals; founders cannot submit proposals on their own products.
   - Submitting an updated proposal updates the existing record rather than creating duplicates.
   - Receiving founder gets a private, filtered Incoming Support Proposals Inbox (`/proposals/inbox`).

4. **Product-Linked Synthetic Lab (`Stage 4`)**:
   - Founders open the Lab directly from their product page (`/products/:id/lab`).
   - Defaults to single-product mode: 50 diverse buyer profiles (20 Intended / 20 Adjacent / 10 Contrasting).
   - Evaluates exactly 50 personas with price awareness, demographic fit, and private manufacturing cost considerations.
   - Optional A/B mode preserves paired 100-evaluation comparisons.
   - Missing public price enables a "Concept-Only Review" without blocking.

5. **Automated Search & Evidence-Backed Evaluation (`Stage 5`)**:
   - Automated search cascades through Brave -> Tavily -> Serper -> DuckDuckGo HTML scraping.
   - Extracts structured facts (Brand, Pricing, Key Features, Limitations) with source URLs and check dates.
   - Founder can select/deselect references (up to 5) or add manual URLs with context notes.
   - Selected competitor benchmarks are injected into each of the 50 persona simulation prompts, producing verifiable citations (`[Source 1]`, `[Source 2]`) in AI feedback.

---

## 5. What Is Intentionally Out of Scope / Unfinished

In accordance with [update_prd_v2.md](file:///d:/Workspace/temp/DROP-T/update_prd_v2.md):
- **No Real Payments / Escrow Gateway**: Proposals are structured offers of support (`Offer support`, `Proposed ₹500`, `Proposal sent`), never financial investments or transaction checkouts.
- **No Direct Real-time Chat**: Messages are attached directly to proposals.
- **No Gamification / Points / Discounts / Follow Graph**: Engagement is strictly focused on product validation and feedback.

---

## 6. 90-Second Judge Demo Script

### Scene 1: Community Feedback & Support (0s – 30s)
1. **Login as Shopper** (`shopper@droptest.local` / `Password123!`):
   - Open Explore Feed (`/explore`). Click on **"Organic Hemp Everyday Summer Tee"**.
   - Click **Save Product** (watch save badge increase).
   - In the Feedback section, select **"Yes, would buy"**, factor: **"Material & Quality"**, reason: *"Love sustainable hemp blend."* Click **Submit Feedback**.
2. **Switch to Sponsor** (`sponsor@droptest.local` / `Password123!`):
   - Open the same product page.
   - Click **"Offer Support"** in the sidebar. Enter `500` INR and message: *"Excited about this sustainable line. Let's discuss pilot batch distribution."*
   - Click **Send Proposal** & observe the instant confirmation badge.

### Scene 2: Founder Inbox & Live Feedback Breakdown (30s – 50s)
3. **Login as Startup Founder A** (`founder.a@droptest.local` / `Password123!`):
   - Open Product Page. See live feedback breakdown (100% Yes, Primary Factor: Material).
   - Click **"View Support Proposals (1)"** in navigation:
     - Review Vikram Malhotra's ₹500 proposal with complete timestamp and contact details.

### Scene 3: Automated Market Research & 50-Persona Simulation (50s – 90s)
4. **Launch Synthetic Lab**:
   - On the product page, click **"Open Synthetic Lab"**.
   - Scroll to **Automated Market Research**.
   - Click **"Search Competitors"** (system queries search providers or live web index).
   - View retrieved competitor products (e.g., competing organic bamboo/cotton tee brands with extracted pricing).
   - Confirm selected 3-5 reference benchmarks.
5. **Run Product Review**:
   - Click **"Run 50-Profile Simulation"**.
   - Watch the real-time progress bar process the 50 distinct personas (20 Intended, 20 Adjacent, 10 Contrasting).
   - Review executive scorecard: Overall Intent, Price Sensitivity, Segment Breakdown, and Persona quotes citing the searched competitor benchmarks.
