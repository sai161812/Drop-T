# Deploying DROPTEST

## Vercel demo deployment

Deploy the entire repository as one Vercel project. In Project Settings:

- Root Directory: repository root (leave blank), **not** `client` or `server`.
- Framework Preset: Other.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Install Command: `npm install --include=dev`.
- Node.js: 24.x (the server uses native `node:sqlite`).

The root `vercel.json` supplies the build settings and routes `/api/*` and
`/uploads/*` to `api/index.ts`. The frontend uses same-origin API requests;
there is no separate frontend API URL to configure.

Add `GROQ_API_KEY` (and optional additional Groq/search keys from `.env.example`)
in Vercel Environment Variables for the environments you deploy. Set
`NODE_ENV=production`. Local `.env` files are ignored by Git and are not
automatically uploaded. Groq keys are needed for AI simulations, not product
listing or account login. Never put secrets in `VITE_*` variables.

Push these changes to the connected GitHub branch, then deploy the new commit.
After changing project settings or environment variables, redeploy.

Verify:

1. `/api/health` returns JSON with `status: "healthy"`.
2. `/api/products` returns JSON containing seeded products.
3. Sign in with a demo account from README.md and reload the page.
4. Refresh `/explore` directly to verify frontend routing.

If an API URL returns HTML, the frontend fallback is handling the request:
check the root directory and ensure the deployment contains the API function.
If it returns 500, open Vercel Logs and inspect the function's startup error.

## Persistent production storage is still required

The current backend stores accounts, sessions, products, and results in a local
SQLite file, and uploaded images on disk. On Vercel those files are placed in
`/tmp` to avoid read-only filesystem errors. This is **demo storage only**:
instances do not share it, and files can disappear when an instance is replaced.
New accounts can consequently fail to sign in on a different instance.
Existing local data and uploads are excluded from Git and are not deployed.

For reliable production use, either run the existing Express backend on a
persistent server with a mounted disk (set `DATA_DIR` and `UPLOAD_DIR` to that
disk), or migrate the repositories to a hosted database and uploads to object
storage before using Vercel functions for the backend. AI simulation execution
also needs a deployment model that supports its long-running background work.
Changing environment variables alone does not migrate the database.
