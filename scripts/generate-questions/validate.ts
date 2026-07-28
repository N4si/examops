import { z } from "zod"

export const generatedQuestionSchema = z.object({
  certSlug: z.string(),
  domain: z.string(),
  text: z.string().min(20),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctAnswers: z.array(z.string().min(1)).min(1).max(3),
  explanation: z.string().min(20),
  detailedExplanation: z.string().min(60),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
})

export const generatedBatchSchema = z.array(generatedQuestionSchema)

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>

export type ValidationError = {
  index: number
  errors: string[]
}

function normalizedTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  Array.from(a).forEach((token) => {
    if (b.has(token)) intersection++
  })
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

const SIMILARITY_THRESHOLD = 0.7

const POSITION_LABELS = ["A", "B", "C", "D"] as const
type PositionLabel = (typeof POSITION_LABELS)[number]

export type AnswerDistribution = {
  counts: Record<PositionLabel, number>
  percentages: Record<PositionLabel, number>
  total: number
}

export function computeAnswerDistribution(questions: GeneratedQuestion[]): AnswerDistribution {
  const positions: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }

  questions.forEach((q) => {
    q.correctAnswers.forEach((correctText) => {
      const idx = q.options.indexOf(correctText)
      if (idx >= 0 && idx < 4) positions[idx]++
    })
  })

  const total = Object.values(positions).reduce((a, b) => a + b, 0)
  const counts = {} as Record<PositionLabel, number>
  const percentages = {} as Record<PositionLabel, number>
  POSITION_LABELS.forEach((label, i) => {
    counts[label] = positions[i]
    percentages[label] = total === 0 ? 0 : positions[i] / total
  })

  return { counts, percentages, total }
}

export function formatAnswerDistribution(
  dist: AnswerDistribution,
  status: "OK" | "FAIL" = "OK"
): string {
  const parts = POSITION_LABELS.map(
    (label) => `${label}×${dist.counts[label]} (${Math.round(dist.percentages[label] * 100)}%)`
  )
  return `Answer distribution: ${parts.join(", ")} — ${status}`
}

const MAX_POSITION_SHARE = 0.4

// Batch-level: answer position distribution check
export function auditAnswerDistribution(questions: GeneratedQuestion[]): string[] {
  const errors: string[] = []
  const dist = computeAnswerDistribution(questions)
  if (dist.total === 0) return errors

  POSITION_LABELS.forEach((label) => {
    const pct = dist.percentages[label]
    if (pct > MAX_POSITION_SHARE) {
      errors.push(
        `Answer position ${label} is over-represented: ${(pct * 100).toFixed(0)}% (>40% threshold). Regenerate batch.`
      )
    }
  })

  return errors
}

/**
 * Validates a batch of generated questions against the bulk-upload schema
 * plus the pipeline's own runtime invariants. Returns per-question errors
 * (empty array = fully valid). Does not throw.
 */
export function validateBatch({
  batch,
  expectedCertSlug,
  expectedDomain,
  existingQuestionTexts,
}: {
  batch: unknown
  expectedCertSlug: string
  expectedDomain: string
  existingQuestionTexts: string[]
}): { errors: ValidationError[]; valid: GeneratedQuestion[]; distribution: AnswerDistribution } {
  const errors: ValidationError[] = []

  const parsed = generatedBatchSchema.safeParse(batch)
  if (!parsed.success) {
    const byIndex = new Map<number, string[]>()
    for (const issue of parsed.error.issues) {
      const index = typeof issue.path[0] === "number" ? issue.path[0] : -1
      const rest = issue.path.slice(1).join(".")
      const message = rest ? `${rest}: ${issue.message}` : issue.message
      byIndex.set(index, [...(byIndex.get(index) ?? []), message])
    }
    Array.from(byIndex.entries()).forEach(([index, msgs]) => {
      errors.push({ index, errors: msgs })
    })
    return { errors, valid: [], distribution: computeAnswerDistribution([]) }
  }

  const questions = parsed.data
  const seenTextInBatch = new Set<string>()
  const existingTokenSets = existingQuestionTexts.map((t) => normalizedTokens(t))

  questions.forEach((q, index) => {
    const qErrors: string[] = []

    if (q.certSlug !== expectedCertSlug) {
      qErrors.push(`certSlug "${q.certSlug}" does not match expected "${expectedCertSlug}"`)
    }

    if (q.domain !== expectedDomain) {
      qErrors.push(`domain "${q.domain}" does not match expected "${expectedDomain}"`)
    }

    const uniqueOptions = new Set(q.options)
    if (uniqueOptions.size !== q.options.length) {
      qErrors.push("options contains duplicates")
    }

    for (const correct of q.correctAnswers) {
      if (!q.options.includes(correct)) {
        qErrors.push(`correctAnswers entry "${correct}" is not present in options`)
      }
    }

    const normalizedText = q.text.trim().toLowerCase()
    if (seenTextInBatch.has(normalizedText)) {
      qErrors.push("text is a duplicate of another question in this batch")
    }
    seenTextInBatch.add(normalizedText)

    const tokens = normalizedTokens(q.text)
    for (let i = 0; i < existingTokenSets.length; i++) {
      const similarity = jaccardSimilarity(tokens, existingTokenSets[i])
      if (similarity > SIMILARITY_THRESHOLD) {
        qErrors.push(
          `text is ${Math.round(similarity * 100)}% similar to an existing question: "${existingQuestionTexts[i].slice(0, 80)}..."`
        )
        break
      }
    }

    if (qErrors.length > 0) {
      errors.push({ index, errors: qErrors })
    }
  })

  if (errors.length > 0) {
    return { errors, valid: [], distribution: computeAnswerDistribution([]) }
  }

  const distribution = computeAnswerDistribution(questions)
  const distributionErrors = auditAnswerDistribution(questions)
  if (distributionErrors.length > 0) {
    return { errors: [{ index: -1, errors: distributionErrors }], valid: [], distribution }
  }

  return { errors: [], valid: questions, distribution }
}
