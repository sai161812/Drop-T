# DROPTEST v2 Codebase Inventory & Migration Baseline

## 1. Existing System Stack & Capabilities
- **Monorepo:** npm workspaces (`@droptest/shared`, `@droptest/server`, `@droptest/client`).
- **Backend:** Node.js (ESM), Express 4, `node:sqlite` (WAL, foreign keys), `groq-sdk`, `multer`.
- **Frontend:** React 19, TypeScript, Vite 6, `lucide-react`, pure CSS token styling (`index.css`).
- **Shared Contracts:** `@droptest/shared` (Zod schemas, types, finance math, analysis engine).
- **Tests:** 46 automated tests passing across shared and server suites.

## 2. Reusable Existing Assets
- **50-Profile Panel (`profileGenerator.ts`):** Exactly 50 personas (20 intended / 20 adjacent / 10 contrasting) with budget bands independent of prices and market eligibility.
- **Groq LLM Evaluator (`groqEvaluator.ts`):** Server-side batching (5 personas), bounded concurrency (2), 429 exponential backoff, JSON schema validation.
- **Image Upload Pipeline (`uploadRoutes.ts`):** Multer handling with magic-byte validation, SHA-256 metadata, static serving `/uploads/:filename`.
- **Finance Engine (`finance.ts`):** Single & comparative contribution margin ($P - C$), break-even units $\lceil F / (P - C) \rceil$.

## 3. Assumptions of Two Options (A/B) to Generalize for v2
- `groqEvaluator.ts`: Currently hardcoded to evaluate `[A, B]` (100 evaluations). Generalized to `mode: 'single'` (50 evaluations default for 1 product) and `'comparison'` (100 evaluations).
- `runs` table & `testRepository.ts`: `total_evaluations_expected` updated to 50 for single mode.
- `analysis.ts`: Add single-product report synthesis (50 profile breakdown, leading objection, financial break-even) alongside paired comparison view.

## 4. Search Provider for Comparable Product Research (Section 6)
- **Integration:** Lightweight server-side search provider client.
- **Provider & Credential:**
  - Primary: Tavily Search API (`TAVILY_API_KEY`) or Brave Search API (`BRAVE_SEARCH_API_KEY`) / Google Custom Search (`SEARCH_API_KEY`).
  - Environment Variable: `SEARCH_API_KEY` (or `TAVILY_API_KEY`).
  - Fallback / Offline Mode: If search API key is unconfigured or search fails, the private lab reports search as unconfigured/unavailable while allowing manual founder competitor references and "Continue without research".

## 5. Precise Database & Route Changes for v2

### New SQLite Tables:
1. `users` (`id`, `email`, `password_hash`, `role`, `display_name`, `startup_name`, `startup_description`, `created_at`)
2. `sessions` (`token`, `user_id`, `expires_at`, `created_at`)
3. `products` (`id`, `owner_id`, `name`, `category`, `stage`, `summary`, `intended_buyer`, `feedback_question`, `price`, `currency`, `availability_markets`, `fulfillment_mode`, `images`, `category_data`, `status`, `created_at`, `updated_at`)
4. `product_saves` (`id`, `user_id`, `product_id`, `created_at`, UNIQUE `(user_id, product_id)`)
5. `product_feedback` (`id`, `author_id`, `product_id`, `choice`, `factor`, `reason`, timestamps, UNIQUE `(author_id, product_id)`)
6. `support_proposals` (`id`, `sender_id`, `product_id`, `recipient_id`, `amount`, `currency`, `message`, timestamps, UNIQUE `(sender_id, product_id)`)
7. `competitor_references` (`id`, `product_id`, `query`, `title`, `url`, `domain`, `snippet_or_fact`, `source_type`, `selected`, `date_checked`)
8. Schema updates on `tests`/`runs`: `product_id TEXT REFERENCES products(id)`, `mode TEXT NOT NULL DEFAULT 'single'`.

### New / Updated API Routes:
- **Auth:** `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`
- **Products:** `GET /api/products` (feed), `POST /api/products` (draft/publish), `GET /api/products/:id`, `PUT /api/products/:id`, `GET /api/products/my`
- **Engagement:** `POST /api/products/:id/save` (toggle), `GET /api/products/saved`, `POST /api/products/:id/feedback`, `GET /api/products/:id/feedback`
- **Support:** `POST /api/products/:id/support`, `GET /api/products/my/proposals`
- **Research & Lab:** `POST /api/products/:id/research`, `POST /api/products/:id/lab/run`, `GET /api/products/:id/lab/results`

## 6. Shortest Path to Stage 1 Vertical Slice
1. Add `users` & `sessions` tables in migrations with deterministic password hashing (`node:crypto.scryptSync`).
2. Implement `authRoutes.ts` (`/signup`, `/signin`, `/signout`, `/me`) and auth middleware enforcing session tokens and user roles.
3. Seed 4 standard demo accounts (`user`, `sponsor`, `startup A`, `startup B`) idempotently.
4. Add client auth context, Sign In / Sign Up modal or page with the 3 role selector cards, and current user header badge.
