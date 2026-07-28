import type { Metadata } from "next"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CertFilterChips } from "@/components/marketing/cert-filter-chips"
import { VendorLogo } from "@/components/vendor-logo"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Certifications",
  description: "Browse every certification ExamOps covers practice exams for.",
}

// Force a fresh server render per request — the vendor filter chips update
// only the `?vendor=` query string on this same route, and without this the
// client router cache can reuse a previously rendered payload instead of
// refetching with the new search params.
export const dynamic = "force-dynamic"

export default async function CertsIndexPage({
  searchParams,
}: {
  searchParams: { vendor?: string }
}) {
  const vendor = searchParams.vendor
  const certs = await prisma.certification.findMany({
    where: vendor && vendor !== "All" ? { vendor } : undefined,
    include: { _count: { select: { practiceSets: true, questions: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Certifications
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every certification we cover practice exams, notes, and resources for — pick one
        to get started.
      </p>

      <div className="mt-8">
        <CertFilterChips />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certs.map((cert) => {
          const hasSets = cert._count.practiceSets > 0

          const card = (
            <Card
              className={cn("h-full", !hasSets && "opacity-60")}
              style={{ borderTopWidth: 2, borderTopColor: cert.brandColor }}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <VendorLogo slug={cert.logoSlug} size={24} />
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {cert.vendor}
                  </p>
                </div>
                <CardTitle>{cert.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {cert._count.questions} question
                  {cert._count.questions === 1 ? "" : "s"}
                </p>
                {hasSets ? (
                  <span className="text-sm font-medium text-brand">Start practice →</span>
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

          return hasSets ? (
            <Link key={cert.id} href={`/certs/${cert.slug}`}>
              {card}
            </Link>
          ) : (
            <div key={cert.id} aria-disabled="true">
              {card}
            </div>
          )
        })}
        {certs.length === 0 && (
          <p className="text-muted-foreground">No certifications match this filter.</p>
        )}
      </div>
    </section>
  )
}
