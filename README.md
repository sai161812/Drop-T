# DROPTEST

DROPTEST is a product-launch validation workbench and community for early-stage startup founders. Founders can publish product proposals, gather structured feedback from real community shoppers and sponsors, receive non-binding financial support proposals, and run deep AI simulations in the **Synthetic Lab**.

Simulated results evaluate willingness to pay and objections against 50 targeted synthetic consumer profiles powered by Llama 3.3 70B. Real community responses and simulated evaluations are strictly segregated.

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js**: 22.5 or newer (for native `node:sqlite` database support)
* **npm**: 10 or newer

### Setup & Run
```powershell
npm install
Copy-Item .env.example .env
# Set GROQ_API_KEY in .env for live LLM evaluations. (Optional: BRAVE_SEARCH_API_KEY / TAVILY_API_KEY / SERPER_API_KEY for market research)
npm run seed
npm run dev
```

* **Client**: [http://localhost:5173](http://localhost:5173) (Vite + React)
* **Server & API**: [http://localhost:3001](http://localhost:3001) (Express + SQLite)

### Test & Build
```powershell
# Run the complete test suite (Shared + Server integration tests):
npm test

# Verify production build compilation:
npm run build

# Run Playwright E2E acceptance tests:
npm run test:e2e
```

---

## 🧪 Synthetic Lab Architecture

The Synthetic Lab is a private founder workspace structured into 5 focused sections with a dedicated left-sidebar navigation:

1. **Overview & Evidence**:
   * Choose between **Single-Product Review** (50 targeted persona evaluations) or **A/B Comparison Mode** (100 paired evaluations).
   * Configure launch price verification (with fallback trial pricing if unpriced).
   * Automated live competitor search and citation selection (Brave / Tavily / Serper / DuckDuckGo).
2. **Product & Offering**:
   * Domain-specific schemas: Apparel, Food & Beverage, SaaS & Digital Products, or Custom.
   * Product specs, value propositions, key differentiators, fulfillment mode, and visual assets.
   * Variant B configuration when isolating a specific decision lever (Price, Positioning, Packaging, or Markets).
3. **Target Audience**:
   * **Intended Buyer Persona** and **Adjacent Buyer Persona** descriptions.
   * Expected consumer spend boundaries (`min` / `max`).
   * Serviceable geographic target markets.
4. **Unit Economics**:
   * Deterministic financial projections: Fixed launch costs, variable unit costs, and capacity.
   * Volume scenarios: Conservative, target, and optimistic volume modeling with exact break-even calculations.
5. **Simulation Panel**:
   * **50-Profile Panel Preview**: Deterministic allocation across Intended (40%), Adjacent (40%), and Contrasting (20%) consumer segments.
   * Seed-based determinism (`#12345`) ensuring exact reproducibility.
   * Simulation Readiness Checklist with live input validation.
   * Execution controls, live progress tracking, retry handlers for missing evaluations, and deep results breakdown.

---

## 👥 Demo Accounts

The database comes pre-seeded with 4 default test accounts (Password: `Password123!`):

| Role | Email | Capabilities |
| --- | --- | --- |
| **Startup Founder A** | `founder.a@droptest.local` | Publish products, run Synthetic Lab, receive feedback & support |
| **Startup Founder B** | `founder.b@droptest.local` | Publish products, run Synthetic Lab, submit cross-startup support |
| **Investor / Sponsor** | `sponsor@droptest.local` | Explore feed, save products, submit feedback & support proposals |
| **Community User** | `shopper@droptest.local` | Explore feed, save products, submit structured buyer feedback |

---

## 🗺️ Application Routes

| View | Route | Access |
| --- | --- | --- |
| **Landing Page** | `/` | Public |
| **Explore Products** | `/explore` | Public / All roles |
| **Product Detail** | `/product/:id` | Public / All roles |
| **Saved Products** | `/saved` | Authenticated users |
| **Publish / Edit** | `/publish` or `/publish?edit=:id` | Startup founders |
| **My Products** | `/my-products` | Startup founders |
| **Synthetic Lab** | `/lab?product=:id` | Product owner only |
| **Simulation Results** | `/results?test=:id` | Product owner only |
| **Public Feedback** | `/feedback/:token` | Link recipients (Anonymous / Auth) |

---

## 🔒 Verification & Boundaries

* **Simulated Personas**: Exactly 50 profiles are evaluated per single review. They simulate objections and willingness to pay based on defined constraints and live competitor reference claims.
* **Separation of Evidence**: AI persona simulations and real human community feedback are strictly isolated in storage and analysis.
* **Deterministic Financials**: Margins, break-evens, and scenario revenues are calculated strictly via deterministic arithmetic.
* **Non-Binding Support**: Sponsorships and support proposals represent non-binding interest (no financial transaction or escrow).
