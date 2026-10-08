import type { Metadata } from "next"
import Link from "next/link"
import type { CSSProperties } from "react"
import { Map as MapIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VendorLogo } from "@/components/vendor-logo"
import { ROLE_ROADMAPS } from "@/lib/roadmaps"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Roadmaps — ExamOps",
  description:
    "Role-based and certification-by-certification learning paths for cloud, DevOps, and AI certifications.",
}

export default async function RoadmapsHubPage() {
  const certs = await prisma.certification.findMany({
    select: {
      id: true,
      slug: true,
      vendor: true,
      name: true,
      logoSlug: true,
      brandColor: true,
      _count: { select: { questions: true } },
    },
    orderBy: { name: "asc" },
  })
  const certBySlug = new Map(certs.map((c) => [c.slug, c]))

  return (
    <>
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
          <MapIcon className="size-8 text-brand" aria-hidden="true" />
          <h1 className="max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Roadmaps
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Pick a role for a multi-cert path, or jump straight into one certification&apos;s
            domain-by-domain roadmap.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">By role</p>
        <hr className="mt-3 border-border" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ROLE_ROADMAPS.map((role) => {
            const liveCount = role.certSlugs.filter((slug) => certBySlug.has(slug)).length
            return (
              <Link key={role.slug} href={`/roadmaps/${role.slug}`} className="block">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{role.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {liveCount} of {role.certSlugs.length} certification
                      {role.certSlugs.length === 1 ? "" : "s"} live
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">
          By certification
        </p>
        <hr className="mt-3 border-border" />
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert) => {
            const hasQuestions = cert._count.questions > 0
            const content = (
              <Card
                className="h-full"
                style={
                  {
                    borderTopWidth: 2,
                    borderTopColor: cert.brandColor,
                  } as CSSProperties
                }
              >
                <div className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-center gap-2">
                    <VendorLogo slug={cert.logoSlug} size={20} />
                    <span className="text-xs text-muted-foreground uppercase">
                      {cert.vendor}
                    </span>
                  </div>
                  <p className="text-base font-medium">{cert.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hasQuestions ? "View roadmap →" : "Coming soon"}
                  </p>
                </div>
              </Card>
            )
            return hasQuestions ? (
              <Link key={cert.id} href={`/certs/${cert.slug}/roadmap`} className="block">
                {content}
              </Link>
            ) : (
              <div key={cert.id} aria-disabled="true" className="opacity-60">
                {content}
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
