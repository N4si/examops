import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { CSSProperties } from "react"
import { BookOpen, ClipboardList, Link2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { VendorLogo } from "@/components/vendor-logo"
import { prisma } from "@/lib/prisma"

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const groups = {} as Record<K, T[]>
  for (const item of items) {
    const k = key(item)
    ;(groups[k] ??= []).push(item)
  }
  return groups
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const cert = await prisma.certification.findUnique({ where: { slug: params.slug } })
  if (!cert) return {}

  return {
    title: cert.name,
    description:
      cert.description || `Practice exams, notes, and resources for ${cert.name}.`,
  }
}

export default async function CertDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const cert = await prisma.certification.findUnique({
    where: { slug: params.slug },
    include: {
      practiceSets: {
        orderBy: { number: "asc" },
        include: { _count: { select: { questions: true } } },
      },
      studyNotes: { orderBy: { title: "asc" } },
      resources: { orderBy: { title: "asc" } },
    },
  })

  if (!cert) notFound()

  const notesByDomain = groupBy(cert.studyNotes, (n) => n.domain)
  const resourcesByType = groupBy(cert.resources, (r) => r.type)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: cert.name,
    description:
      cert.description || `Practice exams, notes, and resources for ${cert.name}.`,
    provider: {
      "@type": "Organization",
      name: "ExamOps",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={
            {
              background: `radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklch, ${cert.brandColor} 18%, transparent), transparent 70%)`,
            } as CSSProperties
          }
        />
        <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <VendorLogo slug={cert.logoSlug} size={32} />
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {cert.vendor}
          </p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {cert.name}
        </h1>
        <div
          aria-hidden="true"
          className="mt-3 h-1 w-16 rounded-full"
          style={{ backgroundColor: cert.brandColor }}
        />
        {cert.description && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{cert.description}</p>
        )}
        {cert.practiceSets.some((s) => s._count.questions > 0) && (
          <Link
            href={`/certs/${cert.slug}/roadmap`}
            className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
          >
            View learning roadmap →
          </Link>
        )}
        </div>
      </section>

      {/* Practice exams */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Practice exams
        </h2>
        {cert.practiceSets.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={ClipboardList}
              title="No practice exams yet. We're still writing questions for this certification."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cert.practiceSets.map((set) => {
              const hasQuestions = set._count.questions > 0
              return (
                <Card key={set.id}>
                  <CardHeader>
                    <CardTitle>{set.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      {set._count.questions} question
                      {set._count.questions === 1 ? "" : "s"}
                    </p>
                    {hasQuestions ? (
                      <Link
                        href={`/practice/${set.id}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Start exam →
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Coming soon
                      </span>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Exam notes */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Exam notes</h2>
        {cert.studyNotes.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={BookOpen}
              title="No notes yet. Check back soon for domain-by-domain study notes."
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-8">
            {Object.entries(notesByDomain).map(([domain, notes]) => (
              <div key={domain}>
                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                  {domain}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {notes.map((note) => (
                    <Link key={note.id} href={`/certs/${cert.slug}/notes/${note.id}`}>
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="text-base">{note.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {note.contentMd.replace(/[#*_`]/g, "").trim().slice(0, 150)}…
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resources */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Resources</h2>
        {cert.resources.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Link2}
              title="No resources yet. We'll link official docs and guides here."
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-8">
            {Object.entries(resourcesByType).map(([type, resources]) => (
              <div key={type}>
                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                  {type}
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {resources.map((resource) => (
                    <li key={resource.id}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
