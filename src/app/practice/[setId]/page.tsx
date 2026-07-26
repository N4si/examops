import { notFound } from "next/navigation"

import { PracticeExam, type PracticeQuestion } from "@/components/practice-exam"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function PracticeSetPage({
  params,
}: {
  params: { setId: string }
}) {
  const [set, session] = await Promise.all([
    prisma.practiceSet.findUnique({
      where: { id: params.setId },
      include: { cert: true },
    }),
    auth(),
  ])

  if (!set) notFound()

  const rows = await prisma.question.findMany({
    where: { practiceSetId: set.id },
    orderBy: { createdAt: "asc" },
  })

  const questions: PracticeQuestion[] = rows.map((q) => ({
    id: q.id,
    domain: q.domain,
    text: q.text,
    options: q.options as string[],
    correctAnswers: q.correctAnswers,
    explanation: q.explanation,
    detailedExplanation: q.detailedExplanation,
  }))

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">
        {set.cert.name} — {set.name}
      </h1>
      <PracticeExam
        questions={questions}
        certId={set.certId}
        isSignedIn={Boolean(session?.user)}
      />
    </main>
  )
}
