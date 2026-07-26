# ExamOps — PRD Addendum: AI Scope (v1, finalized)

Appends to `docs/PRD.md`. Four AI touchpoints, all lightweight, all bolted onto the core loop — not a separate AI product.

## AI Feature Specs

**1. AI Roadmap Generator**
Input: chosen cert, diagnostic quiz results (per-domain scores), target exam date.
Output: a day-by-day study plan — which domains to hit first (weakest first), how many practice sessions per week, when to schedule a full mock exam before the target date.
Implementation: single Anthropic API call, structured JSON output (don't stream this one — it's a one-time generation the user reviews, not a chat).

**2. Time Estimator**
Input: current diagnostic/practice performance per domain, target exam date.
Output: estimated hours remaining per domain, rolled into the roadmap above (this isn't a separate feature — it's a calculation that feeds the roadmap generator's output, so build it as part of #1).

**3. Quick Question**
A single "Ask a quick question" box, scoped to whatever cert/topic/question the user is currently viewing. Doubles as the "explain this wrong answer" mechanic — same underlying call, two entry points (on a practice question, and a persistent small input on study-notes pages). Not a full multi-turn chat UI for v1 — one question in, one grounded answer out, with an optional "ask a follow-up" if you want it later.

**4. Search (semantic, over blogs/exam notes/resources)**
This is the one with real infra cost, so sequence it last:
- Embed all study notes / resources / blog content (Anthropic or an embeddings model) into a vector column
- Postgres: use the `pgvector` extension for similarity search — no separate vector DB needed at this scale
- Simple UI: one search bar, results ranked by similarity, falls back to keyword search if embeddings aren't ready yet for new content

## Schema additions (append to section 8 of the PRD)

```
diagnostic_results(id, user_id, cert_id, domain, score, taken_at)
roadmap_generations(id, user_id, cert_id, target_date, plan_json, generated_at)
quick_questions(id, user_id, context_type, context_id, question, answer, created_at)
content_embeddings(id, content_type, content_id, embedding vector(1536), updated_at)
```
`content_type` covers `study_note`, `resource`, `blog_post` — one table, polymorphic, keeps search simple to query across content types.

## Build order (confirmed)
1. Question bank + quick notes
2. Practice exams
3. Streaks + spaced repetition (retention engine)
4. Roadmaps — diagnostic quiz + AI Roadmap Generator + Time Estimator together
5. Resources
6. Search (pgvector)
7. Quick Question / "explain this" (last — smallest, most additive piece)