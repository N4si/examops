# ExamOps — Product Requirements Document (v1)

**Scope of this version:** Cloud (AWS, Azure, GCP), DevOps, Kubernetes, and AI certification prep.
**Builder:** Solo founder + Claude Code. No fixed deadline — built to be pushed fast, iterated on, and grown toward feature parity with (then beyond) Tutorials Dojo, CloudFluently, Whizlabs, ACG, and Udemy.

This doc is intentionally scoped tighter than "every certification in existence." Everything not in Phase 1 is listed in the Roadmap so nothing from the original vision is lost — it's sequenced, not cut.

---

## 1. Vision

**Mission:** Help engineers pass cloud/DevOps/Kubernetes/AI certifications faster, and actually retain the skills, by combining AI-driven study tools with hands-on practice in one place.

**Problem:** Existing platforms are fragmented — video courses (Udemy, ACG) don't test retention well, practice-exam sites (Whizlabs, Tutorials Dojo) don't teach, and almost none use AI to adapt to what a learner is actually getting wrong. Learners end up stitching together 3-4 tools per certification.

**Wedge:** Start with a tight, high-quality loop (practice exams + flashcards + AI tutor that explains *why* you got something wrong, tuned per-question) for the hottest cert categories, and expand outward — rather than launching wide and shallow across every vendor on day one.

**Target audience (v1):** People actively studying for an AWS/Azure/GCP/K8s/DevOps/AI cert in the next 1-3 months — self-taught engineers, career switchers into cloud/DevOps, and working engineers upskilling for a promotion.

**Success metrics (v1):**
- Practice exam completion rate (did they finish, not just start)
- % of users who return 3+ days in a week (studying is a habit — retention is the real product signal)
- Free → Pro conversion rate
- Self-reported pass rate (post-exam survey / badge-share rate)

---

## 2. Competitive Snapshot (condensed)

| Platform | Strength | Gap ExamOps fills |
|---|---|---|
| Tutorials Dojo | Cheap, huge AWS question bank | No AI, dated UI, AWS-only depth |
| CloudFluently | Combines paths + resources + exams | Limited AI, smaller question depth |
| A Cloud Guru | Strong video + hands-on labs | Weak spaced repetition / flashcards, heavy price |
| Whizlabs | Broad cert coverage | Generic UX, no adaptive learning |
| KodeKloud | Best-in-class K8s hands-on labs | Narrow (mostly K8s/DevOps), no exam-readiness AI |

**Our 10x wedge:** an AI tutor that reads *your* wrong answers and explains the underlying concept gap (not just "correct answer is B"), plus a modern, fast, Linear/Vercel-grade UI where everything else feels like 2016 SaaS.

---

## 3. User Personas (v1 set)

- **Career Switcher** — no cloud background, needs structured path + confidence-building
- **Working DevOps/Cloud Engineer** — knows the job, needs focused exam-cram + gap-check
- **AI Engineer** — newer cert category (OpenAI/Anthropic/LangChain-adjacent), less content exists anywhere — real whitespace opportunity
- **Student** — price-sensitive, needs a strong free tier to build habit before paying

---

## 4. MVP Certification Scope

**Cloud**
- AWS: Cloud Practitioner, Solutions Architect Associate, SysOps Associate (expand to full AWS catalog in Phase 2)
- Azure: AZ-900, AZ-104 (expand later)
- GCP: Associate Cloud Engineer (expand later)

**Kubernetes**
- CKA, CKAD, KCNA (CKS added Phase 2 — it's security-adjacent and lower volume)

**DevOps**
- Terraform Associate, Docker Certified Associate, GitHub Actions/Foundations, CI/CD fundamentals (Jenkins/GitLab/ArgoCD content added Phase 2)

**AI**
- Prompt Engineering, RAG fundamentals, Agentic AI fundamentals, OpenAI/Anthropic API-level content — this category has almost no dedicated cert-prep competitor yet, worth over-indexing on early

*Everything else in your original list (full AWS/Azure/GCP catalogs, LFCS/LFCE/RHCSA/RHCE, Security+/CISSP/OSCP, CCNA/CCNP, language certs) — Phase 2+, added by demand once you see which categories users actually search for.*

---

## 5. MVP Feature Set

**Core loop (build first):**
- Practice Exams — timed, per-domain breakdown, retake-weak-areas mode
- Flashcards — spaced repetition (SM-2 algorithm is fine to start)
- Study Notes / Cheat Sheets — per cert, markdown-based, searchable
- AI Tutor — chat grounded in the specific question/topic the user got wrong; explains the concept gap, not just the answer
- Progress Dashboard — per-cert readiness score, streaks, weak-domain breakdown
- Auth + Billing — Free / Pro tiers via Stripe

**Deferred to Phase 2:**
- Interactive terminal / Kubernetes playground / cloud sandboxes (real infra cost — validate demand first)
- Video courses
- Mock interviews, resume builder, job board
- Community, leaderboards, full gamification (XP/badges can be a light Phase 1.5 addition since they're cheap and boost retention)
- Admin panel beyond basic content management

---

## 6. User Journey (v1)

Landing → Signup → Pick a cert → AI generates a study plan (weak-area aware from day 1 via a short diagnostic quiz) → Study (notes + flashcards) → Practice exams → Revision (AI Tutor drills weak domains) → Real exam → Mark certified + share badge (simple, no job board yet).

---

## 7. Pages (v1)

Landing, Pricing, Sign up/Login, Dashboard, Cert Selection, Study Plan, Course/Notes Viewer, Flashcards, Practice Exam (take + review), Progress/Analytics, AI Chat (Tutor), Settings, Search.

*(Blog, Roadmaps hub, Community, Leaderboard, Certificates gallery, Admin/Instructor panels — Phase 2+)*

---

## 8. Database Schema (core v1 tables)

```
users (id, email, name, plan, created_at)
certifications (id, vendor, name, slug, domain_weights_json)
questions (id, cert_id, domain, text, options_json, correct_answer, explanation, difficulty)
exam_attempts (id, user_id, cert_id, started_at, completed_at, score, domain_breakdown_json)
flashcards (id, cert_id, front, back, domain)
flashcard_progress (id, user_id, flashcard_id, ease_factor, interval_days, next_review_at)
study_notes (id, cert_id, domain, title, content_md)
study_plans (id, user_id, cert_id, target_date, plan_json)
subscriptions (id, user_id, stripe_customer_id, plan, status, renews_at)
bookmarks (id, user_id, item_type, item_id)
ai_chat_sessions (id, user_id, question_id_nullable, messages_json)
```

Relationships: users 1—N exam_attempts / subscriptions / study_plans / bookmarks; certifications 1—N questions / flashcards / study_notes; users N—N flashcards via flashcard_progress.

---

## 9. API Design (core v1 routes)

```
POST   /api/auth/*             (handled by Clerk/Auth.js)
GET    /api/certifications
GET    /api/certifications/:slug
GET    /api/questions?cert=&domain=
POST   /api/exams/start
POST   /api/exams/:id/submit
GET    /api/exams/:id/results
GET    /api/flashcards?cert=
POST   /api/flashcards/:id/review        (SM-2 update)
GET    /api/notes?cert=&domain=
POST   /api/study-plan/generate          (AI-generated, diagnostic-aware)
POST   /api/ai/tutor                      (grounded chat on a question/topic)
POST   /api/billing/checkout
POST   /api/billing/webhook
GET    /api/progress/:certId
```

---

## 10. Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes (skip a separate NestJS service for v1 — unnecessary complexity solo)
- **DB:** PostgreSQL + Prisma (YugabyteDB is a Postgres-wire-compatible drop-in if you later want distributed scaling without an ORM migration)
- **Auth:** Clerk (fastest to ship solo) or Auth.js if you want to avoid a monthly per-user cost early
- **Payments:** Stripe
- **AI:** Anthropic API (tutor, study plan generation, flashcard/quiz generation)
- **Search:** Postgres full-text search for v1; Meilisearch once content volume justifies it
- **Analytics:** PostHog
- **Email:** Resend
- **Hosting:** Vercel (frontend+API), point your `examops` domain here via DNS once deployed

---

## 11. UI/UX Direction

Linear/Vercel/Apple-inspired: high-contrast dark mode default, generous whitespace, one accent color, fast page transitions, no visual clutter. Typography: one serif-free, high-legibility font (e.g. Inter or Geist) throughout. Every core loop screen (exam, flashcard, tutor chat) should feel instant — this is a big differentiator vs. the dated feel of Whizlabs/Tutorials Dojo.

---

## 12. Monetization (v1)

- **Free:** limited daily practice questions, limited flashcards, no AI tutor
- **Pro (monthly/annual):** unlimited practice exams, full flashcard decks, AI tutor, study plans, progress analytics
- **Student discount:** flat % off Pro with edu email verification
- (Team/Enterprise tiers — Phase 3, once there's a B2B signal)

---

## 13. Roadmap

**Phase 1 — MVP (solo, ship-first target):**
Core loop above: cert selection, practice exams, flashcards, notes, AI tutor, progress dashboard, billing. Ship with AWS + one Kubernetes cert + one AI cert to start generating real usage data fastest, then broaden within this same phase.

**Phase 2 — Growth:**
Full AWS/Azure/GCP catalogs, remaining Kubernetes/DevOps certs, light gamification (streaks/badges), blog + programmatic SEO pages per cert/question, community basics.

**Phase 3 — Depth/AI:**
Interactive labs/sandboxes (K8s playground, cloud sandboxes), AI mock interviewer, resume review, mobile-responsive polish push.

**Phase 4 — Enterprise/Expansion:**
Security + networking + programming-language cert categories, team/enterprise plans, job board, instructor/admin tooling at scale.

**Phase 5 — Mobile apps.**

---

## 14. How to use this with Claude Code

Feed this file to Claude Code as `docs/PRD.md` in a fresh repo, then work phase-by-phase:
1. Scaffold Next.js + Prisma + Tailwind + shadcn/ui project structure
2. Implement the DB schema (section 8) as a Prisma schema, run initial migration
3. Build one vertical slice first: cert selection → practice exam → results (this validates the whole stack before building everything else)
4. Layer in flashcards, notes, AI tutor, billing
5. Deploy to Vercel, point the `examops` domain at it