# ExamOps — Authentication & User Sessions Spec

Add Auth.js v5 with Prisma adapter. Google + GitHub OAuth for launch (no email/password — that's a support burden with no user gain right now). Adds a real logged-in experience: dashboard, header state, gated Pro features. This is the foundation for streaks, progress persistence, and free/pro gating.

## Package versions

- `next-auth@beta` (v5)
- `@auth/prisma-adapter` (v5-compatible adapter; do NOT install `@next-auth/prisma-adapter` — that's the v4 legacy package)

## Environment variables

Add to `.env` (fill with real values) and `.env.example` (placeholders):

```
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
```

Update the README section for local dev to note:
- User must create OAuth apps at `console.cloud.google.com` and `github.com/settings/developers` with callback URLs `http://localhost:3000/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/github`.
- If either provider's env vars are missing, the corresponding sign-in option must be hidden (don't crash — degrade gracefully).

## Schema additions (`prisma/schema.prisma`)

Auth.js requires standard tables: `Account`, `Session`, `VerificationToken`. The existing `User` model needs to be extended, NOT replaced — it already has `plan`, `currentStreak`, etc. that the app depends on. Add the missing Auth.js-required fields.

Update `User`:
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  plan          Plan      @default(FREE)
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastActiveAt  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts           Account[]
  sessions           Session[]
  examAttempts       ExamAttempt[]
  flashcardProgress  FlashcardProgress[]
  studyPlans         StudyPlan[]
  subscription       Subscription?
  bookmarks          Bookmark[]
  diagnosticResults  DiagnosticResult[]
  roadmapGenerations RoadmapGeneration[]
  quickQuestions     QuickQuestion[]
  dailyActivity      DailyActivity[]

  @@map("users")
}
```

Note the id switched from `@default(uuid())` to `@default(cuid())` to match Auth.js convention. This is a breaking change for any existing user rows — but there are none (only sample cert/question data exists), so a full reset is fine.

Add:
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

Migration name: `add_auth_tables`.

Reset the DB and re-seed: `npx prisma migrate reset` (accept the wipe — sample data reseeds automatically).

## Core auth setup

### `src/lib/auth.ts`

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

const providers = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.plan = (user as any).plan;
      }
      return session;
    },
  },
});
```

### `src/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### `src/types/next-auth.d.ts`

Extend the session type so `session.user.id` and `session.user.plan` are typed:

```ts
import { Plan } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      plan: Plan;
    };
  }
}
```

## Middleware update

`src/middleware.ts` currently protects `/admin`. Extend it to also:
- Protect `/dashboard/*` (redirect to `/login` if no session).
- Leave `/admin/*` gate unchanged — that's still cookie-based admin password, separate from user auth. Do NOT merge these; the admin password is separate infrastructure and shouldn't touch user auth.

Use `auth()` from `@/lib/auth` for the user-side check.

## Pages

### `/login` — `src/app/(marketing)/login/page.tsx`

Server component. Reads which providers are configured (based on env vars) and renders a button for each. Clean, centered, one card. No email/password field.

- "Continue with Google" (only if configured)
- "Continue with GitHub" (only if configured)
- If no providers configured, show a clear "Auth is not configured — set AUTH_GOOGLE_ID / AUTH_GITHUB_ID in `.env`" message (dev-only, hide in production build).

Each button is a form that POSTs to a server action calling `signIn("google")` or `signIn("github")` with `redirectTo: "/dashboard"`.

Also add `/login` to the marketing route group so it uses the same layout (nav + footer).

### `/dashboard` — `src/app/dashboard/page.tsx`

New top-level route (NOT under marketing layout — needs a different chrome). Its own layout with a simplified nav (just logo + user avatar dropdown + sign out).

Content for v1 dashboard (keep it simple, expand later):
- "Welcome back, {name}" header.
- Stat row: current streak, longest streak, total exam attempts, total questions answered — all pulled from `User` and `ExamAttempt` for this user.
- "Continue where you left off" section: most recent `ExamAttempt` with a link back to the practice set. Empty state if none.
- "Your certifications" section: certs the user has attempted any question in, with completion % (unique questions answered / total questions in cert). Empty state prompting to browse `/certs`.
- "Recommended" section: certs the user hasn't touched yet.

All data fetched server-side using `await auth()` to get the user, then Prisma queries scoped to that user.

## Nav updates

`src/components/marketing/nav.tsx` becomes a server component that:
- Calls `await auth()` to check session state.
- If NOT signed in: shows "Sign in" (→ `/login`) and "Get started" (→ `/login`).
- If signed in: shows a user dropdown (shadcn `DropdownMenu`) with avatar/name, links to Dashboard and Settings (settings page can be TODO for now), and a Sign out server action.

Extract the dropdown into `src/components/marketing/user-menu.tsx` (client component — dropdowns need interactivity).

## Practice exam persistence

This is the whole point of adding auth. Wire the existing practice exam flow to persist attempts:

- When a user signed in starts a practice set, create an `ExamAttempt` row on submit of the exam with:
  - `userId`, `certId`, `startedAt` (when they landed), `completedAt` (now), `score`, `domainBreakdown` (JSON of per-domain % correct).
- Anonymous users (no session) can still take exams — nothing gets saved. Show a subtle banner at the top of the exam: "Sign in to save your progress" with a link.
- After completing an exam, if signed in, add a row to `DailyActivity` (upsert on `userId + date`) incrementing `questionsAnswered`. Recompute `currentStreak` on `User` in the same transaction — logic: if yesterday's DailyActivity exists, streak += 1; else streak = 1. Update `longestStreak = max(longestStreak, currentStreak)`. Set `lastActiveAt = now`.

Create `src/lib/exam-persistence.ts` with a single `recordAttempt(userId, certId, results)` function that does all of this in a transaction.

Wire this into `PracticeExam` component's submit handler via a server action.

## Files expected

New:
- `src/lib/auth.ts`
- `src/types/next-auth.d.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/(marketing)/login/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/marketing/user-menu.tsx`
- `src/lib/exam-persistence.ts`
- `src/app/actions/exam.ts` — server action calling `exam-persistence`

Modified:
- `prisma/schema.prisma` (User + Account/Session/VerificationToken)
- `src/middleware.ts` (add `/dashboard/*`)
- `src/components/marketing/nav.tsx` (server component, auth-aware)
- `src/components/practice-exam.tsx` (call the server action on submit if signed in)
- `.env` and `.env.example`

## Verification (Playwright + manual, all must pass)

1. `/login` — renders Google + GitHub buttons (if env vars set); with neither set, shows the dev message.
2. Sign in with Google (or GitHub) — redirected to `/dashboard`, session cookie set, `users` row created in DB.
3. Nav on `/` and other marketing pages now shows the user dropdown (avatar + name) instead of "Sign in / Get started".
4. Sign out from dropdown — returns to `/`, dropdown gone, "Sign in / Get started" back.
5. Hit `/dashboard` unauthenticated — redirected to `/login`.
6. Take a practice exam while signed in — after submit, an `ExamAttempt` row exists in DB with your userId, correct score, and domainBreakdown JSON.
7. Same user, take exam again same day — `DailyActivity` row shows `questionsAnswered` incremented, not a new row. `currentStreak` remains 1 (same-day repeats don't extend it).
8. Take an exam anonymously (sign out first) — the "Sign in to save your progress" banner shows, exam works, no ExamAttempt row created.
9. Dashboard "Continue where you left off" shows the most recent attempt after step 6.
10. `/admin/login` still works — user auth doesn't interfere with the separate admin cookie.
11. Screenshots: `/login`, `/dashboard` (signed in with data after taking one exam), nav in both states.

Report each step pass/fail. If OAuth credentials aren't set up when you run this, do the OAuth-independent steps (5, 8, 10) and note which need real credentials.