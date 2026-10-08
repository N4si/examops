import type { Metadata } from "next"
import Link from "next/link"
import type { CSSProperties } from "react"
import { SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CertFilterChips } from "@/components/marketing/cert-filter-chips"
import { EmptyState } from "@/components/empty-state"
import { PricingTiers } from "@/components/marketing/pricing-tiers"
import { ParticleBackground } from "@/components/particle-background"
import { SampleQuestionPreview } from "@/components/marketing/sample-question-preview"
import { VendorBadge } from "@/components/vendor-badge"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "ExamOps — Cloud, DevOps & AI certification prep",
  description:
    "Practice exams and quick notes with an explanation for every answer.",
}

// The cert filter chips update only the `?vendor=` query string on this same
// route — without forcing dynamic rendering, the client router cache can
// serve a stale render instead of refetching with the new search params.
export const dynamic = "force-dynamic"

const VALUE_PROPS = [
  {
    title: "Real exam length",
    body: "Practice sets match the real exam's question count and time limit.",
  },
  {
    title: "Two-tier explanations",
    body: "Every question ships with a quick take and a deeper breakdown.",
  },
  {
    title: "Learn from every miss",
    body: "Every answer explains why it is right, with a deeper breakdown when you want it.",
  },
]

const HOW_IT_WORKS = [
  "Pick a certification",
  "Practice a full set",
  "Read the explanation for every answer",
  "Review your score by domain",
]

type CertWithCounts = {
  id: string
  slug: string
  vendor: string
  name: string
  logoSlug: string
  brandColor: string
  _count: { questions: number; practiceSets: number }
}

function HomeCertCard({ cert }: { cert: CertWithCounts }) {
  const hasSets = cert._count.practiceSets > 0

  const content = (
    <Card
      className={cn(
        // Card already lifts -translate-y-0.5 (2px) and eases transform on
        // hover by default — just narrowing the transition to transform only
        // here per the redesign spec's timing (200ms vs the base's 150ms).
        "group relative h-full transition-transform duration-200",
        !hasSets && "opacity-60",
        hasSets && "hover:shadow-[0_0_20px_-4px_var(--brand-color)]"
      )}
      style={
        {
          borderTopWidth: 3,
          borderTopColor: cert.brandColor,
          "--brand-color": cert.brandColor,
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <VendorBadge slug={cert.logoSlug} vendor={cert.vendor} brandColor={cert.brandColor} />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {cert.vendor}
          </span>
        </div>
        <p className="text-base font-medium">{cert.name}</p>
        <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div>
            {cert._count.questions} question{cert._count.questions === 1 ? "" : "s"}
          </div>
          <div>
            {cert._count.practiceSets} set{cert._count.practiceSets === 1 ? "" : "s"}
          </div>
          <div className={cn(hasSets ? "text-brand" : "text-muted-foreground")}>
            {hasSets ? "Free" : "Coming soon"}
          </div>
        </div>
      </div>
      {hasSets && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 bottom-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          →
        </span>
      )}
    </Card>
  )

  return hasSets ? (
    <Link href={`/certs/${cert.slug}`} className="block">
      {content}
    </Link>
  ) : (
    <div aria-disabled="true">{content}</div>
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { vendor?: string }
}) {
  const vendor = searchParams.vendor

  const [certCount, questionCount, setCount, certs, sampleQuestion] = await Promise.all([
    prisma.certification.count(),
    prisma.question.count(),
    prisma.practiceSet.count(),
    prisma.certification.findMany({
      where: vendor && vendor !== "All" ? { vendor } : undefined,
      select: {
        id: true,
        slug: true,
        vendor: true,
        name: true,
        logoSlug: true,
        brandColor: true,
        _count: { select: { questions: true, practiceSets: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.question.findFirst({
      where: { cert: { slug: "aws-cloud-practitioner" } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <>
      {/* Compact hero */}
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.585 0.233 277.117 / 0.18), transparent 70%)",
          }}
        />
        <ParticleBackground />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <h1 className="max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Cloud, DevOps, and AI certification prep.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Practice exams, quick notes, and explanations for every answer.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button render={<Link href="/certs" />}>Browse certifications</Button>
            <Button variant="ghost" render={<Link href="#how-it-works" />}>
              See how it works
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { value: certCount, label: certCount === 1 ? "Cert" : "Certs" },
              { value: questionCount, label: questionCount === 1 ? "Question" : "Questions" },
              { value: setCount, label: setCount === 1 ? "Practice set" : "Practice sets" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5"
              >
                <span className="font-semibold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cert catalog */}
      <section id="certifications" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">
          Certifications
        </p>
        <hr className="mt-3 border-border" />

        <div className="mt-6">
          <CertFilterChips />
        </div>

        {certs.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={SearchX}
              title="No certifications match this filter. Try a different vendor."
              action={
                <Link href="/" className="text-sm font-medium text-brand hover:underline">
                  Clear filter
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {certs.map((cert) => (
              <HomeCertCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}

        {certCount > 6 && (
          <div className="mt-6">
            <Link
              href="/certs"
              className="text-sm font-medium text-brand hover:underline"
            >
              See all certifications →
            </Link>
          </div>
        )}
      </section>

      {/* Value strip */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-border">
          {VALUE_PROPS.map((value, i) => (
            <div key={value.title} className={cn("flex flex-col gap-1.5", i > 0 && "md:pl-8")}>
              <h3 className="text-base font-medium">{value.title}</h3>
              <p className="text-base text-muted-foreground">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm tracking-wider text-muted-foreground uppercase">
            How it works
          </p>
          <hr className="mt-3 border-border" />
          <ol className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-brand">0{i + 1}</span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sample question */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">
          Sample question
        </p>
        <hr className="mt-3 border-border" />
        <p className="mt-6 text-sm text-muted-foreground">
          A real practice question — this is what every question looks like.
        </p>

        {sampleQuestion && (
          <div className="mx-auto mt-4 max-w-2xl">
            <SampleQuestionPreview
              question={{
                domain: sampleQuestion.domain,
                text: sampleQuestion.text,
                options: sampleQuestion.options as string[],
                correctAnswers: sampleQuestion.correctAnswers,
                explanation: sampleQuestion.explanation,
                detailedExplanation: sampleQuestion.detailedExplanation,
              }}
            />
          </div>
        )}

        <div className="mt-4 text-center">
          <Link
            href="/certs/aws-cloud-practitioner"
            className="text-sm font-medium text-brand hover:underline"
          >
            Try it live →
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <hr className="border-border" />
        <div className="mt-8">
          <PricingTiers />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-20 text-center">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-2xl font-medium tracking-tight md:text-3xl">
            Start practicing. Free.
          </p>
          <div className="mt-6">
            <Button size="lg" render={<Link href="/certs" />}>
              Browse certifications →
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
