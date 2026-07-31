import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PricingTiers } from "@/components/marketing/pricing-tiers"
import { SampleQuestionPreview } from "@/components/marketing/sample-question-preview"
import { SectionHeading } from "@/components/marketing/home/section-heading"
import { FilterProvider } from "@/components/marketing/home/filter-context"
import { Hero } from "@/components/marketing/home/hero"
import { CertExplorer } from "@/components/marketing/home/cert-explorer"
import { LearningPaths } from "@/components/marketing/home/learning-paths"
import { LearningResources } from "@/components/marketing/home/learning-resources"
import { StatsCounter } from "@/components/marketing/home/stats-counter"
import { Reveal } from "@/components/marketing/home/reveal"
import { getHomeData } from "@/lib/home-data"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "ExamOps — Master every IT certification",
  description:
    "AI-powered tutoring, expert notes, realistic practice exams, flashcards, labs and personalized roadmaps for AWS, Azure, GCP, Kubernetes, Terraform, Linux, Security and AI certifications.",
}

// DB-backed and personalized preview data — render dynamically so counts stay
// fresh as the datapack grows.
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [home, sampleQuestion] = await Promise.all([
    getHomeData(),
    prisma.question.findFirst({
      where: { cert: { slug: "aws-cloud-practitioner" } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <>
      <FilterProvider>
        <Hero vendors={home.vendors} dashboard={home.dashboard} />

        {/* Certification Explorer */}
        <section
          id="certifications"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20"
        >
          <SectionHeading
            eyebrow="Certification Explorer"
            title="Every certification, one platform"
            description="Cards render live from the ExamOps datapack — filter by vendor or search across the entire catalog."
          />
          <div className="mt-8">
            <CertExplorer certs={home.certs} vendors={home.vendors} />
          </div>
        </section>
      </FilterProvider>

      {/* Learning Paths */}
      <section id="paths" className="scroll-mt-20 border-t border-border bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Popular Learning Paths"
            title="Follow a proven route to your role"
            description="Structured, multi-cert tracks that take you from fundamentals to job-ready — steps light up as they land in the datapack."
          />
          <div className="mt-8">
            <LearningPaths paths={home.learningPaths} />
          </div>
        </div>
      </section>

      {/* Learning Resources */}
      <section id="resources" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
        <SectionHeading
          eyebrow="Learning Resources"
          title="Everything you need to pass"
          description="Practice exams, notes, flashcards, labs and AI tooling — all connected to the same catalog."
        />
        <div className="mt-8">
          <LearningResources resources={home.resources} />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-8">
            <SectionHeading
              eyebrow="By the numbers"
              title="A growing library, powered by data"
            />
          </Reveal>
          <StatsCounter stats={home.stats} />
        </div>
      </section>

      {/* Sample question */}
      {sampleQuestion && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <SectionHeading
            eyebrow="Inside a question"
            title="Two-tier explanations on every question"
            description="A real practice question — this is exactly what every item looks like after you answer."
          />
          <Reveal className="mx-auto mt-8 max-w-2xl">
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
          </Reveal>
          <div className="mt-6 text-center">
            <Link
              href="/certs/aws-cloud-practitioner"
              className="text-sm font-medium text-brand hover:underline"
            >
              Try it live →
            </Link>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free, upgrade when you're ready"
          />
          <div className="mt-10">
            <PricingTiers />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border py-20 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 100%, color-mix(in oklab, var(--brand) 20%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            The best place on the internet to prepare for IT certifications.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of developers studying smarter with ExamOps. Free to start.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/certs" />}>
              Start learning
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Create free account
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
