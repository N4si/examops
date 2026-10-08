// Role-based roadmap definitions. Each role is an ordered list of cert slugs —
// some may not exist in the DB yet (future certs), which the role page
// renders as "Coming soon" steps rather than skipping. Editing this list is
// the only thing needed to add a cert to a role path — no schema change.
export type RoleRoadmap = {
  slug: string
  name: string
  description: string
  certSlugs: string[]
}

export const ROLE_ROADMAPS: RoleRoadmap[] = [
  {
    slug: "cloud-practitioner",
    name: "Cloud Practitioner",
    description: "Foundational, vendor-by-vendor — start here if you're new to cloud.",
    certSlugs: ["aws-cloud-practitioner", "az-900", "associate-cloud-engineer"],
  },
  {
    slug: "cloud-engineer",
    name: "Cloud Engineer",
    description: "From foundations to hands-on infrastructure across AWS and Azure.",
    certSlugs: [
      "aws-cloud-practitioner",
      "aws-solutions-architect-associate",
      "associate-cloud-engineer",
      "az-104",
    ],
  },
  {
    slug: "devops-engineer",
    name: "DevOps Engineer",
    description: "CI/CD, containers, and infrastructure-as-code across the stack.",
    certSlugs: [
      "aws-cloud-practitioner",
      "aws-devops-engineer-professional",
      "cka",
      "hashicorp-terraform-associate",
    ],
  },
  {
    slug: "security-engineer",
    name: "Security Engineer",
    description: "Cloud security fundamentals through vendor security specialties.",
    certSlugs: ["aws-cloud-practitioner", "aws-security-specialty"],
  },
]

export function getRoleRoadmap(slug: string): RoleRoadmap | undefined {
  return ROLE_ROADMAPS.find((r) => r.slug === slug)
}

export type DomainStep = {
  domain: string
  questionCount: number
  weight: number
  estimatedMinutes: number
}

// Rough, clearly-labeled estimate — not a measured study-time model.
const MINUTES_PER_QUESTION = 1.5

export function buildDomainSteps(
  domainWeights: Record<string, number> | null,
  questionCountsByDomain: Record<string, number>
): DomainStep[] {
  if (!domainWeights) return []

  return Object.entries(domainWeights)
    .map(([domain, weight]) => {
      const questionCount = questionCountsByDomain[domain] ?? 0
      return {
        domain,
        questionCount,
        weight,
        estimatedMinutes: Math.round(questionCount * MINUTES_PER_QUESTION),
      }
    })
    .sort((a, b) => b.weight - a.weight)
}
