# ExamOps — Cert Detail Addendum: SEO, Logos, Info Pages, Theme, Extra Certs

Extends what's already shipped in the cert-detail milestone. Do not touch existing working code except where explicitly listed under "Modified files."

## 1. Vendor logos

- `npm i simple-icons`
- New: `src/components/vendor-logo.tsx` — props: `slug: string`, `size?: number` (default 24). Loads the SVG path from `simple-icons/icons/{slug}` and renders as inline SVG using `currentColor` so it inherits text color. If `slug` is empty or the icon isn't found, render a small circle placeholder of the same size (a `div` with `bg-muted rounded-full`).
- Add `logoSlug String @default("")` to the `Certification` model. Migration name: `cert_logo_slug`.
- Update `prisma/seed.ts` to set `logoSlug: "amazonaws"` on the existing AWS cert.
- Render the logo (24px) next to the cert name in:
  - Cert cards on the homepage grid
  - Cert cards on the new `/certs` index page (see item 5)
  - Cert detail page header (32px)
  - Admin cert cards on `/admin`

## 2. Info pages

All under the marketing route group. All server components. Static content — no forms yet.

- `src/app/(marketing)/about/page.tsx` — 2-3 paragraphs: mission, who this is for. Keep it short and real, no filler.
- `src/app/(marketing)/pricing/page.tsx` — page shell + heading, then re-render the existing `PricingTiers` component from the homepage. Do not duplicate the pricing component; import it.
- `src/app/(marketing)/faq/page.tsx` — shadcn `Accordion` with 6-8 questions: how questions are written, how exams are scored, cancellation policy, refund policy, whether questions match real exams, exam-pass guarantee, difference between Free and Pro, when new certs are added.
- `src/app/(marketing)/privacy/page.tsx` — placeholder template body with "Last updated: <today>". Real-shaped sections (Introduction, Data We Collect, How We Use It, Your Rights, Contact) but each with 1-2 sentences of clearly template copy. Do NOT fabricate legal language.
- `src/app/(marketing)/terms/page.tsx` — same treatment as Privacy.
- `src/app/(marketing)/contact/page.tsx` — email link (`hello@examops.dev` — placeholder) and a note that a proper form comes later.

Install `@tailwindcss/typography` and register it in Tailwind config. Wrap long-form content on these pages in `prose prose-invert max-w-none`. Also swap the hand-rolled arbitrary-variant utility classes on the note-detail page (`src/app/(marketing)/certs/[slug]/notes/[noteId]/page.tsx`) to use `prose prose-invert` instead.

## 3. Navigation and footer updates

- Update `src/components/marketing/nav.tsx`: Pricing link now goes to `/pricing` (not `#pricing`). Add nothing else to the nav.
- Update `src/components/marketing/footer.tsx`: replace `#` placeholders with real routes for About, Contact, Privacy, Terms. Leave Blog as `#` (not built yet).

## 4. SEO

- Root `src/app/layout.tsx`:
  - `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')`
  - `title: { default: 'ExamOps — Cloud, DevOps & AI certification prep', template: '%s · ExamOps' }`
  - `description` (default): one sentence, under 160 chars.
  - `openGraph` and `twitter` defaults (siteName "ExamOps", card "summary_large_image").
- Every marketing page (`/`, `/certs`, `/certs/[slug]`, `/about`, `/pricing`, `/faq`, `/privacy`, `/terms`, `/contact`) exports its own `metadata` (or `generateMetadata` for dynamic slug pages) with page-specific title and description.
- New: `src/app/sitemap.ts` — entries for `/`, `/certs`, `/pricing`, `/about`, `/faq`, `/privacy`, `/terms`, `/contact`, and every `/certs/[slug]` from the DB.
- New: `src/app/robots.ts` — allow all except `/admin`, `/api`, `/practice`.
- New: `src/app/opengraph-image.tsx` — Next `ImageResponse`, 1200×630, dark background, brand accent, big "ExamOps" wordmark + one-line tagline.
- On `/certs/[slug]`, inject JSON-LD (schema.org `Course`) in a `<script type="application/ld+json">`: `name`, `description`, `provider: { "@type": "Organization", "name": "ExamOps" }`.
- Add `NEXT_PUBLIC_SITE_URL` to `.env.example` (default `http://localhost:3000`).

## 5. Additional certs + `/certs` index page

- Update `prisma/seed.ts` to also create two "Coming soon" certs:
  - Azure `az-900`, vendor "Azure", `logoSlug: "microsoftazure"`, description "Microsoft's foundational Azure certification. Cloud concepts and core services." — no practice sets, no questions.
  - GCP `associate-cloud-engineer`, vendor "GCP", `logoSlug: "googlecloud"`, description "Google Cloud's entry-level certification for deploying and managing GCP resources." — no practice sets, no questions.
- New: `src/app/(marketing)/certs/page.tsx` — server component. Header "Certifications" + one-line intro. Filter chips (client component using URL search params): All, AWS, Azure, GCP, Kubernetes, DevOps, AI — filter on `vendor`. Grid of cert cards with vendor logo (24px), cert name, question count, and CTA. If a cert has 0 practice sets, the CTA reads "Coming soon" and the card is not clickable.
- Update `/practice` (currently a redirect) — keep the redirect, no change needed.
- Update the homepage hero primary CTA to link to `/certs` (currently already correct if it points to the cert detail page; change to `/certs`).

## 6. Theme polish

- Hero: add a single low-opacity radial gradient behind the H1 using the brand color. No animation, no busy patterns. Use `bg-[radial-gradient(...)]` or an absolutely-positioned div.
- Cards (every card in the app — homepage, `/certs`, cert detail, admin): unify to `rounded-2xl`, `border-white/10` in dark mode, hover state `hover:border-white/20 hover:-translate-y-0.5 transition-all duration-150`. Extract a `<Card>` wrapper if it makes the change less repetitive.
- Section padding: standardize all marketing page sections to `py-24 md:py-32`, container `max-w-6xl mx-auto px-6`. Audit and fix inconsistencies (the report mentioned `py-24` on homepage vs `py-12` on cert detail).
- Type scale: H1 `text-5xl md:text-7xl leading-tight`, H2 `text-3xl md:text-4xl`, body base at 1.6 line-height. Apply consistently across marketing pages.
- Nav scroll blur: `src/components/marketing/nav.tsx` — become a client component if needed, add a throttled scroll listener (use `requestAnimationFrame` throttling, no lodash), toggle a `scrolled` state after 20px. When scrolled, add `bg-background/80 backdrop-blur-md border-b border-white/10`; when not, transparent bg, no border.

## Files expected

New:
- `src/components/vendor-logo.tsx`
- `src/app/(marketing)/about/page.tsx`
- `src/app/(marketing)/pricing/page.tsx`
- `src/app/(marketing)/faq/page.tsx`
- `src/app/(marketing)/privacy/page.tsx`
- `src/app/(marketing)/terms/page.tsx`
- `src/app/(marketing)/contact/page.tsx`
- `src/app/(marketing)/certs/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/opengraph-image.tsx`

Modified:
- `prisma/schema.prisma` (add `logoSlug` to Certification)
- `prisma/seed.ts` (set AWS `logoSlug`, add 2 coming-soon certs)
- `src/app/layout.tsx` (metadata defaults + template)
- `src/app/(marketing)/page.tsx` (hero gradient, hero CTA → `/certs`, add logos to cert cards, unified spacing/type)
- `src/app/(marketing)/certs/[slug]/page.tsx` (add logo to header, JSON-LD, unified spacing, own metadata)
- `src/app/(marketing)/certs/[slug]/notes/[noteId]/page.tsx` (swap to `prose prose-invert`)
- `src/components/marketing/nav.tsx` (Pricing → `/pricing`, scroll blur)
- `src/components/marketing/footer.tsx` (real hrefs for About, Contact, Privacy, Terms)
- `src/app/admin/page.tsx` (add vendor logo to admin cert cards)
- `tailwind.config.ts` (register `@tailwindcss/typography`)

Install: `simple-icons`, `@tailwindcss/typography`.

## Verification (Playwright, all must pass)

1. `/certs` — 3 cert cards render (AWS clickable, Azure and GCP "Coming soon" and non-interactive), vendor logos render for all three.
2. AWS filter chip on `/certs` — only AWS card visible; "All" restores all 3.
3. `/certs/aws-cloud-practitioner` — header shows AWS logo next to the name; view-source contains a `<script type="application/ld+json">` with `"@type":"Course"`.
4. `/about`, `/pricing`, `/faq`, `/privacy`, `/terms`, `/contact` — all render with correct titles (check via `<title>` tag).
5. FAQ page accordion — clicking a question expands and collapses.
6. Footer links — About, Contact, Privacy, Terms all navigate to real pages; Blog stays `#`.
7. Homepage hero — primary CTA navigates to `/certs`.
8. Nav scroll blur — scroll page 100px, confirm nav gains backdrop-blur + border; scroll back to 0, confirm it clears.
9. `/sitemap.xml` — returns XML including all info pages and cert detail slugs.
10. `/robots.txt` — returns rules blocking `/admin`, `/api`, `/practice`.
11. `curl /opengraph-image` (or visit the URL) — returns an image response.
12. Notes page (`/certs/aws-cloud-practitioner/notes/[noteId]`) — heading and body use `prose` styling; no arbitrary-variant utility classes remain in that file.
13. Homepage and cert-detail cards visibly translate up on hover.
14. Screenshots: `/certs`, `/certs/aws-cloud-practitioner` (with logo), `/faq`, `/pricing`, hero scrolled state.

Report each verification step pass/fail.