import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { prisma } from "@/lib/prisma"

export default async function PracticeIndexPage() {
  const certs = await prisma.certification.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">Choose a certification</h1>
      <div className="flex flex-col gap-3">
        {certs.length === 0 && (
          <EmptyState
            icon={GraduationCap}
            title="No certifications yet."
            action={
              <Link href="/certs" className="text-sm font-medium text-brand hover:underline">
                Browse certifications
              </Link>
            }
          />
        )}
        {certs.map((cert) => (
          <Link key={cert.id} href={`/certs/${cert.slug}`}>
            <Card>
              <CardHeader>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {cert.vendor}
                </p>
                <CardTitle>{cert.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {cert._count.questions} question{cert._count.questions === 1 ? "" : "s"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
