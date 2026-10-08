"use server"

import type { Question } from "@prisma/client"

import { auth } from "@/lib/auth"
import {
  examSubmissionSchema,
  gradePracticeAnswer,
  gradeSubmission,
  practiceAnswerSchema,
  sanitizeStartedAt,
  type ExamSubmissionInput,
  type GradedDomainStat,
  type GradedMissedQuestion,
  type GradableQuestion,
  type PracticeAnswerInput,
  type PracticeFeedback,
} from "@/lib/exam-grading"
import { recordAttempt } from "@/lib/exam-persistence"
import { prisma } from "@/lib/prisma"

function toGradableQuestion(q: Question): GradableQuestion {
  return {
    id: q.id,
    domain: q.domain,
    text: q.text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswers: q.correctAnswers,
    explanation: q.explanation,
    detailedExplanation: q.detailedExplanation,
  }
}

export type PracticeAnswerResult =
  | ({ ok: true } & PracticeFeedback)
  | { ok: false; error: string }

export async function checkPracticeAnswer(
  input: PracticeAnswerInput
): Promise<PracticeAnswerResult> {
  const parsed = practiceAnswerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid answer" }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
  })
  if (!question) return { ok: false, error: "Question not found" }

  return { ok: true, ...gradePracticeAnswer(toGradableQuestion(question), parsed.data.selected) }
}

export type ExamSubmissionResult =
  | {
      ok: true
      correctCount: number
      totalCount: number
      domainStats: GradedDomainStat[]
      missed: GradedMissedQuestion[]
      saved: boolean
    }
  | { ok: false; error: string }

// The client sends only which options it selected; the score is computed here
// from the DB copy of the set's questions. certId is derived from the set, not
// taken from the client.
export async function submitExamAttempt(
  input: ExamSubmissionInput
): Promise<ExamSubmissionResult> {
  const parsed = examSubmissionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid submission" }

  const set = await prisma.practiceSet.findUnique({
    where: { id: parsed.data.setId },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  })
  if (!set) return { ok: false, error: "Practice set not found" }
  if (set.questions.length === 0) return { ok: false, error: "Practice set has no questions" }

  const graded = gradeSubmission(set.questions.map(toGradableQuestion), parsed.data.answers)

  let saved = false
  const session = await auth()
  if (session?.user) {
    try {
      await recordAttempt(session.user.id, set.certId, {
        startedAt: sanitizeStartedAt(parsed.data.startedAt, new Date()),
        score: graded.score,
        domainBreakdown: graded.domainBreakdown,
        questionsAnswered: graded.totalCount,
      })
      saved = true
    } catch (error) {
      console.error("submitExamAttempt: recordAttempt failed", {
        userId: session.user.id,
        setId: set.id,
        error,
      })
    }
  }

  return {
    ok: true,
    correctCount: graded.correctCount,
    totalCount: graded.totalCount,
    domainStats: graded.domainStats,
    missed: graded.missed,
    saved,
  }
}
