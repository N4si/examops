import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VendorLogo } from "@/components/vendor-logo"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardPage() {
  const certs = await prisma.certification.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Certifications</h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/questions/bulk" />}>
            Bulk upload
          </Button>
          <Button render={<Link href="/admin/questions/new" />}>Add question</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {certs.length === 0 && (
          <p className="text-muted-foreground">No certifications yet.</p>
        )}
        {certs.map((cert) => (
          <Link key={cert.id} href={`/admin/certs/${cert.slug}`}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <VendorLogo slug={cert.logoSlug} size={24} />
                  <CardTitle>{cert.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {cert._count.questions} question{cert._count.questions === 1 ? "" : "s"} ·{" "}
                {cert.slug}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
