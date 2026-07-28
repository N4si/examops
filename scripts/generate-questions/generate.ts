try {
  process.loadEnvFile(".env")
} catch {
  // .env not present (e.g. CI) — fall back to whatever is already in the environment
}

import { writeFileSync } from "fs"
import { GoogleGenAI } from "@google/genai"

import { PrismaClient } from "@prisma/client"
import { buildSystemPrompt, getDomainConcepts, buildUserPrompt } from "./prompts"
import { formatAnswerDistribution, validateBatch } from "./validate"
import { extractSourceConcepts, readSourceFile, wordCount } from "./source"
import { buildSummaryMarkdown, computeOverlapWarnings, type GenerationSummary } from "./summary"

const MODEL = "gemini-flash-latest"

// Approximate paid-tier Gemini Flash pricing, for reference only — this
// pipeline is expected to run on the free tier where the real cost is $0.
const PRICE_PER_MILLION_INPUT_TOKENS = 0.3
const PRICE_PER_MILLION_OUTPUT_TOKENS = 2.5

// A source concept phrased this tersely forced the model to invent scenario
// detail beyond what the source actually said — worth a second look.
const TERSE_CONCEPT_WORD_THRESHOLD = 4

type Args = {
  cert: string
  set: number
  domain: string
  count: number
  out?: string
  source?: string
}

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const value = argv[i + 1]
      flags[key] = value
      i++
    }
  }

  const missing = ["cert", "set", "domain", "count"].filter((k) => !flags[k])
  if (missing.length > 0) {
    console.error(
      `Missing required argument(s): ${missing.map((m) => `--${m}`).join(", ")}\n\n` +
        `Usage:\n  tsx scripts/generate-questions/generate.ts --cert <slug> --set <number> --domain "<name>" --count <n> [--out <path>] [--source <path>]`
    )
    process.exit(1)
  }

  const set = Number(flags.set)
  const count = Number(flags.count)
  if (!Number.isInteger(set) || set < 1) {
    console.error(`--set must be a positive integer, got "${flags.set}"`)
    process.exit(1)
  }
  if (!Number.isInteger(count) || count < 1) {
    console.error(`--count must be a positive integer, got "${flags.count}"`)
    process.exit(1)
  }

  return { cert: flags.cert, set, domain: flags.domain, count, out: flags.out, source: flags.source }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const QUESTION_ITEM_SCHEMA = {
  type: "object",
  properties: {
    certSlug: { type: "string" },
    domain: { type: "string" },
    text: { type: "string" },
    options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
    correctAnswers: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    explanation: { type: "string" },
    detailedExplanation: { type: "string" },
    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
  },
  required: [
    "certSlug",
    "domain",
    "text",
    "options",
    "correctAnswers",
    "explanation",
    "detailedExplanation",
    "difficulty",
  ],
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: { type: "array", items: QUESTION_ITEM_SCHEMA },
  },
  required: ["questions"],
}

type TokenUsage = { inputTokens: number; outputTokens: number }

async function generateBatch({
  ai,
  userPrompt,
  certName,
}: {
  ai: GoogleGenAI
  userPrompt: string
  certName: string
}): Promise<{ questions: unknown[]; usage: TokenUsage }> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: buildSystemPrompt(certName),
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 16000,
    },
  })

  const rawText = response.text
  if (!rawText) {
    console.error("Model returned no text output. Full response:")
    console.error(JSON.stringify(response, null, 2))
    process.exit(1)
  }

  let parsedResponse: { questions: unknown[] }
  try {
    parsedResponse = JSON.parse(rawText)
  } catch {
    console.error("Model output was not valid JSON:")
    console.error(rawText)
    process.exit(1)
  }

  const usage = response.usageMetadata
  return {
    questions: parsedResponse.questions,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    },
  }
}

// Case-insensitive substring match in either direction — "is this domain
// objective already addressed by this source concept, or vice versa."
function conceptCoveredBySource(domainConcept: string, sourceConcepts: string[]): boolean {
  const a = domainConcept.toLowerCase()
  return sourceConcepts.some((s) => {
    const b = s.toLowerCase()
    return a.includes(b) || b.includes(a)
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.error(
      "GOOGLE_API_KEY is not set. Add it to .env (see .env.example) — get a free key at https://aistudio.google.com/apikey"
    )
    process.exit(1)
  }

  // --source is validated (extension, existence, non-empty) before any API
  // calls or DB queries — fail fast, matching the pipeline's existing style.
  const sourceText = args.source ? readSourceFile(args.source) : null

  const prisma = new PrismaClient()

  let existingQuestionTexts: string[]
  let certName: string
  try {
    const cert = await prisma.certification.findUnique({ where: { slug: args.cert } })
    if (!cert) {
      console.error(`Unknown cert slug "${args.cert}" — no matching Certification row.`)
      process.exit(1)
    }
    certName = cert.name
    const existing = await prisma.question.findMany({
      where: { certId: cert.id },
      select: { text: true },
    })
    existingQuestionTexts = existing.map((q) => q.text)
  } finally {
    await prisma.$disconnect()
  }

  console.log(
    `Generating ${args.count} question(s) for cert="${args.cert}" set=${args.set} domain="${args.domain}"...`
  )
  console.log(`Existing questions in bank (all sets, for dedup): ${existingQuestionTexts.length}`)

  const ai = new GoogleGenAI({ apiKey })

  let combinedQuestions: unknown[]
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let summary: GenerationSummary | null = null
  let sourceDerivedCount = 0

  if (sourceText) {
    console.log(`Reading source material from ${args.source}...`)
    const sourceWordCount = wordCount(sourceText)

    const { extraction, inputTokens, outputTokens } = await extractSourceConcepts({
      ai,
      model: MODEL,
      sourceText,
    })
    totalInputTokens += inputTokens
    totalOutputTokens += outputTokens
    console.log(`Source concepts extracted: ${extraction.concepts.length}`)

    // Step 3: cover source concepts first, one question per concept, capped
    // at --count.
    const sourceConceptsUsed = extraction.concepts.slice(0, args.count)
    const sourceConceptsUnused = extraction.concepts.slice(sourceConceptsUsed.length)
    const remainingAfterSource = args.count - sourceConceptsUsed.length

    // Step 4: gap-fill from the official domain objectives, skipping any
    // already covered by the source material (case-insensitive substring).
    const domainInfo = getDomainConcepts(args.cert, args.domain)
    if (!domainInfo) {
      console.warn(
        `No domain objectives configured for cert "${args.cert}" domain "${args.domain}" — proceeding with source-only generation (no gap-fill).`
      )
    }
    const gapConceptsAvailable = domainInfo
      ? domainInfo.concepts.filter((c) => !conceptCoveredBySource(c, extraction.concepts))
      : []
    const gapConceptsUsed = gapConceptsAvailable.slice(0, Math.max(0, remainingAfterSource))
    const domainObjectivesNotCovered = gapConceptsAvailable.slice(gapConceptsUsed.length)

    let sourceBatch: unknown[] = []
    if (sourceConceptsUsed.length > 0) {
      const userPrompt = buildUserPrompt({
        domain: args.domain,
        certSlug: args.cert,
        certName,
        count: sourceConceptsUsed.length,
        existingQuestionTexts,
        sourceConcepts: sourceConceptsUsed,
      })
      const result = await generateBatch({ ai, userPrompt, certName })
      sourceBatch = result.questions
      totalInputTokens += result.usage.inputTokens
      totalOutputTokens += result.usage.outputTokens
    }
    sourceDerivedCount = sourceConceptsUsed.length

    let gapBatch: unknown[] = []
    if (gapConceptsUsed.length > 0) {
      const sourceBatchTexts = (sourceBatch as { text?: string }[])
        .map((q) => q?.text)
        .filter((t): t is string => Boolean(t))
      const userPrompt = buildUserPrompt({
        domain: args.domain,
        certSlug: args.cert,
        certName,
        count: gapConceptsUsed.length,
        existingQuestionTexts: [...existingQuestionTexts, ...sourceBatchTexts],
        gapConcepts: gapConceptsUsed,
      })
      const result = await generateBatch({ ai, userPrompt, certName })
      gapBatch = result.questions
      totalInputTokens += result.usage.inputTokens
      totalOutputTokens += result.usage.outputTokens
    }

    combinedQuestions = [...sourceBatch, ...gapBatch]

    const overlapWarnings = computeOverlapWarnings(sourceConceptsUsed, gapConceptsUsed)

    const needsReview = sourceConceptsUsed
      .map((concept, i) => ({ concept, i }))
      .filter(({ concept }) => concept.split(/\s+/).filter(Boolean).length <= TERSE_CONCEPT_WORD_THRESHOLD)
      .map(({ concept, i }) => ({
        questionNumber: i + 1,
        reason: `Source concept "${concept}" was stated briefly — generated scenario details may be AI-inferred beyond the source text.`,
      }))

    summary = {
      domain: args.domain,
      set: args.set,
      count: args.count,
      sourcePath: args.source as string,
      sourceWordCount,
      sourceConceptsExtracted: extraction.concepts.length,
      questionsFromSource: sourceConceptsUsed.length,
      questionsFromGapFill: gapConceptsUsed.length,
      totalGenerated: sourceConceptsUsed.length + gapConceptsUsed.length,
      conceptsCoveredFromSource: sourceConceptsUsed,
      gapFillConcepts: gapConceptsUsed,
      sourceConceptsNotConverted: sourceConceptsUnused.map((concept) => ({
        concept,
        reason: "--count limit reached before this concept was used",
      })),
      domainObjectivesNotCovered,
      needsReview,
      overlapWarnings,
    }
  } else {
    // Without --source: current behavior, unchanged.
    const userPrompt = buildUserPrompt({
      domain: args.domain,
      certSlug: args.cert,
      certName,
      count: args.count,
      existingQuestionTexts,
    })
    const result = await generateBatch({ ai, userPrompt, certName })
    combinedQuestions = result.questions
    totalInputTokens += result.usage.inputTokens
    totalOutputTokens += result.usage.outputTokens
  }

  const { errors, valid, distribution } = validateBatch({
    batch: combinedQuestions,
    expectedCertSlug: args.cert,
    expectedDomain: args.domain,
    existingQuestionTexts,
  })

  if (errors.length > 0) {
    console.error(`\nValidation FAILED — ${errors.length} question(s)/checks had errors:\n`)
    for (const { index, errors: qErrors } of errors) {
      console.error(index === -1 ? "  [batch-level]" : `  [index ${index}]`)
      for (const e of qErrors) console.error(`    - ${e}`)
    }
    if (distribution.total > 0) {
      console.error(`\n${formatAnswerDistribution(distribution, "FAIL")}`)
    }
    console.error("\nNo output file was written.")
    process.exit(1)
  }

  // Without --source, valid.length must equal --count exactly (unchanged
  // behavior). With --source, a shortfall vs --count is expected when source
  // + domain objectives run out — that's reported in the summary, not an
  // error — but valid.length must still equal what we actually asked for.
  const expectedCount = summary ? summary.totalGenerated : args.count
  if (valid.length !== expectedCount) {
    console.error(
      `Expected ${expectedCount} questions but got ${valid.length} after validation. No output file was written.`
    )
    process.exit(1)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const outPath =
    args.out ??
    `scripts/generate-questions/output/${args.cert}-set${args.set}-${slugify(args.domain)}-${timestamp}.json`

  writeFileSync(outPath, JSON.stringify(valid, null, 2))

  if (summary) {
    const summaryPath = outPath.replace(/\.json$/, ".summary.md")
    writeFileSync(summaryPath, buildSummaryMarkdown(summary))
    console.log(`Summary written to: ${summaryPath}`)
  }

  const difficultyBreakdown = valid.reduce<Record<string, number>>((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1
    return acc
  }, {})

  const estimatedCost =
    (totalInputTokens / 1_000_000) * PRICE_PER_MILLION_INPUT_TOKENS +
    (totalOutputTokens / 1_000_000) * PRICE_PER_MILLION_OUTPUT_TOKENS

  console.log("\n=== Summary ===")
  console.log(`Questions generated: ${valid.length}${sourceText ? ` (${sourceDerivedCount} from source, ${valid.length - sourceDerivedCount} gap-fill)` : ""}`)
  if (summary && summary.totalGenerated < summary.count) {
    console.log(`Shortfall: requested ${summary.count}, generated ${summary.totalGenerated}.`)
  }
  console.log(
    `Difficulty breakdown: ${Object.entries(difficultyBreakdown)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`
  )
  console.log(formatAnswerDistribution(distribution, "OK"))
  console.log(`Tokens: input=${totalInputTokens} output=${totalOutputTokens}`)
  console.log(
    `Estimated cost (paid-tier reference, actual cost on free tier is $0): $${estimatedCost.toFixed(4)}`
  )
  console.log(`Output written to: ${outPath}`)
}

main().catch((err) => {
  console.error("Unexpected error:")
  console.error(err)
  process.exit(1)
})
