# DROPTEST

DROPTEST helps early-stage founders pressure-test a product idea before launch. It combines a public product-discovery community with a private Synthetic Lab that evaluates an offering against targeted AI-generated buyer profiles.

The platform keeps two kinds of evidence distinct:

- **Community feedback** — responses, saves, and non-binding support proposals from people using the product.
- **Synthetic research** — repeatable AI persona evaluations, competitor context, and unit-economics scenarios for founders.

> Synthetic Lab outputs are decision-support signals, not real customer feedback or financial advice.

## What it does

- Publish product proposals and make them discoverable in a public feed.
- Collect structured buyer feedback and non-binding sponsor/support interest.
- Save products and manage founder-owned listings.
- Run a private single-product review across 50 targeted synthetic personas.
- Compare two variants while changing one decision lever: price, positioning, packaging, or market.
- Model margins, break-even volume, and conservative, target, and optimistic scenarios.
- Research comparable products using optional search providers and preserve the supporting references.

## Stack

| Layer | Technology |
| --- | --- |
| Web app | React 19, TypeScript, Vite |
| API | Express, TypeScript |
| Data | SQLite on the application filesystem |
| AI evaluation | Groq-compatible models |
| Tests | Node test runner, Playwright |

## Run locally

### Prerequisites

- Node.js 24.x
- npm 10+

### Setup

```powershell
git clone https://github.com/sai161812/Drop-T.git
Set-Location Drop-T
npm install
Copy-Item .env.example .env
```

Add `GROQ_API_KEY` to `.env` to run live Synthetic Lab evaluations. The rest of the application works without it. Search-provider keys (`BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`, or `SERPER_API_KEY`) are optional.

```powershell
npm run seed
npm run dev
```

Open the app at `http://localhost:5173`. The API runs at `http://localhost:3001`.

## Demo accounts

Seeding creates the following accounts. All use the password `Password123!`.

| Role | Email | Use case |
| --- | --- | --- |
| Founder A | `founder.a@droptest.local` | Publish and run a lab review |
| Founder B | `founder.b@droptest.local` | Publish and submit cross-startup support |
| Sponsor | `sponsor@droptest.local` | Explore, save, and make support proposals |
| Shopper | `shopper@droptest.local` | Explore and submit buyer feedback |

## Core routes

| Area | Route | Access |
| --- | --- | --- |
| Explore | `/explore` | Public |
| Product detail | `/product/:id` | Public |
| Publish or edit | `/publish` | Founders |
| My products | `/my-products` | Founders |
| Synthetic Lab | `/lab?product=:id` | Product owner |
| Results | `/results?test=:id` | Product owner |
| Feedback link | `/feedback/:token` | Link recipients |

## Quality checks

```powershell
# Shared and server tests
npm test

# Production build
npm run build

# Browser acceptance tests
npm run test:e2e
```

## Project structure

```text
client/   React user interface
server/   Express API, SQLite repositories, research and simulation workflows
shared/   Shared types, validation, finance, and analysis utilities
e2e/      Playwright acceptance coverage
```

## Deployment

The repository includes a Render Blueprint in `render.yaml`. It deploys the client and API as one Node service with a persistent disk for SQLite data and uploaded assets. This is important: a stateless serverless filesystem will not retain accounts, products, reviews, or uploads.

For a deployment walkthrough and operational notes, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Configuration

Copy `.env.example` to `.env`; do not commit the resulting file. The important settings are:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Enables live persona evaluations |
| `GROQ_MODEL` | Selects the evaluation model |
| `DATA_DIR` | Local SQLite storage location |
| `UPLOAD_DIR` | Local uploaded-file location |
| Search-provider keys | Enables comparable-product search |

## License

No license has been specified for this repository.
