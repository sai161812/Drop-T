# Deploying DROPTEST reliably

## Recommended: one Render web service

DROPTEST is a stateful Express application. Accounts, sessions, products,
simulation results, and uploaded images are stored on disk. Deploy the React
frontend and Express backend together as one Render web service with the
persistent disk defined in `render.yaml`.

This keeps browser requests on the same domain, so all existing `/api/*` and
`/uploads/*` URLs work without CORS configuration or a separate frontend API
URL. It also gives simulations a continuously running Node process instead of
a short-lived serverless function.

### Create the service

1. Push `render.yaml` to GitHub.
2. In Render, choose **New > Blueprint** and connect the `sai161812/Drop-T`
   repository.
3. Render reads `render.yaml` and creates the `droptest` web service and its
   1 GB persistent disk in Singapore.
4. Enter one `GROQ_API_KEY` when Render asks for it. One working key is enough;
   the product feed and login do not call Groq.
5. Apply the Blueprint and wait for `/api/health` to report `healthy`.

The configured disk is mounted at `/var/data`. SQLite is stored under
`/var/data/database`, and uploads under `/var/data/uploads`. Only data written
inside that mount survives deploys and restarts.

Render persistent disks require a paid web service. This is the smallest change
that makes the current SQLite application durable. A free stateless service
would reproduce the same missing users and products seen on Vercel.

### Verify the new deployment

1. Open the service's `onrender.com` URL.
2. Open `/api/health`; it should return JSON containing `"status":"healthy"`.
3. Open `/api/products?limit=50`; it should return a JSON product list.
4. Sign in using a demo account from `README.md`.
5. Create a test product, redeploy, and confirm the product still exists.

The application seeds demo accounts and two starter products only when they are
missing. Existing records on the persistent disk are retained.

## Why Vercel caused the failures

Vercel functions do not provide a shared persistent filesystem. The previous
deployment placed SQLite and uploads in `/tmp`, which can be replaced at any
time and is not shared by every function instance. A request could therefore
see a different database from the previous request. That affects login and the
product feed before any Groq request is made.

The five optional `GROQ_API_KEY*` variables form a provider key pool used only
for synthetic simulations. They do not load products, create sessions, or
authenticate users. Start the Render service with one key. Add fallback keys
later for credential management; keys in the same organization share quota.

The Blueprint selects `qwen/qwen3.8-27b`. Reviews send five personas per request
with compact output, then wait for short quota resets when required. All 50
personas still receive individual evaluations. Free-tier reviews can take
several minutes. Long daily-limit waits preserve partial results for a later
retry. A retry uses the original run's recorded model; select a different model
only for a new review, so one review never silently mixes different models.

## Existing local products

Local development databases are intentionally excluded from Git because they
contain user, session, and test data. They are not automatically copied into a
new production service. After the Render service is healthy, export only the
intended products and accounts from the local database before importing them
into the production disk. Do not upload the entire development database because
it contains automated test fixtures.

## Vercel

The Vercel configuration remains available as a demo deployment, but its
serverless SQLite data is temporary. Once Render is live, use the Render URL as
the main application URL and archive the duplicate Vercel projects.
