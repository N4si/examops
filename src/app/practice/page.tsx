import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
          <p className="text-muted-foreground">No certifications yet.</p>
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
