import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CertFilterChips } from "@/components/marketing/cert-filter-chips"
import { PricingTiers } from "@/components/marketing/pricing-tiers"
import { SampleQuestionPreview } from "@/components/marketing/sample-question-preview"
import { VendorLogo } from "@/components/vendor-logo"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "ExamOps — Cloud, DevOps & AI certification prep",
  description:
    "Practice exams, quick notes, and an AI tutor that actually explains what you got wrong.",
}

// The cert filter chips update only the `?vendor=` query string on this same
// route — without forcing dynamic rendering, the client router cache can
// serve a stale render instead of refetching with the new search params.
export const dynamic = "force-dynamic"

const VALUE_PROPS = [
  {
    title: "Real exam count and weights",
    body: "Practice sets match actual exam length and domain distribution.",
  },
  {
    title: "Two-tier explanations",
    body: "Every question ships with a quick take and a deeper breakdown.",
  },
  {
    title: "AI that helps, quietly",
    body: "Ask on any question, get a roadmap from a diagnostic, no chat clutter.",
  },
]

const HOW_IT_WORKS = [
  "Pick a cert",
  "Take a diagnostic",
  "Practice with weighted sets",
  "Track weak areas until you're ready",
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
      className={cn("group relative h-full", !hasSets && "opacity-60")}
      style={{ borderTopWidth: 2, borderTopColor: cert.brandColor }}
    >
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <VendorLogo slug={cert.logoSlug} size={20} />
          <span className="text-xs text-muted-foreground uppercase">{cert.vendor}</span>
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
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <h1 className="max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Cloud, DevOps, and AI certification prep.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Practice exams, quick notes, and AI that explains what you got wrong.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button render={<Link href="/certs" />}>Browse certifications</Button>
            <Button variant="ghost" render={<Link href="#how-it-works" />}>
              See how it works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {certCount} cert{certCount === 1 ? "" : "s"} · {questionCount} question
            {questionCount === 1 ? "" : "s"} · {setCount} practice set
            {setCount === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {/* Cert catalog */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">
          Certifications
        </p>
        <hr className="mt-3 border-border" />

        <div className="mt-6">
          <CertFilterChips />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert) => (
            <HomeCertCard key={cert.id} cert={cert} />
          ))}
          {certs.length === 0 && (
            <p className="text-muted-foreground">No certifications match this filter.</p>
          )}
        </div>

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
