export type GenerationSummary = {
  domain: string
  set: number
  count: number
  sourcePath: string
  sourceWordCount: number
  sourceConceptsExtracted: number
  questionsFromSource: number
  questionsFromGapFill: number
  totalGenerated: number
  conceptsCoveredFromSource: string[]
  gapFillConcepts: string[]
  sourceConceptsNotConverted: { concept: string; reason: string }[]
  domainObjectivesNotCovered: string[]
  needsReview: { questionNumber: number; reason: string }[]
  overlapWarnings: { source: string; gapFill: string }[]
}

// Common English filler words stripped before the Jaccard overlap check —
// otherwise two unrelated concepts that both happen to say "for" and "the"
// would look artificially similar.
const OVERLAP_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "is", "it", "its", "of", "on", "or", "that", "the", "this", "to", "using",
  "via", "with", "such",
])

function overlapTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 0 && !OVERLAP_STOPWORDS.has(t))
  )
}

function overlapJaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  a.forEach((token) => {
    if (b.has(token)) intersection++
  })
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

const OVERLAP_THRESHOLD = 0.3

/**
 * Warning-only signal that a gap-fill concept may cover the same ground as a
 * source concept the substring-match dedup missed (different wording, same
 * topic). Does not affect generation or block anything.
 */
export function computeOverlapWarnings(
  sourceConcepts: string[],
  gapFillConcepts: string[]
): { source: string; gapFill: string }[] {
  const warnings: { source: string; gapFill: string }[] = []
  for (const source of sourceConcepts) {
    const sourceTokens = overlapTokens(source)
    for (const gapFill of gapFillConcepts) {
      const similarity = overlapJaccard(sourceTokens, overlapTokens(gapFill))
      if (similarity >= OVERLAP_THRESHOLD) {
        warnings.push({ source, gapFill })
      }
    }
  }
  return warnings
}

export function buildSummaryMarkdown(s: GenerationSummary): string {
  const lines: string[] = []

  lines.push(`Batch: ${s.domain}, Set ${s.set} — ${s.count} questions`)
  lines.push(`Source: ${s.sourcePath} (${s.sourceWordCount} words)`)
  lines.push("")
  lines.push(`Source concepts extracted: ${s.sourceConceptsExtracted}`)
  lines.push(`Questions from source: ${s.questionsFromSource}`)
  lines.push(`Questions from domain objectives (gap fill): ${s.questionsFromGapFill}`)
  lines.push(`Total generated: ${s.totalGenerated}`)
  lines.push("")

  lines.push("Concepts covered from source:")
  if (s.conceptsCoveredFromSource.length === 0) {
    lines.push("- none")
  } else {
    s.conceptsCoveredFromSource.forEach((c) => lines.push(`- ${c}`))
  }
  lines.push("")

  lines.push("Gap-fill concepts (from official domain objectives):")
  if (s.gapFillConcepts.length === 0) {
    lines.push("- none")
  } else {
    s.gapFillConcepts.forEach((c) => lines.push(`- ${c} (added: not covered by source)`))
  }
  lines.push("")

  lines.push("Potential overlapping concepts (review manually):")
  if (s.overlapWarnings.length === 0) {
    lines.push("- none")
  } else {
    s.overlapWarnings.forEach(({ source, gapFill }) => {
      lines.push(`- Source: "${source}"`)
      lines.push(`  Gap-fill: "${gapFill}"`)
    })
  }
  lines.push("")

  lines.push("Concepts in source not converted to questions:")
  if (s.sourceConceptsNotConverted.length === 0) {
    lines.push("- none")
  } else {
    s.sourceConceptsNotConverted.forEach(({ concept, reason }) =>
      lines.push(`- ${concept} (skipped: ${reason})`)
    )
  }
  lines.push("")

  lines.push("Domain objectives NOT covered by this batch:")
  if (s.domainObjectivesNotCovered.length === 0) {
    lines.push("- none")
  } else {
    s.domainObjectivesNotCovered.forEach((o) => lines.push(`- ${o}`))
  }
  lines.push("")

  lines.push("May need manual review:")
  if (s.needsReview.length === 0) {
    lines.push("- none")
  } else {
    s.needsReview.forEach(({ questionNumber, reason }) =>
      lines.push(`- Q${questionNumber}: ${reason}`)
    )
  }

  if (s.totalGenerated < s.count) {
    lines.push("")
    lines.push(
      `Shortfall: requested ${s.count}, generated ${s.totalGenerated} — source concepts and domain objectives were exhausted before reaching the requested count. No unrelated filler content was generated.`
    )
  }

  return lines.join("\n") + "\n"
}
