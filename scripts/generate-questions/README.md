# Question generation pipeline

Generates AWS Certified Cloud Practitioner (CLF-C02) practice questions via the Google Gemini API (free tier), one domain batch at a time, validated against the bulk-upload schema and checked for duplicates against every question already in the database (across all sets).

## Setup

1. Get a free API key at https://aistudio.google.com/apikey.
2. Add it to `.env`:
   ```
   GOOGLE_API_KEY="your-key-here"
   ```

## Usage

```
tsx scripts/generate-questions/generate.ts \
  --cert aws-cloud-practitioner \
  --set 1 \
  --domain "Cloud Concepts" \
  --count 14
```

or via the npm script alias:

```
npm run generate-questions -- --cert aws-cloud-practitioner --set 1 --domain "Cloud Concepts" --count 14
```

Valid `--domain` values (must match exactly): `Cloud Concepts`, `Security and Compliance`, `Cloud Technology and Services`, `Billing, Pricing and Support`.

The script exits non-zero on any validation failure (missing/invalid fields, `correctAnswers` not present in `options`, duplicate options, wrong `domain`/`certSlug`, duplicate text within the batch, or >70% text similarity to an existing question in the bank) and does not write an output file when that happens.

## Review workflow

For each domain, per practice set:

1. Run the generate command for that domain and count.
2. Open the resulting JSON file (`scripts/generate-questions/output/<cert>-set<N>-<domain-slug>-<timestamp>.json`) in VS Code.
3. Read every question. Fix any factual errors or awkward phrasing directly in the JSON — all fields are plain strings, safe to hand-edit.
4. Once satisfied, upload via `/admin/questions/bulk` (paste the JSON or use the file upload).
5. After upload, go to `/admin/certs/aws-cloud-practitioner/sets/<setId>/assign` and assign the newly uploaded questions to the correct practice set.

Repeat for all 4 domains, for each of the 6 sets. After all questions for a set are uploaded and assigned, verify the set has the expected question count (65 for a full set, or 65 total for Set 1 once the 57 generated ones join the 8 already seeded).

## Cross-set deduplication

Every run queries every existing question for the cert (regardless of which set it belongs to) and:
- Passes their text to the model as a "do not repeat" list.
- Independently re-checks each generated question's text for >70% word-level (Jaccard) similarity to any existing question, failing the batch if found.

This means sets can be generated in any order and a later set will never silently duplicate an earlier one.

## Full 6-set plan (390 questions total)

| Set | Cloud Concepts | Security and Compliance | Cloud Technology and Services | Billing, Pricing and Support | Total |
|---|---|---|---|---|---|
| 1 (8 already seeded) | 14 to generate | 17 to generate | 20 to generate | 6 to generate | 65 |
| 2-6 (each) | 16 | 19 | 22 | 8 | 65 |

Generate and review one domain batch at a time — do not run all batches for all 6 sets unattended. Each batch should be eyeballed before upload.
