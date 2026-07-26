import { notFound } from "next/navigation"

import { AssignQuestionsForm } from "@/components/admin/assign-questions-form"
import { prisma } from "@/lib/prisma"

export default async function AssignQuestionsPage({
  params,
}: {
  params: { slug: string; setId: string }
}) {
  const set = await prisma.practiceSet.findUnique({
    where: { id: params.setId },
    include: { cert: true },
  })

  if (!set || set.cert.slug !== params.slug) notFound()

  // "Unassigned" here means "not currently in this set" — a question can only
  // belong to one set at a time, so assigning one here moves it out of wherever
  // it was before (including another practice set for this cert).
  const unassigned = await prisma.question.findMany({
    where: { certId: set.certId, NOT: { practiceSetId: set.id } },
    orderBy: { createdAt: "asc" },
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {set.cert.name}
        </p>
        <h1 className="text-2xl font-bold">Assign questions — {set.name}</h1>
      </div>
      <AssignQuestionsForm
        setId={set.id}
        certSlug={set.cert.slug}
        questions={unassigned.map((q) => ({ id: q.id, text: q.text, domain: q.domain }))}
      />
    </main>
  )
}
