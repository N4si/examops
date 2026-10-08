import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, Lock } from "lucide-react"

import { VendorLogo } from "@/components/vendor-logo"
import { cn } from "@/lib/utils"
import { getRoleRoadmap } from "@/lib/roadmaps"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({
  params,
}: {
  params: { role: string }
}): Promise<Metadata> {
  const role = getRoleRoadmap(params.role)
  if (!role) return {}
  return { title: `${role.name} roadmap — ExamOps`, description: role.description }
}

export default async function RoleRoadmapPage({ params }: { params: { role: string } }) {
  const role = getRoleRoadmap(params.role)
  if (!role) notFound()

  const certs = await prisma.certification.findMany({
    where: { slug: { in: role.certSlugs } },
    select: {
      slug: true,
      vendor: true,
      name: true,
      logoSlug: true,
      brandColor: true,
      _count: { select: { questions: true } },
    },
  })
  const certBySlug = new Map(certs.map((c) => [c.slug, c]))

  return (
    <>
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Role roadmap
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight md:text-5xl">
            {role.name}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{role.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24">
        <ol className="relative flex flex-col gap-8 border-l border-border pl-8">
          <li className="relative -ml-8 flex items-center gap-3 pl-8 text-sm font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className="absolute left-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-background text-xs"
            >
              •
            </span>
            Start
          </li>

          {role.certSlugs.map((slug, i) => {
            const cert = certBySlug.get(slug)
            const isLive = cert && cert._count.questions > 0

            return (
              <li key={slug} className="relative -ml-8 pl-8">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 text-xs font-medium",
                    isLive
                      ? "border-brand bg-brand text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isLive ? <Check className="size-4" /> : i + 1}
                </span>

                {cert ? (
                  isLive ? (
                    <Link
                      href={`/certs/${cert.slug}/roadmap`}
                      className="block rounded-xl border border-border p-4 transition-colors hover:border-foreground/20"
                    >
                      <div className="flex items-center gap-2">
                        <VendorLogo slug={cert.logoSlug} size={20} />
                        <span className="text-xs text-muted-foreground uppercase">
                          {cert.vendor}
                        </span>
                      </div>
                      <p className="mt-1 text-base font-medium">{cert.name}</p>
                      <p className="mt-1 text-sm text-brand">View domain roadmap →</p>
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 opacity-70">
                      <div className="flex items-center gap-2">
                        <VendorLogo slug={cert.logoSlug} size={20} />
                        <span className="text-xs text-muted-foreground uppercase">
                          {cert.vendor}
                        </span>
                      </div>
                      <p className="mt-1 text-base font-medium">{cert.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Lock className="size-3.5" aria-hidden="true" />
                        Questions coming soon
                      </p>
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 opacity-50">
                    <p className="text-base font-medium text-muted-foreground">
                      {slug
                        .split("-")
                        .map((w) => w[0]?.toUpperCase() + w.slice(1))
                        .join(" ")}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Lock className="size-3.5" aria-hidden="true" />
                      Not yet on ExamOps
                    </p>
                  </div>
                )}
              </li>
            )
          })}

          <li className="relative -ml-8 flex items-center gap-3 pl-8 text-sm font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className="absolute left-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-background text-xs"
            >
              •
            </span>
            Finish
          </li>
        </ol>
      </section>
    </>
  )
}
