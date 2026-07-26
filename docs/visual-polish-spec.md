# ExamOps — Visual Polish & Exam UI v2 Spec

Three phases, one milestone. Commit between phases.

## Phase A — Design system upgrade (foundation)

### A1. Per-vendor brand colors

Schema change to `Certification`:
```prisma
brandColor String @default("#6366f1") // indigo fallback
```
Migration: `add_cert_brand_color`.

Seed values:
- AWS Cloud Practitioner: `#FF9900`
- Azure AZ-900: `#0078D4`
- GCP Associate Cloud Engineer: `#4285F4`

Where to use it (subtle accent — thin border, small pill, hover glow — never a full flood):
- Cert card top border (2px solid brandColor) on homepage cert grid and `/certs` grid
- Cert detail page header accent line under the cert name
- Practice exam header bar left border (4px)

Access via inline `style={{ borderColor: cert.brandColor }}` — no Tailwind class generation.

### A2. Light mode

Install `next-themes`. Wrap root layout in `<ThemeProvider attribute="class" defaultTheme="system">`.

Add `src/components/theme-toggle.tsx` — client component, shadcn DropdownMenu with Light / Dark / System options. Icon changes with active theme (Sun/Moon from lucide-react).

Add the toggle to `src/components/marketing/nav.tsx` (both server nav and dashboard nav) and to the admin nav shell.

`src/app/globals.css`: define light mode CSS variables mirroring the existing dark ones. Ensure `--brand`, `--background`, `--foreground`, `--muted-foreground`, `--border` all have light values.

Audit and fix: `border-white/10`, `bg-white/[0.02]`, `hover:bg-white/5`, `hover:border-white/20` — these hardcoded rgba values break in light mode. Replace with `border-border`, `bg-muted/50`, `hover:bg-muted`, `hover:border-foreground/20` respectively.

Spot check pages in both themes: `/`, `/certs`, `/certs/aws-cloud-practitioner`, `/dashboard`, `/practice/[setId]`, `/admin`, `/login`.

### A3. Vendor logos — fix the AWS/Azure gap

Drop the `simple-icons` dependency (it's missing AWS and Azure due to trademark removal). Replace with local SVGs.

Create `public/vendors/`:
- `aws.svg`
- `azure.svg`
- `gcp.svg`
- `kubernetes.svg`
- `docker.svg`
- `github.svg`
- `hashicorp.svg`
- `terraform.svg`

Source: each vendor's brand assets page (AWS Brand Central, Microsoft brand, Google Cloud brand, CNCF for Kubernetes). Use monochrome/single-color versions where available so they inherit `currentColor`.

Rewrite `src/components/vendor-logo.tsx`:
- Props: `slug: string`, `size?: number` (default 24)
- Resolves slug (aws / azure / gcp / kubernetes / docker / github / hashicorp / terraform) to `/vendors/{slug}.svg`
- Renders as `<img>` with `alt={`${slug} logo`}`
- Fallback: same placeholder circle as today if slug unknown

Update seed to set `logoSlug: "aws"` (not `"amazonaws"`), `logoSlug: "azure"` (not `"microsoftazure"`), `logoSlug: "gcp"` (not `"googlecloud"`).

### A4. Typography scale

Global bump in `globals.css` or component-level:
- Body base: 16px minimum (currently 14px in places via `text-sm`)
- Question text in practice exam: `text-xl md:text-2xl leading-relaxed` (currently `text-base`)
- Answer options: `text-base md:text-lg` (currently `text-sm`)
- Explanations: `text-base leading-relaxed` (currently `text-sm`)
- Study notes markdown: already uses `prose` — bump to `prose-lg`
- Nav links, small labels, meta text: stay `text-sm` — don't inflate everything

Commit checkpoint after Phase A: `git add -A && git commit -m "Design system: brand colors, light mode, real vendor logos, larger type"`

---

## Phase B — Practice exam UI v2

Rewrite `src/components/practice-exam.tsx`. New supporting components:
- `src/components/practice-exam-header.tsx`
- `src/components/practice-exam-navigator.tsx`
- `src/components/practice-exam-review.tsx`
- `src/components/practice-exam-summary.tsx`

### Modes

Add a mode toggle at exam start (radio buttons on the pre-exam screen):
- **Practice mode** (default) — submit per question, immediate feedback with explanation, streak-friendly for learning
- **Exam mode** — submit at end only, no per-question feedback, countdown timer matching real exam duration (CLF-C02 = 90 min, hardcode 90 min for now, add to `Certification` schema later)

Mode is state on the client component, not persisted. User picks each attempt.

### Layout

Two-column on desktop (`lg:grid-cols-[1fr_240px]`), single column on mobile with navigator collapsed into a top drawer (shadcn Sheet).

**Left (main):**
- Header bar: cert name (small), "Question X of Y" (medium), domain pill (uses domain-specific muted color), elapsed/countdown timer (right-aligned), Flag button
- Question text: `text-xl md:text-2xl leading-relaxed`
- Options: larger click targets (`p-5`, `text-base md:text-lg`), keyboard shortcuts (1/2/3/4 for options, F to flag, N for next, P for previous — show a "?" help popover listing shortcuts)
- Bottom action row: Previous | (Submit answer in practice mode / Save in exam mode) | Next
- In practice mode after submit: explanation area appears inline (same as current), "Show detailed" toggle preserved

**Right (navigator, desktop only):**
- Grid of question numbers, 5 per row
- Colored by status:
  - Unanswered: `border-border`, text-muted-foreground
  - Answered: `bg-brand/20 border-brand text-foreground`
  - Flagged: `border-yellow-500 bg-yellow-500/10`
  - Answered + flagged: both (yellow border, brand fill)
  - Current: `ring-2 ring-brand`
- Click to jump to that question
- Below the grid: "Finish exam" button (goes to review screen; disabled if in exam mode with unanswered questions unless confirmed)

**Mobile:**
- Question palette in a top Sheet triggered by a "1/8" button
- Same visual language for status colors

### Timer

- Practice mode: elapsed counter, MM:SS, no pressure
- Exam mode: countdown from 90 min, MM:SS, turns red at <5 min, auto-submits at 0

Store start time as a Date on component mount, tick every second via a `setInterval`. Cleanup on unmount.

### Review screen

Before final submit, show a review page:
- List all questions with status (answered / unanswered / flagged)
- Click any to jump back and change answer
- Big "Submit exam" button at the bottom
- Confirmation dialog if any unanswered

### Summary screen (post-submit)

Rewrite the current end-of-exam screen:
- Big score at top (X / Y, with percentage)
- Pass/fail badge if we have a passing score threshold on the cert (add `passingScore Int? @default(70)` to `Certification`, migration `add_cert_passing_score`, seed 70 for all 3)
- **Per-domain breakdown as horizontal bars** — each domain, correct/total count, colored bar filled to the % score, using the cert's brandColor for the fill
- Time taken
- **Missed questions list** — each with question text truncated, "Review answer" link that opens the question in-place with correct answer and explanation shown
- Two CTAs at bottom: "Retake this exam" and "Try another cert"

Commit checkpoint after Phase B: `git add -A && git commit -m "Practice exam UI v2: navigator, timer, modes, review, per-domain summary"`

---

## Phase C — Polish sweep

Small things that add up:

- Cert card hover: brief brand-color glow (`hover:shadow-[0_0_20px_-4px_var(--brand-color)]` — needs the CSS var set inline per card)
- Cert detail page hero: subtle brand-color radial gradient behind the cert name (like the homepage hero, but tinted per-cert)
- Loading skeletons: replace any bare spinners with shadcn Skeleton components in the right shape
- Empty states: audit every empty state ("No notes yet", "No certifications attempted yet") — ensure they have a subtle icon, a helpful sentence, and a CTA. Don't leave any as plain gray text.
- Focus states: verify every interactive element has `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background` — critical for keyboard users, currently inconsistent
- Nav on mobile in dark mode: the hamburger sheet's backdrop is too dark — set `bg-background/95` explicitly
- Practice exam mobile: ensure options are tappable with big enough touch targets (min 44px height)

Commit after Phase C: `git add -A && git commit -m "Polish sweep: hover glows, cert hero tints, skeletons, focus states"`

---

## Files touched summary

New:
- `src/components/theme-toggle.tsx`
- `src/components/practice-exam-header.tsx`
- `src/components/practice-exam-navigator.tsx`
- `src/components/practice-exam-review.tsx`
- `src/components/practice-exam-summary.tsx`
- `public/vendors/*.svg` (8 files)

Modified:
- `prisma/schema.prisma` (2 migrations: brand color, passing score)
- `prisma/seed.ts`
- `src/components/vendor-logo.tsx` (rewrite)
- `src/components/practice-exam.tsx` (major rewrite)
- `src/app/globals.css` (light mode vars, typography)
- `src/app/layout.tsx` (ThemeProvider)
- `src/components/marketing/nav.tsx` (theme toggle)
- Any admin/dashboard nav shells
- `src/app/(marketing)/certs/page.tsx` (cert card brand accent)
- `src/app/(marketing)/certs/[slug]/page.tsx` (brand accent, tinted hero)
- `src/app/(marketing)/page.tsx` (home cert cards brand accent)
- All places with `border-white/10`, `bg-white/[0.02]` etc — sweep replace

Removed:
- `simple-icons` from package.json

Added deps:
- `next-themes`

## Verification (Playwright, all must pass)

Design system (Phase A):
1. Light mode toggle in nav dropdown; picks Light/Dark/System; persists across reload.
2. Every core page renders cleanly in both themes: `/`, `/certs`, `/certs/aws-cloud-practitioner`, `/dashboard` (signed in), `/practice/[setId]`, `/admin`, `/login`. No white-on-white or black-on-black.
3. AWS cert card shows real AWS logo (not placeholder circle).
4. AWS cert card has orange (#FF9900) accent border/element.
5. Body text is visibly larger than before (compare screenshots pre/post).

Exam UI (Phase B):
6. Pre-exam screen shows mode toggle (Practice / Exam), user picks one.
7. Question navigator visible on desktop; question numbers color-coded by status.
8. Click a navigator number, jumps to that question.
9. Flag button toggles yellow state on navigator.
10. Keyboard: 1-4 selects options, N advances, F flags. Show help popover.
11. Exam mode: countdown timer, no per-question feedback, review screen before submit.
12. Review screen lists all questions, clicking one returns to it.
13. Summary screen shows big score, pass/fail badge, per-domain bars in brand color, time taken, missed-questions list.

Polish (Phase C):
14. Cert card hover has brand-color glow.
15. Cert detail hero has subtle brand tint.
16. Every empty state has icon + copy + CTA (not bare gray text).
17. Tab-through the site with keyboard only, focus rings visible on every interactive element.

Report each step pass/fail with screenshots for 1-5, 7, 11, 13.

## Commit strategy

Three commits, one per phase, so we can roll back a phase without losing others. Do NOT combine into one commit.