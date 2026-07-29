export type DomainPlanItem = { domain: string; count: number }

const WEIGHT_SUM_TOLERANCE = 0.01

/**
 * Converts a cert's domainWeights (fractions summing to ~1) into integer
 * per-domain question counts summing to exactly examQuestionCount, via
 * largest-remainder apportionment (floor each, then hand out the leftover
 * one-at-a-time to the domains with the biggest fractional remainder).
 * Plain per-domain rounding doesn't guarantee the total adds back up.
 */
export function computeDomainPlan(
  examQuestionCount: number,
  domainWeights: Record<string, number>
): DomainPlanItem[] {
  const domains = Object.keys(domainWeights)
  if (domains.length === 0) {
    throw new Error("domainWeights is empty — cannot compute a domain plan")
  }

  const weightSum = domains.reduce((sum, d) => sum + domainWeights[d], 0)
  if (Math.abs(weightSum - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new Error(
      `domainWeights must sum to ~1.0, got ${weightSum.toFixed(4)} (domains: ${domains.join(", ")})`
    )
  }

  const raw = domains.map((d) => examQuestionCount * domainWeights[d])
  const floors = raw.map(Math.floor)
  const floorSum = floors.reduce((a, b) => a + b, 0)
  const remainder = examQuestionCount - floorSum

  const byFractionalDesc = domains
    .map((_, i) => ({ i, frac: raw[i] - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)

  const counts = [...floors]
  for (let k = 0; k < remainder; k++) {
    counts[byFractionalDesc[k].i]++
  }

  return domains.map((domain, i) => ({ domain, count: counts[i] }))
}
