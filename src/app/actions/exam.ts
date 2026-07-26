"use server"

import { auth } from "@/lib/auth"
import { recordAttempt } from "@/lib/exam-persistence"

export async function submitExamAttempt(input: {
  certId: string
  startedAt: string
  score: number
  domainBreakdown: Record<string, number>
  questionsAnswered: number
}): Promise<{ saved: boolean }> {
  const session = await auth()
  if (!session?.user) {
    console.error("submitExamAttempt: no session — attempt not persisted", {
      certId: input.certId,
    })
    return { saved: false }
  }

  try {
    await recordAttempt(session.user.id, input.certId, {
      startedAt: new Date(input.startedAt),
      score: input.score,
      domainBreakdown: input.domainBreakdown,
      questionsAnswered: input.questionsAnswered,
    })
  } catch (error) {
    console.error("submitExamAttempt: recordAttempt failed", {
      userId: session.user.id,
      certId: input.certId,
      error,
    })
    return { saved: false }
  }

  return { saved: true }
}
