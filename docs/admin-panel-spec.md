# ExamOps — Admin Panel Spec

## Auth
Single-admin, cookie-based, no user accounts/RBAC yet (real auth comes later with real users).
- `ADMIN_PASSWORD` env var.
- `/admin/login` — password form, POST to `/api/admin/login`, sets an httpOnly `admin_session` cookie equal to the password on success.
- Middleware protects `/admin/*` and `/api/admin/*`, redirecting to `/admin/login` (pages) or 401 (API) if the cookie doesn't match.

## Pages
- `/admin` — dashboard: list all certifications with question counts, links to "Add question" and "Bulk upload".
- `/admin/questions/new` — form: certSlug, domain, question text, dynamic option list with checkboxes marking correct answer(s), explanation, detailedExplanation, difficulty (EASY/MEDIUM/HARD). Submits to the API below.
- `/admin/questions/bulk` — paste-JSON or upload-.json-file textarea, submits array to the bulk API below.

## API
- `POST /api/admin/questions` — single question, Zod-validated: `{ certSlug, domain, text, options: string[], correctAnswers: string[], explanation, detailedExplanation, difficulty }`. Looks up cert by slug, 400 if unknown, creates via Prisma.
- `POST /api/admin/questions/bulk` — same shape, array. Validate all before inserting any (all-or-nothing), use `createMany`, return count created.

## Constraints
- Match the existing `Question` model in `prisma/schema.prisma` exactly — don't alter the schema for this feature.
- Use existing shadcn components already in the project (Button, Card, Input, Textarea) — add any missing ones via `npx shadcn add`.
- No file storage/S3 needed — bulk upload reads the JSON client-side and posts it as a request body.

## Verification (do this yourself before reporting back)
Using Playwright against the local dev server:
1. Log in at `/admin/login` with the env password, confirm redirect to `/admin`.
2. Add one question via `/admin/questions/new`, confirm it appears in the DB and the dashboard's count updates.
3. Bulk upload a small 2-question JSON array, confirm both are created.
4. Hit `/admin` with no session cookie, confirm redirect to login.
5. Screenshot the dashboard and the new-question form.

Report back with a summary and screenshots, same format as your last few updates.