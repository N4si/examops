# ExamOps — Production Deployment Spec

Get ExamOps live at the `examops` domain, on Vercel, with Neon Postgres. Working OAuth. Fixes the one architectural issue (Auth.js middleware on Vercel Edge) before it becomes a production incident.

---

## Part 1 — Manual setup (user, not Claude Code)

Do these first. Claude Code needs the outputs to proceed.

### 1. Neon Postgres
- Sign up at `console.neon.tech` (free tier is enough).
- Create a new project: name `examops`, region closest to your target users (e.g. `aws-us-east-1` if targeting US, `aws-ap-south-1` for India).
- Enable the pgvector extension: Neon dashboard → SQL Editor → run `CREATE EXTENSION IF NOT EXISTS vector;`.
- Copy the connection string (looks like `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`). Save it — you'll paste it into Vercel later.

### 2. Vercel
- Sign up at `vercel.com` if you haven't.
- Install the CLI locally: `npm i -g vercel`.
- From your project directory: `vercel login`, then `vercel link` (creates the project — accept defaults).

### 3. Domain
- Confirm the exact domain you own (e.g. `examops.dev`, `examops.io`, `examops.com`).
- Register it on Vercel: Project → Settings → Domains → Add your domain. Follow their DNS instructions (add either an A record to `76.76.21.21` or CNAME to `cname.vercel-dns.com`) at your registrar.

### 4. OAuth apps — production credentials
Repeat both providers with your **real domain** as the callback:

- **Google** (`console.cloud.google.com` → APIs & Services → Credentials):
  - New OAuth client (Web application).
  - Authorized JavaScript origins: `https://<your-domain>`
  - Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`
  - Save client ID and secret.
- **GitHub** (`github.com/settings/developers`):
  - New OAuth App.
  - Homepage URL: `https://<your-domain>`
  - Callback URL: `https://<your-domain>/api/auth/callback/github`
  - Save client ID and generate a client secret.

You can keep your local `localhost:3000` OAuth apps separate — don't overwrite them.

### 5. Env vars to have ready
By the end of manual setup, you should have these values on hand:
```
DATABASE_URL=<neon connection string>
AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_URL=https://<your-domain>
AUTH_GOOGLE_ID=<from step 4>
AUTH_GOOGLE_SECRET=<from step 4>
AUTH_GITHUB_ID=<from step 4>
AUTH_GITHUB_SECRET=<from step 4>
NEXT_PUBLIC_SITE_URL=https://<your-domain>
ADMIN_PASSWORD=<pick a strong one, different from dev>
ANTHROPIC_API_KEY=<if you plan to use AI features later; else skip>
```

---

## Part 2 — Code changes (Claude Code implements)

### A. Fix Auth.js middleware for Vercel Edge

Currently `src/middleware.ts` calls `auth()` which triggers a Prisma DB query — this fails on Vercel Edge because Prisma doesn't run on Edge runtime without Prisma Accelerate.

Fix approach: remove `auth()` from `middleware.ts`. Move the auth guard into a per-page server helper.

Changes:
- `src/middleware.ts`: keep the admin cookie check only. Remove all `/dashboard/*` handling — that becomes a server-component-level check.
- New: `src/lib/require-auth.ts` — exports `requireAuth()` which calls `auth()` and calls `redirect("/login")` if no session. Server-side, runs in Node runtime, no Edge issue.
- Update `src/app/dashboard/layout.tsx` (and any other future protected routes) — first line: `await requireAuth();`.
- Any other place in the app that reads session with `auth()` on the server (dashboard page, nav, etc.) continues to work — those already run on Node, not Edge.

Also: add `export const runtime = "nodejs"` to the top of `src/app/api/auth/[...nextauth]/route.ts` explicitly, so Auth.js's own routes don't get pushed to Edge.

### B. Vercel-specific config

- New: `vercel.json`
  ```json
  {
    "buildCommand": "prisma generate && prisma migrate deploy && next build",
    "installCommand": "npm install"
  }
  ```
  `migrate deploy` (not `migrate dev`) runs pending migrations against production without prompts.

- Update `.env.example` — remove `AUTH_URL` (Vercel injects it automatically as `VERCEL_URL`, and Auth.js v5 reads `AUTH_URL` from that fallback). Actually keep it for clarity but note it's overridden in production.

- Update `package.json` scripts to add: `"postinstall": "prisma generate"` so Vercel builds regenerate the client after `npm install`.

### C. Sync env vars to Vercel via CLI

From project directory, for each env var in the list above:
```bash
vercel env add DATABASE_URL production
# CLI prompts for the value, paste it
```
Do this for every var. Also add each to `preview` if you want branch previews to work with the same secrets (or use a separate Neon branch for preview — Neon supports branching).

Alternative: set them in the Vercel dashboard (Project → Settings → Environment Variables). Same result, less CLI ceremony.

### D. Seed the production DB once

After the first successful deploy, run once from local against the production `DATABASE_URL`:
```bash
DATABASE_URL="<production neon url>" npx prisma db seed
```
This seeds the 3 certs + 8 sample questions into production. Do NOT run `migrate reset` against production — ever.

Also run once against production: `CREATE EXTENSION IF NOT EXISTS vector;` (via Neon SQL editor) — already done in step 1 above, just double-check.

### E. Delete/gitignore the local `.env` from production concerns

- Confirm `.env` is in `.gitignore` (it should already be).
- `.env.example` should be committed; real `.env` should not.

---

## Part 3 — Verification (Claude Code runs, reports back)

Run these after `vercel deploy --prod` succeeds.

1. `https://<your-domain>/` returns 200 and renders the homepage v2.
2. `/certs` shows the 3 seeded certs.
3. `/certs/aws-cloud-practitioner` shows the practice set + note + resources.
4. Take a practice exam anonymously — completes, no user record created (verify via `psql`-ing Neon or Neon SQL editor).
5. Sign in with Google — redirects to `/dashboard`, `users` row appears in Neon.
6. Sign in with GitHub — same, different provider row in `accounts`.
7. Take a practice exam signed in — `ExamAttempt` row appears with your userId, `DailyActivity` upserts.
8. `/admin/login` → sign in with production `ADMIN_PASSWORD` → admin panel loads.
9. `/sitemap.xml` and `/robots.txt` return correct content with production URLs (not localhost).
10. `curl -I https://<your-domain>/opengraph-image` returns a 200 image response.
11. Confirm no errors in Vercel's Runtime Logs during any of the above.

Report each step pass/fail with screenshots for the OAuth-dependent ones.

---

## Non-goals for this milestone
- Not switching to JWT sessions (kept database sessions, moved auth check to Node runtime instead).
- Not setting up Prisma Accelerate (not needed once auth is out of middleware).
- Not setting up staging/preview environments (single production env is fine for now).
- Not setting up error tracking (Sentry etc.) — add it in a follow-up if needed.
- No content changes — still 8 sample questions in production.