# ExamOps — Homepage Redesign Spec (v2)

Rebuild the homepage to feel dense, utilitarian, and cert-first (Tutorials Dojo school), while keeping the current polished dark visual system. This replaces the existing `src/app/(marketing)/page.tsx` content only — no other page changes.

## Guiding principle

TD wins because when you land there you see the catalog immediately. Nothing between you and finding your cert. Marketing copy is minimal, cert list is above the fold, everything else is secondary. We match that structure, but with a design that doesn't feel like 2014.

## Layout (top to bottom)

### 1. Compact hero (max 40vh tall)

- H1: "Cloud, DevOps, and AI certification prep." — kept short. Text scale down from previous: `text-4xl md:text-5xl` (not 7xl). This should NOT dominate the viewport.
- Subhead: one line max: "Practice exams, quick notes, and AI that explains what you got wrong."
- Two inline CTAs: "Browse certifications" (primary → `/certs`), "See how it works" (ghost link → `#how-it-works`).
- Below CTAs, one stat row inline: "3 certs · N questions · N practice sets" (fetch counts from DB — real numbers, no fake "10,000+ engineers" fluff).
- No pill above the H1 (the "Now in beta" pill goes). Ship-honest.
- Same subtle radial gradient background — keep the polish.
- Reduce vertical padding: `py-16 md:py-20`, not `py-24 md:py-32`.

### 2. Cert catalog (the actual product)

The main event. Directly under the hero, no filler between.

- Section heading: "Certifications" (small, `text-sm text-muted-foreground uppercase tracking-wider`), then a `<hr class="border-white/10">`.
- Filter chips (client component, same one from `/certs`): All, AWS, Azure, GCP, Kubernetes, DevOps, AI. URL params for state.
- Grid: 1 col mobile, 2 col md, 3 col lg, `gap-3` (tighter than current `gap-6`).
- Cert cards (denser than current):
  - `p-4` padding (not p-6)
  - Row 1: vendor logo (20px) + vendor name (`text-xs text-muted-foreground uppercase`)
  - Row 2: cert full name (`text-base font-medium`)
  - Row 3: 3-column stats grid — question count, practice sets count, "Free" or "Coming soon" tag
  - No CTA button — whole card is clickable, subtle chevron `→` on hover
- Below the grid: a text link "See all certifications →" going to `/certs` (only shows if there are more certs than fit in the initial view — for now with 3 certs, hide it).

### 3. Three-column value strip

Not a "features" section with big headings — a compact strip with three tight statements. `py-16`, no gradient.

- "Real exam count and weights" — Practice sets match actual exam length and domain distribution.
- "Two-tier explanations" — Every question ships with a quick take and a deeper breakdown.
- "AI that helps, quietly" — Ask on any question, get a roadmap from a diagnostic, no chat clutter.

Small H3 for each, one-sentence body below. No icons. Divider hairlines between columns on desktop.

### 4. How it works (`id="how-it-works"`)

4-step numbered flow (not full-page cards, a horizontal strip):
1. Pick a cert
2. Take a diagnostic
3. Practice with weighted sets
4. Track weak areas until you're ready

`py-16`, tight vertical spacing, muted background (`bg-white/[0.02]` full-width strip).

### 5. Sample question block

The single highest-signal thing we can put on the homepage: an actual practice question preview.

- Pull one question from the DB (server component: `prisma.question.findFirst` where cert is aws-cloud-practitioner). Static — no interactive answering on homepage.
- Show it in a card that visually matches the actual `/practice/[setId]` question UI (same font sizes, same option style), but with the correct answer already highlighted and both explanation levels visible.
- Small caption above: "A real practice question — this is what every question looks like."
- Below the card: "Try it live →" link to `/certs/aws-cloud-practitioner`.

This does more sales work than any copy could — it shows the product, not descriptions of it.

### 6. Pricing

Keep existing `<PricingTiers />` component as-is, but wrap in a tighter section: `py-16`, small `<hr>` divider above.

### 7. Final CTA band

Keep concept, tighten copy:
- Single line: "Start practicing. Free."
- One button: "Browse certifications →" → `/certs`.
- No second sub-line, no gradient panel — just centered text and button, `py-20`.

## What to remove

- The "Trusted by engineers preparing for AWS · Azure · Google Cloud..." vendor strip in the current hero — dead space. Cert catalog does that job.
- The "Now in beta" pill above the H1 — remove.
- Any "Everything you need to..." style feature section — replaced by the three-column strip above.
- The current H1 "Pass your cloud, DevOps, and AI certifications faster." — replace with the shorter version above.

## Density & spacing rules

- Sections: `py-16` default (was `py-24 md:py-32`). Only hero uses the slightly larger `py-20` on md+.
- Container: `max-w-6xl mx-auto px-6` — keep.
- Between sections: `<hr class="border-white/10">` hairline, no big margin gaps.
- Grid gaps: `gap-3` for cert cards (was `gap-6`), `gap-8` for the value strip.
- Body copy: no paragraph is more than 2 lines on desktop.

## Type scale (this page only)

- H1: `text-4xl md:text-5xl font-medium tracking-tight` (was 5xl/7xl)
- H2: `text-2xl md:text-3xl font-medium` (was 3xl/4xl)
- H3: `text-base font-medium`
- Body: `text-sm md:text-base text-muted-foreground`

Don't touch the type scale on other pages — this is a homepage-specific rebalance for density.

## Motion

- Cert card hover: keep the `-translate-y-0.5` from prior work.
- Filter chip active state: `bg-white/10 text-foreground`, inactive: `text-muted-foreground hover:text-foreground`.
- Nothing else animates on this page. No scroll-triggered fade-ins.

## Files expected

Modified:
- `src/app/(marketing)/page.tsx` — new layout per this spec. Server component (except the filter chips subcomponent and the pricing toggle, both already client components).
- `src/components/marketing/cert-filter-chips.tsx` — extract from `/certs` if it isn't already extracted, so the homepage can reuse it. If it already exists, use it.

New (extract if reusable, inline if not):
- `src/components/marketing/sample-question-preview.tsx` — the static question card. Server component (receives the question as a prop from the parent server component, no client interactivity).

Don't touch:
- Nav, footer, other pages, admin, practice, schema, seed.

## Verification (Playwright)

1. `/` — hero occupies ~35-40% of viewport height on desktop (not 100vh like before).
2. Cert catalog is visible without scrolling on a 1440×900 desktop.
3. Cert cards are noticeably denser than before — screenshot old vs new for comparison.
4. Filter chips work (URL updates, grid filters).
5. Sample question preview shows a real question from the DB with highlighted correct answer and both explanations visible.
6. "How it works" section has 4 numbered steps in a horizontal strip on desktop, stacks on mobile.
7. `/certs`, cert detail, pricing, info pages, `/practice/[setId]`, and `/admin` all render unchanged.
8. Mobile view: hero legible, cert cards stack cleanly, filter chips scroll horizontally if needed.
9. Screenshots: desktop 1440-wide `/`, mobile 390-wide `/`, cert catalog section detail.

Report each step pass/fail.