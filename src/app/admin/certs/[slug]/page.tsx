import Link from "next/link"
import { notFound } from "next/navigation"
import { ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreatePracticeSetForm } from "@/components/admin/create-practice-set-form"
import { EmptyState } from "@/components/empty-state"
import { requireAdminPage } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export default async function AdminCertDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  await requireAdminPage()
  const cert = await prisma.certification.findUnique({
    where: { slug: params.slug },
    include: {
      practiceSets: {
        orderBy: { number: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  })

  if (!cert) notFound()

  const nextNumber =
    cert.practiceSets.length > 0
      ? Math.max(...cert.practiceSets.map((s) => s.number)) + 1
      : 1

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {cert.vendor}
          </p>
          <h1 className="text-2xl font-bold">{cert.name}</h1>
        </div>
        <Button variant="outline" render={<Link href="/admin" />}>
          Back to dashboard
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Practice sets</h2>
          <CreatePracticeSetForm certSlug={cert.slug} nextNumber={nextNumber} />
        </div>

        {cert.practiceSets.length === 0 && (
          <EmptyState icon={ClipboardList} title="No practice sets yet. Create one above." />
        )}

        {cert.practiceSets.map((set) => (
          <Card key={set.id}>
            <CardHeader>
              <CardTitle>{set.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {set._count.questions} question{set._count.questions === 1 ? "" : "s"}
              </p>
              <Link
                href={`/admin/certs/${cert.slug}/sets/${set.id}/assign`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Assign questions to this set
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
