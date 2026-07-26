# ExamOps — Cert Detail Page + Practice Sets Spec

Adds a real per-certification page with 5 practice exam sets, exam notes, and resources. Extends `/practice` to run a specific set.

## Schema changes (`prisma/schema.prisma`)

Add:
```prisma
model PracticeSet {
  id            String   @id @default(uuid())
  certId        String
  cert          Certification @relation(fields: [certId], references: [id])
  number        Int      // 1..N, ordering within the cert
  name          String   // e.g. "Practice Exam 1"
  description   String   @default("")
  createdAt     DateTime @default(now())

  questions     Question[]

  @@unique([certId, number])
  @@map("practice_sets")
}
```

Modify existing `Question` model — add:
```prisma
  practiceSetId String?
  practiceSet   PracticeSet? @relation(fields: [practiceSetId], references: [id])
```

`practiceSetId` is nullable so existing seeded questions don't break. The `Certification` model also needs a back-relation: add `practiceSets PracticeSet[]`.

Migration name: `add_practice_sets`.

## Cert detail page: `src/app/(marketing)/certs/[slug]/page.tsx`

Server component. Fetches cert by slug (404 if missing) with its practice sets (ordered by `number`) and per-set question counts (via `_count`).

Sections:

1. **Header** — vendor tag, cert full name, one-line description (from the cert's `description` field — add this to the schema too, `String @default("")`, migration name should cover both changes).
2. **Practice exams** — grid of up to 5 cards, one per PracticeSet ordered by `number`. Each card: "Practice Exam N", question count, "Start exam →" (link to `/practice/[setId]`). If a set has 0 questions, disable and label "Coming soon".
3. **Exam notes** — section listing existing `StudyNote` rows for this cert, grouped by `domain`. Each note shows title + first ~150 chars of `contentMd`, links to `/certs/[slug]/notes/[noteId]` (create that page too, renders full markdown — use `react-markdown` + `remark-gfm`).
4. **Resources** — list of `Resource` rows for this cert, grouped by `type`, each opening the external URL in a new tab (`target="_blank" rel="noopener noreferrer"`).

If a section has no data yet, render a muted empty state ("No notes yet.") — do not hide the section.

## Practice page rework

Split into two:
- `src/app/practice/page.tsx` — index: lists all certs (like admin dashboard but public), each links to `/certs/[slug]`.
- `src/app/practice/[setId]/page.tsx` — takes a practice set ID, loads all questions for that set, renders the same `PracticeExam` component we already have. 404 if setId doesn't exist.

Delete the current `/practice` behavior that hardcoded `aws-cloud-practitioner`.

## Homepage update

On the certifications grid on `/`, change "Start practice →" links to point to `/certs/[slug]` instead of `/practice`.

## Admin panel updates

Add practice set management:
- `/admin/certs/[slug]` — cert detail admin page: shows list of practice sets for this cert with question counts, "Create practice set" button, and (per set) an "Assign questions to this set" link.
- `POST /api/admin/practice-sets` — create a set: `{ certSlug, number, name, description? }`. Zod-validate.
- `POST /api/admin/practice-sets/:id/assign` — assign question IDs to a set: `{ questionIds: string[] }`. Updates `practiceSetId` on each.
- `/admin/certs/[slug]/sets/[setId]/assign` — page listing unassigned questions for the cert with checkboxes and a "Save" button that calls the assign API.

The existing `/admin` dashboard's cert cards should link to `/admin/certs/[slug]`.

## Seed update (`prisma/seed.ts`)

Extend to create 1 PracticeSet for AWS Cloud Practitioner ("Practice Exam 1"), and assign all 8 existing questions to it. This gives us one working end-to-end set to click through immediately.

Also seed 1 StudyNote row and 2 Resource rows for the cert so the notes and resources sections aren't empty:
- StudyNote: domain "Cloud Concepts", title "Shared Responsibility Model overview", contentMd = a short (~200-word) original summary of the shared responsibility model.
- Resources:
  - title "AWS Certified Cloud Practitioner — Official page", url "https://aws.amazon.com/certification/certified-cloud-practitioner/", type "official"
  - title "CLF-C02 Exam Guide (PDF)", url "https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html", type "official"

Reset the DB before re-seeding (`npx prisma migrate reset`).

## Files expected to be created/modified
- `prisma/schema.prisma` (modified)
- `prisma/seed.ts` (modified)
- `src/app/(marketing)/certs/[slug]/page.tsx` (new)
- `src/app/(marketing)/certs/[slug]/notes/[noteId]/page.tsx` (new)
- `src/app/practice/page.tsx` (rewritten)
- `src/app/practice/[setId]/page.tsx` (new)
- `src/app/(marketing)/page.tsx` (update cert card links)
- `src/app/admin/page.tsx` (update cert card links)
- `src/app/admin/certs/[slug]/page.tsx` (new)
- `src/app/admin/certs/[slug]/sets/[setId]/assign/page.tsx` (new)
- `src/app/api/admin/practice-sets/route.ts` (new)
- `src/app/api/admin/practice-sets/[id]/assign/route.ts` (new)
- Any missing shadcn components installed as needed
- `react-markdown` and `remark-gfm` added as deps

## Verification (Playwright, all must pass)

1. `/certs/aws-cloud-practitioner` renders with header, 1 practice set card ("Practice Exam 1 · 8 questions · Start exam →"), 1 note card, 2 resource links.
2. Clicking "Start exam" navigates to `/practice/[setId]` and the existing 8-question flow works end to end.
3. `/certs/nonexistent-slug` returns 404.
4. `/practice` shows the certs index, clicking a cert goes to the cert detail page.
5. `/certs/aws-cloud-practitioner/notes/[noteId]` renders the seeded markdown note.
6. `/admin/certs/aws-cloud-practitioner` shows the 1 practice set with question count.
7. Create a second practice set via the admin UI → appears in the list with 0 questions.
8. Assign 3 questions to the new set via the assign page → count updates, unassigned list shrinks, `/certs/aws-cloud-practitioner` now shows 2 set cards.
9. Screenshots: cert detail page, practice set start, one note page, admin cert detail, admin assign page.

Existing homepage, /admin dashboard, and login flow must still work — spot-check with a screenshot of `/`.
