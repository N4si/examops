# ExamOps — Source-First Question Generation Spec

Additive change to the existing pipeline. Zero regression: script behaves identically when `--source` is omitted.

## Behavior

New optional CLI flag: `--source <path>` accepting `.md` or `.txt` files only. Any other extension → exit 1 with message "Only .md and .txt supported in v1".

### With `--source`

1. Read the source file. If empty (<50 chars of non-whitespace), exit 1 with "Source file appears empty".
2. Extract concepts + learning objectives via one Gemini call (`extractSourceConcepts()`). Returns:
   ```ts
   { concepts: string[]; learningObjectives: string[] }
   ```
3. Generate questions covering source concepts FIRST. If more questions requested than source concepts can cleanly support (rough guide: ~1 question per concept, occasionally 2 for foundational concepts), continue to step 4.
4. **Gap fill**: for remaining question count, pull from the existing `DOMAIN_CONCEPTS[domain].concepts` list in `prompts.ts` — these are the official CLF-C02 domain objectives, already curated. Skip any concept already covered by the source (case-insensitive substring match on concept text is fine).
5. Never invent topics outside source + `DOMAIN_CONCEPTS`. If steps 3+4 combined still cannot produce `--count` questions (source concepts exhausted AND domain objectives exhausted with no gaps), generate as many as possible and log the shortfall in the summary. Do NOT pad with unrelated content.
6. Existing validation runs unchanged on the final batch.

### Without `--source`

Current behavior. Not one line of change.

## Summary file

Written to `output/<same-name>.summary.md` alongside the JSON:

```
Batch: <domain>, Set <n> — <count> questions
Source: <path> (<word count> words)

Source concepts extracted: <N>
Questions from source: <M>
Questions from domain objectives (gap fill): <K>
Total generated: <M+K>

Concepts covered from source:
- <concept 1>
- <concept 2>
...

Gap-fill concepts (from official domain objectives):
- <concept X> (added: not covered by source)
- <concept Y> (added: not covered by source)

Concepts in source not converted to questions:
- <concept Z> (skipped: <reason — e.g. too narrow / already covered by seed data / redundant with concept W>)

Domain objectives NOT covered by this batch:
- <objective A>
- <objective B>

May need manual review:
- Q<n>: <brief reason — e.g. source described concept abstractly, generated scenario is AI-inferred>
```

When `--source` is not provided, no summary file is written (current behavior).

## Files

New:
- `scripts/generate-questions/source.ts` — file reading + `extractSourceConcepts()` (one Gemini call, structured output via `responseJsonSchema`)
- `scripts/generate-questions/summary.ts` — builds the `.summary.md` file from a `GenerationSummary` object

Modified:
- `scripts/generate-questions/generate.ts` — parse `--source`, orchestrate: extract → generate source-derived → gap-fill from `DOMAIN_CONCEPTS` → validate → write JSON + summary
- `scripts/generate-questions/prompts.ts` — add `buildSourceExtractionPrompt()` and update `buildUserPrompt()` to accept `{ sourceConcepts?: string[]; gapConcepts?: string[]; existingQuestionTexts: string[] }` — when both source and gap concepts are present, the prompt makes clear that source concepts are authoritative and gap concepts fill remaining questions

NOT modified:
- `validate.ts` — same validation, same thresholds
- `/api/admin/questions/bulk` — same JSON shape
- `prisma/schema.prisma` — no schema changes
- Admin UI — no changes

## Verification (Claude Code runs, reports back)

1. `--source` with `.pdf` → exits 1 with correct message
2. `--source` pointing to non-existent file → exits 1 with clear error
3. `--source` pointing to empty file → exits 1 with correct message
4. Without `--source`: run the existing Cloud Concepts 2-question smoke test, confirm identical behavior (no summary file, no source references in generated questions, output JSON has same shape).
5. With `--source ./test-source.md` (create a small 300-word `.md` test file covering 3 AWS security concepts: shared responsibility, IAM roles, KMS): generate 5 Security & Compliance questions. Verify:
   - JSON contains 5 questions
   - `.summary.md` exists next to JSON
   - Summary shows "Source concepts extracted: 3", "Questions from source: 3", "Questions from domain objectives (gap fill): 2"
   - The 2 gap-fill questions cover concepts NOT in the source
6. Same test with `--count 3` (fewer than source concepts): confirm all 3 questions come from source, no gap fill occurs, summary shows the unused source concepts under "Concepts in source not converted".
7. Same test with `--count 15` (way more than source + domain objectives combined): confirm script generates as many as possible, logs shortfall clearly in summary, exits 0 (not an error — an underrun with visibility).

Delete `test-source.md` after verification. Do NOT upload any of these test batches to the DB — verification only.

## Explicit non-goals

- No PDF support (v2)
- No AI review agent
- No new dependencies
- No changes to review workflow (user still greenlights before upload)
- No changes to upload/assign flow