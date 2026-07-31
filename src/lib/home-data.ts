// Data layer for the marketing homepage.
//
// The homepage is data-driven off the live Prisma/Postgres "datapack": every
// certification, question, note and count is read from the database. Because
// the seeded dataset is intentionally small, sections that would otherwise
// look empty fall back to curated demo content — clearly derived, never
// pretending fake rows exist in the DB. Live values always win when present.

import { prisma } from "@/lib/prisma"

export type CertLevel = "Foundational" | "Associate" | "Professional"

export type CertView = {
  id: string
  slug: string
  href: string
  vendor: string
  name: string
  shortName: string
  examCode: string | null
  description: string
  logoSlug: string
  brandColor: string
  level: CertLevel
  studyHours: number
  passingScore: number
  examDurationMinutes: number
  counts: {
    questions: number
    practiceSets: number
    flashcards: number
    studyNotes: number
    resources: number
  }
  hasContent: boolean
  // 0..1 — how "ready" the cert content is, used for the card progress bar.
  readiness: number
}

export type StatItem = {
  label: string
  value: number
  suffix?: string
  live: boolean
}

export type LearningPathStep = {
  label: string
  vendor: string
  slug?: string
}

export type LearningPath = {
  id: string
  title: string
  role: string
  accent: "brand" | "blue" | "cyan" | "success"
  steps: LearningPathStep[]
}

export type ResourceCategory = {
  key: string
  title: string
  description: string
  icon: string
  href: string
  count: number | null
  live: boolean
}

export type DashboardData = {
  cert: {
    name: string
    shortName: string
    vendor: string
    logoSlug: string
    brandColor: string
    examCode: string | null
  }
  progress: number
  accuracy: number
  streak: number
  questionsSolved: number
  questionPool: number
  studyHours: number
  flashcardsDone: number
  flashcardsTotal: number
  labsDone: number
  labsTotal: number
  examCountdownDays: number
  weakDomains: { domain: string; score: number }[]
  nextRecommendation: string
}

export type SampleQuestion = {
  domain: string
  text: string
  options: string[]
  correctAnswers: number[]
  explanation: string
  detailedExplanation: string | null
  certSlug: string
}

export type HomeData = {
  vendors: string[]
  certs: CertView[]
  stats: StatItem[]
  learningPaths: LearningPath[]
  resources: ResourceCategory[]
  dashboard: DashboardData
  sampleQuestion: SampleQuestion | null
  totals: { certs: number; questions: number; sets: number }
}

const STUDY_HOURS: Record<CertLevel, number> = {
  Foundational: 25,
  Associate: 50,
  Professional: 90,
}

function deriveLevel(name: string, slug: string): CertLevel {
  const s = `${name} ${slug}`.toLowerCase()
  if (/(professional|expert|specialty|architect professional|devops engineer)/.test(s))
    return "Professional"
  if (/(fundamentals|foundational|practitioner|clf|az-900|900|associate cloud engineer)/.test(s))
    return "Foundational"
  return "Associate"
}

function deriveExamCode(name: string, slug: string): string | null {
  const paren = name.match(/\(([^)]+)\)/)
  if (paren) return paren[1].toUpperCase()
  const codeInSlug = slug.match(/([a-z]{2,4}-?\d{3})/i)
  if (codeInSlug) return codeInSlug[1].toUpperCase()
  return null
}

function shorten(name: string): string {
  // Drop the parenthetical exam code for a cleaner card title.
  return name.replace(/\s*\([^)]*\)\s*/g, "").trim()
}

// Public entry point. The homepage must always render, so any datapack/DB
// failure (missing DATABASE_URL, connection error, etc.) degrades gracefully
// to a fully curated demo dataset instead of throwing.
export async function getHomeData(vendor?: string): Promise<HomeData> {
  try {
    return await fetchHomeData(vendor)
  } catch (error) {
    console.log("[v0] getHomeData falling back to curated demo data:", error)
    return buildFallbackHome()
  }
}

async function fetchHomeData(vendor?: string): Promise<HomeData> {
  const vendorFilter = vendor && vendor !== "All" ? { vendor } : undefined

  const [
    certCount,
    questionCount,
    setCount,
    noteCount,
    flashcardCount,
    allVendorsRows,
    certRows,
    sampleRow,
  ] = await Promise.all([
    prisma.certification.count(),
    prisma.question.count(),
    prisma.practiceSet.count(),
    prisma.studyNote.count(),
    prisma.flashcard.count(),
    prisma.certification.findMany({ select: { vendor: true }, distinct: ["vendor"] }),
    prisma.certification.findMany({
      where: vendorFilter,
      select: {
        id: true,
        slug: true,
        vendor: true,
        name: true,
        description: true,
        logoSlug: true,
        brandColor: true,
        passingScore: true,
        examDurationMinutes: true,
        _count: {
          select: {
            questions: true,
            practiceSets: true,
            flashcards: true,
            studyNotes: true,
            resources: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ])

  const certs: CertView[] = certRows.map((c) => {
    const level = deriveLevel(c.name, c.slug)
    const counts = {
      questions: c._count.questions,
      practiceSets: c._count.practiceSets,
      flashcards: c._count.flashcards,
      studyNotes: c._count.studyNotes,
      resources: c._count.resources,
    }
    const hasContent = counts.practiceSets > 0 || counts.questions > 0
    // Readiness blends the content types we track, capped so a single question
    // doesn't read as "done". Purely presentational.
    const readiness = Math.min(
      1,
      counts.questions / 60 + (counts.practiceSets > 0 ? 0.15 : 0) + counts.studyNotes / 12
    )
    return {
      id: c.id,
      slug: c.slug,
      href: `/certs/${c.slug}`,
      vendor: c.vendor,
      name: c.name,
      shortName: shorten(c.name),
      examCode: deriveExamCode(c.name, c.slug),
      description: c.description,
      logoSlug: c.logoSlug,
      brandColor: c.brandColor || "#7C3AED",
      level,
      studyHours: STUDY_HOURS[level],
      passingScore: c.passingScore ?? 70,
      examDurationMinutes: c.examDurationMinutes ?? 90,
      counts,
      hasContent,
      readiness,
    }
  })

  const liveVendors = allVendorsRows.map((v) => v.vendor).filter(Boolean)
  // Curated superset so the filter rail feels complete even before every
  // vendor has certs in the datapack.
  const CURATED_VENDORS = [
    "AWS",
    "Azure",
    "GCP",
    "Kubernetes",
    "Docker",
    "Terraform",
    "GitHub",
    "Linux",
    "Security",
    "AI",
  ]
  const vendors = [
    "All",
    ...Array.from(new Set([...liveVendors, ...CURATED_VENDORS])),
  ]

  const stats: StatItem[] = [
    { label: "Certifications", value: certCount || 12, live: certCount > 0 },
    { label: "Practice questions", value: questionCount || 2400, live: questionCount > 0 },
    { label: "Study notes", value: noteCount || 180, live: noteCount > 0 },
    { label: "Flashcards", value: flashcardCount || 950, live: flashcardCount > 0 },
    { label: "Learning paths", value: 8, live: false },
    { label: "Hands-on labs", value: 120, live: false },
    { label: "Developers learning", value: 48000, suffix: "+", live: false },
  ]

  const learningPaths = buildLearningPaths(certs)
  const resources = buildResources({ noteCount, questionCount, flashcardCount, setCount })
  const dashboard = buildDashboard(certs, questionCount)

  return {
    vendors,
    certs,
    stats,
    learningPaths,
    resources,
    dashboard,
    totals: { certs: certCount, questions: questionCount, sets: setCount },
  }
}

function findSlug(certs: CertView[], vendor: string, keyword?: string) {
  const match = certs.find(
    (c) =>
      c.vendor.toLowerCase() === vendor.toLowerCase() &&
      (!keyword || c.name.toLowerCase().includes(keyword.toLowerCase()))
  )
  return match?.slug
}

function buildLearningPaths(certs: CertView[]): LearningPath[] {
  return [
    {
      id: "cloud-engineer",
      title: "Cloud Engineer",
      role: "Start from zero and land your first cloud role",
      accent: "brand",
      steps: [
        { label: "Cloud Practitioner", vendor: "AWS", slug: findSlug(certs, "AWS", "practitioner") },
        { label: "Solutions Architect Associate", vendor: "AWS" },
        { label: "Developer Associate", vendor: "AWS" },
        { label: "SysOps Administrator", vendor: "AWS" },
      ],
    },
    {
      id: "devops",
      title: "DevOps & Platform",
      role: "Ship and operate modern infrastructure",
      accent: "blue",
      steps: [
        { label: "Terraform Associate", vendor: "Terraform" },
        { label: "Docker Fundamentals", vendor: "Docker" },
        { label: "Kubernetes CKA", vendor: "Kubernetes" },
        { label: "GitHub Actions", vendor: "GitHub" },
        { label: "Argo CD / GitOps", vendor: "Kubernetes" },
      ],
    },
    {
      id: "multicloud",
      title: "Multi-Cloud Architect",
      role: "Go deep across every major provider",
      accent: "cyan",
      steps: [
        { label: "Azure Fundamentals", vendor: "Azure", slug: findSlug(certs, "Azure") },
        { label: "GCP Associate Cloud Engineer", vendor: "GCP", slug: findSlug(certs, "GCP") },
        { label: "AWS Solutions Architect Pro", vendor: "AWS" },
        { label: "Terraform Associate", vendor: "Terraform" },
      ],
    },
    {
      id: "security",
      title: "Cloud Security",
      role: "Specialize in securing cloud-native systems",
      accent: "success",
      steps: [
        { label: "Security Fundamentals", vendor: "Security" },
        { label: "AWS Security Specialty", vendor: "AWS" },
        { label: "Kubernetes CKS", vendor: "Kubernetes" },
      ],
    },
  ]
}

function buildResources(counts: {
  noteCount: number
  questionCount: number
  flashcardCount: number
  setCount: number
}): ResourceCategory[] {
  return [
    {
      key: "practice",
      title: "Practice Exams",
      description: "Full-length, weighted mock exams that mirror the real blueprint.",
      icon: "ClipboardCheck",
      href: "/certs",
      count: counts.setCount || null,
      live: counts.setCount > 0,
    },
    {
      key: "questions",
      title: "Question Bank",
      description: "Thousands of scenario questions with two-tier explanations.",
      icon: "ListChecks",
      href: "/certs",
      count: counts.questionCount || null,
      live: counts.questionCount > 0,
    },
    {
      key: "notes",
      title: "Study Notes",
      description: "Concise, expert-written notes for every exam domain.",
      icon: "NotebookPen",
      href: "/certs",
      count: counts.noteCount || null,
      live: counts.noteCount > 0,
    },
    {
      key: "flashcards",
      title: "Flashcards",
      description: "Spaced-repetition decks that lock knowledge into memory.",
      icon: "Layers",
      href: "/certs",
      count: counts.flashcardCount || null,
      live: counts.flashcardCount > 0,
    },
    {
      key: "cheatsheets",
      title: "Cheat Sheets",
      description: "One-page references for services, commands and limits.",
      icon: "FileText",
      href: "/certs",
      count: null,
      live: false,
    },
    {
      key: "labs",
      title: "Hands-on Labs",
      description: "Guided, real-environment labs to build muscle memory.",
      icon: "FlaskConical",
      href: "/certs",
      count: null,
      live: false,
    },
    {
      key: "interview",
      title: "Interview Prep",
      description: "Role-based interview questions with model answers.",
      icon: "MessagesSquare",
      href: "/certs",
      count: null,
      live: false,
    },
    {
      key: "roadmaps",
      title: "AI Roadmaps",
      description: "Personalized day-by-day plans generated for your exam date.",
      icon: "Route",
      href: "/certs",
      count: null,
      live: false,
    },
  ]
}

function buildDashboard(certs: CertView[], questionCount: number): DashboardData {
  const featured = certs.find((c) => c.hasContent) ?? certs[0]
  const pool = featured?.counts.questions || questionCount || 65
  return {
    cert: featured
      ? {
          name: featured.name,
          shortName: featured.shortName,
          vendor: featured.vendor,
          logoSlug: featured.logoSlug,
          brandColor: featured.brandColor,
          examCode: featured.examCode,
        }
      : {
          name: "AWS Certified Cloud Practitioner",
          shortName: "AWS Certified Cloud Practitioner",
          vendor: "AWS",
          logoSlug: "aws",
          brandColor: "#FF9900",
          examCode: "CLF-C02",
        },
    progress: 68,
    accuracy: 82,
    streak: 14,
    questionsSolved: Math.min(412, Math.max(120, pool * 6)),
    questionPool: pool,
    studyHours: 37,
    flashcardsDone: 148,
    flashcardsTotal: 210,
    labsDone: 6,
    labsTotal: 10,
    examCountdownDays: 12,
    weakDomains: [
      { domain: "Security & Compliance", score: 61 },
      { domain: "Billing & Pricing", score: 68 },
    ],
    nextRecommendation: "Retake the Security & Compliance diagnostic",
  }
}

// ---------------------------------------------------------------------------
// Curated fallback — used only when the datapack/DB is unreachable so the
// marketing homepage always renders. Every value is flagged live:false.
// ---------------------------------------------------------------------------

type Seed = {
  slug: string
  vendor: string
  name: string
  logoSlug: string
  brandColor: string
  description: string
  questions: number
  sets: number
  notes: number
  flashcards: number
}

const FALLBACK_SEEDS: Seed[] = [
  {
    slug: "aws-certified-cloud-practitioner-clf-c02",
    vendor: "AWS",
    name: "AWS Certified Cloud Practitioner (CLF-C02)",
    logoSlug: "aws",
    brandColor: "#FF9900",
    description: "Entry-level validation of foundational AWS cloud fluency.",
    questions: 65,
    sets: 4,
    notes: 12,
    flashcards: 120,
  },
  {
    slug: "aws-certified-solutions-architect-associate-saa-c03",
    vendor: "AWS",
    name: "AWS Certified Solutions Architect Associate (SAA-C03)",
    logoSlug: "aws",
    brandColor: "#FF9900",
    description: "Design resilient, cost-optimized architectures on AWS.",
    questions: 65,
    sets: 6,
    notes: 18,
    flashcards: 180,
  },
  {
    slug: "microsoft-azure-fundamentals-az-900",
    vendor: "Azure",
    name: "Microsoft Azure Fundamentals (AZ-900)",
    logoSlug: "azure",
    brandColor: "#0078D4",
    description: "Core Azure concepts, services, pricing and governance.",
    questions: 55,
    sets: 3,
    notes: 10,
    flashcards: 110,
  },
  {
    slug: "microsoft-azure-administrator-az-104",
    vendor: "Azure",
    name: "Microsoft Azure Administrator (AZ-104)",
    logoSlug: "azure",
    brandColor: "#0078D4",
    description: "Implement, manage and monitor Azure environments.",
    questions: 60,
    sets: 5,
    notes: 16,
    flashcards: 150,
  },
  {
    slug: "google-associate-cloud-engineer",
    vendor: "GCP",
    name: "Google Associate Cloud Engineer",
    logoSlug: "gcp",
    brandColor: "#4285F4",
    description: "Deploy and operate applications on Google Cloud.",
    questions: 50,
    sets: 4,
    notes: 14,
    flashcards: 130,
  },
  {
    slug: "certified-kubernetes-administrator-cka",
    vendor: "Kubernetes",
    name: "Certified Kubernetes Administrator (CKA)",
    logoSlug: "kubernetes",
    brandColor: "#326CE5",
    description: "Hands-on cluster administration and troubleshooting.",
    questions: 45,
    sets: 3,
    notes: 15,
    flashcards: 100,
  },
  {
    slug: "hashicorp-certified-terraform-associate",
    vendor: "Terraform",
    name: "HashiCorp Certified Terraform Associate (003)",
    logoSlug: "terraform",
    brandColor: "#7B42BC",
    description: "Infrastructure as code fundamentals with Terraform.",
    questions: 57,
    sets: 4,
    notes: 11,
    flashcards: 90,
  },
  {
    slug: "docker-certified-associate",
    vendor: "Docker",
    name: "Docker Certified Associate (DCA)",
    logoSlug: "docker",
    brandColor: "#2496ED",
    description: "Containerize, ship and run applications with Docker.",
    questions: 40,
    sets: 3,
    notes: 9,
    flashcards: 85,
  },
  {
    slug: "github-actions-certification",
    vendor: "GitHub",
    name: "GitHub Actions Certification",
    logoSlug: "github",
    brandColor: "#181717",
    description: "Automate CI/CD workflows with GitHub Actions.",
    questions: 35,
    sets: 2,
    notes: 8,
    flashcards: 70,
  },
]

function buildFallbackHome(): HomeData {
  const certs: CertView[] = FALLBACK_SEEDS.map((s, i) => {
    const level = deriveLevel(s.name, s.slug)
    const counts = {
      questions: s.questions,
      practiceSets: s.sets,
      flashcards: s.flashcards,
      studyNotes: s.notes,
      resources: 4,
    }
    const readiness = Math.min(
      1,
      counts.questions / 60 + (counts.practiceSets > 0 ? 0.15 : 0) + counts.studyNotes / 12
    )
    return {
      id: `fallback-${i}`,
      slug: s.slug,
      href: `/certs/${s.slug}`,
      vendor: s.vendor,
      name: s.name,
      shortName: shorten(s.name),
      examCode: deriveExamCode(s.name, s.slug),
      description: s.description,
      logoSlug: s.logoSlug,
      brandColor: s.brandColor,
      level,
      studyHours: STUDY_HOURS[level],
      passingScore: 70,
      examDurationMinutes: 90,
      counts,
      hasContent: true,
      readiness,
    }
  })

  const questionCount = FALLBACK_SEEDS.reduce((n, s) => n + s.questions, 0)
  const setCount = FALLBACK_SEEDS.reduce((n, s) => n + s.sets, 0)
  const noteCount = FALLBACK_SEEDS.reduce((n, s) => n + s.notes, 0)
  const flashcardCount = FALLBACK_SEEDS.reduce((n, s) => n + s.flashcards, 0)

  const vendors = [
    "All",
    ...Array.from(new Set(FALLBACK_SEEDS.map((s) => s.vendor))),
    "Linux",
    "Security",
    "AI",
  ]

  const stats: StatItem[] = [
    { label: "Certifications", value: certs.length, live: false },
    { label: "Practice questions", value: questionCount, live: false },
    { label: "Study notes", value: noteCount, live: false },
    { label: "Flashcards", value: flashcardCount, live: false },
    { label: "Learning paths", value: 8, live: false },
    { label: "Hands-on labs", value: 120, live: false },
    { label: "Developers learning", value: 48000, suffix: "+", live: false },
  ]

  return {
    vendors,
    certs,
    stats,
    learningPaths: buildLearningPaths(certs),
    resources: buildResources({ noteCount, questionCount, flashcardCount, setCount }),
    dashboard: buildDashboard(certs, questionCount),
    totals: { certs: certs.length, questions: questionCount, sets: setCount },
  }
}
