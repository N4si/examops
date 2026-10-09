import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ClipboardList, NotebookText } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { buildDomainSteps } from "@/lib/roadmaps"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const cert = await prisma.certification.findUnique({ where: { slug: params.slug } })
  if (!cert) return {}
  return {
    title: `${cert.name} roadmap — ExamOps`,
    description: `Domain-by-domain learning roadmap for ${cert.name}.`,
  }
}

export default async function CertRoadmapPage({ params }: { params: { slug: string } }) {
  const cert = await prisma.certification.findUnique({ where: { slug: params.slug } })
  if (!cert) notFound()

  const grouped = await prisma.question.groupBy({
    by: ["domain"],
    where: { certId: cert.id },
    _count: true,
  })
  const questionCountsByDomain = Object.fromEntries(
    grouped.map((g) => [g.domain, g._count])
  )

  const steps = buildDomainSteps(
    cert.domainWeights as Record<string, number> | null,
    questionCountsByDomain
  )
  const totalQuestions = grouped.reduce((sum, g) => sum + g._count, 0)

  return (
    <>
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Learning roadmap
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight md:text-5xl">
            {cert.name}
          </h1>
          {steps.length > 0 && (
            <p className="mt-3 text-base text-muted-foreground">
              {steps.length} domain{steps.length === 1 ? "" : "s"} · {totalQuestions}{" "}
              question{totalQuestions === 1 ? "" : "s"} · roughly{" "}
              {Math.round(steps.reduce((sum, s) => sum + s.estimatedMinutes, 0) / 60)} hour
              {Math.round(steps.reduce((sum, s) => sum + s.estimatedMinutes, 0) / 60) === 1
                ? ""
                : "s"}{" "}
              of practice (rough estimate)
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24">
        {steps.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No roadmap yet — questions haven't been written for this certification."
            action={
              <Link href="/certs" className="text-sm font-medium text-brand hover:underline">
                Browse other certifications
              </Link>
            }
          />
        ) : (
          <ol className="relative flex flex-col gap-8 border-l border-border pl-8">
            <li className="relative -ml-8 flex items-center gap-3 pl-8 text-sm font-medium text-muted-foreground">
              <span
                aria-hidden="true"
                className="absolute left-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-background text-xs"
              >
                <NotebookText className="size-4" />
              </span>
              Start — read the study notes for {cert.name}
            </li>

            {steps.map((step, i) => (
              <li key={step.domain} className="relative -ml-8 pl-8">
                <span
                  aria-hidden="true"
                  className="absolute left-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-brand bg-brand text-xs font-medium text-primary-foreground"
                >
                  {i + 1}
                </span>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-base font-medium">{step.domain}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Math.round(step.weight * 100)}% of exam · {step.questionCount} question
                    {step.questionCount === 1 ? "" : "s"} · ~{step.estimatedMinutes} min
                    (estimate)
                  </p>
                </div>
              </li>
            ))}

            <li className="relative -ml-8 pl-8">
              <span
                aria-hidden="true"
                className="absolute left-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-background text-xs"
              >
                <ClipboardList className="size-4" />
              </span>
              <div className="rounded-xl border border-border p-4">
                <p className="text-base font-medium">Finish — take a full practice exam</p>
                <Link
                  href={`/certs/${cert.slug}`}
                  className="mt-1 inline-block text-sm font-medium text-brand hover:underline"
                >
                  View practice exams →
                </Link>
              </div>
            </li>
          </ol>
        )}
      </section>
    </>
  )
}
