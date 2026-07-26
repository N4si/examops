# ExamOps — Homepage & Public Layout Spec

Public marketing/landing shell. No auth changes. Uses existing DB (Certification.findMany).

## Design language
Linear/Vercel/Stripe aesthetic. Dark mode as default (respect system + toggle later, not this milestone). Inter or Geist font (already installed). Generous whitespace. One accent color: use Tailwind's `indigo-500` as the accent (change one CSS var if we swap later). No gradients-as-decoration; use them only for hero background if at all. All spacing on 4px grid.

## Shared layout: `src/app/(marketing)/layout.tsx`
Route group so the marketing pages share a layout separate from /admin and /practice.

- **Nav** (`src/components/marketing/nav.tsx`): sticky top, backdrop-blur, logo left ("ExamOps" wordmark, no image yet), links: Certifications, Pricing, Resources. Right side: "Sign in" (link to `/practice` for now — real auth later), "Get started" primary button (also `/practice` for now).
- **Footer** (`src/components/marketing/footer.tsx`): 4 columns — Product (Certifications, Pricing, Practice), Company (About, Blog, Contact), Legal (Privacy, Terms), Social (GitHub, X, LinkedIn — placeholder `#` hrefs). Copyright line.

All links that don't have a real page yet should point to `#` — do not create empty stub pages for them.

## Home page: `src/app/(marketing)/page.tsx`
Move current `src/app/page.tsx` content out (it's just hello-world scaffold, delete it — this file becomes the new home).

Sections top to bottom:

1. **Hero**
   - Small pill above headline: "Now in beta"
   - H1: "Pass your cloud, DevOps, and AI certifications faster."
   - Subhead (one line): "Practice exams, quick notes, and an AI tutor that actually explains what you got wrong."
   - Two CTAs: "Start practicing free" (primary → /practice), "Browse certifications" (secondary → #certifications).
   - Below CTAs, a small "Trusted by engineers preparing for" strip with plain-text vendor names (AWS · Azure · Google Cloud · Kubernetes · HashiCorp · Docker). No logos — text only for now.

2. **Certifications grid** (`id="certifications"`)
   - Server component, fetches all Certifications from DB with question count via `_count`.
   - Section heading: "Certifications we cover"
   - Grid: 1 col mobile, 2 col md, 3 col lg. Each card: vendor tag (small, muted), cert name, question count, "Start practice →" link to `/practice` (later `/certs/[slug]`).
   - If a cert has 0 questions, still show the card but disable the link and label it "Coming soon".

3. **Features** (3-column)
   - Headings + one-sentence descriptions, no icons yet:
     - "Real exam feel" — Timed practice sets that match the actual exam question count and domain weights.
     - "Explanations that teach" — Every question ships with a quick answer and a detailed breakdown.
     - "AI that helps, quietly" — Ask a question, get a study plan, search your notes. AI only where it helps.

4. **Pricing**
   - 3 tiers side-by-side, middle one highlighted with a subtle border-accent:
     - **Free** — $0/mo — "Get started" CTA. Features: 1 practice set per cert, quick notes, community-support.
     - **Pro** (highlighted) — $19/mo or $190/yr toggle — "Start free trial" CTA. Features: All practice sets, AI quick question, AI roadmap generator, progress tracking, no ads.
     - **Team** — Custom — "Contact sales" CTA (href `#`). Features: Everything in Pro, team dashboard, SSO, dedicated support.
   - Monthly/annual toggle above the tiers (state on the client component; annual shows "2 months free").

5. **Final CTA band**
   - Full-width panel, subtle accent background.
   - "Start passing certifications." button "Practice free →".

## Tech notes
- Everything server-rendered by default; only make pricing toggle a client component.
- No form submissions or new API routes needed for this milestone.
- Homepage must be fast: no client-side data fetching, no useEffect for anything.
- Accessibility: real `<nav>`, `<main>`, `<footer>` landmarks, proper heading hierarchy, focus-visible rings, semantic buttons/links.
- Mobile: nav collapses to a hamburger (shadcn Sheet is fine) that opens a full-height panel with the same links stacked.

## Files expected
- `src/app/(marketing)/layout.tsx`
- `src/app/(marketing)/page.tsx`
- `src/components/marketing/nav.tsx`
- `src/components/marketing/footer.tsx`
- `src/components/marketing/pricing-tiers.tsx` (client component for the toggle)
- Delete or replace: `src/app/page.tsx` (current hello-world)

## Verification
1. `npm run dev`, visit `/`. Confirm all 5 sections render.
2. Confirm the certifications grid pulls from DB (should show "AWS Certified Cloud Practitioner (CLF-C02) · 8 questions").
3. Resize to mobile width; confirm layout adapts and hamburger nav works.
4. Confirm `/admin` and `/practice` still work (route group shouldn't affect them).
5. Screenshot desktop and mobile home page.