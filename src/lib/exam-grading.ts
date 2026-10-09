import { z } from "zod"

// Server-side grading. Everything here is pure (no Prisma, no auth) so it can
// be unit-tested directly; the server actions in src/app/actions/exam.ts load
// questions from the DB and hand them to these functions. The client never
// sees correctAnswers until the server has graded the relevant answer.

export type GradableQuestion = {
  id: string
  domain: string
  text: string
  options: string[]
  correctAnswers: string[]
  explanation: string
  detailedExplanation: string
}

export type GradedDomainStat = { domain: string; correct: number; total: number }

export type GradedMissedQuestion = {
  questionId: string
  text: string
  options: string[]
  correctAnswers: string[]
  explanation: string
  detailedExplanation: string
}

export type GradedSubmission = {
  correctCount: number
  totalCount: number
  score: number // 0..1
  domainStats: GradedDomainStat[]
  domainBreakdown: Record<string, number> // domain -> 0..1
  missed: GradedMissedQuestion[]
}

export type PracticeFeedback = {
  isCorrect: boolean
  correctAnswers: string[]
  explanation: string
  detailedExplanation: string
}

// Generous caps — real sets are 65 questions with 4-6 options — that just
// stop an oversized payload from being processed.
const MAX_ANSWERED_QUESTIONS = 500
const MAX_SELECTIONS_PER_QUESTION = 20
const MAX_ID_LENGTH = 100
const MAX_OPTION_LENGTH = 2000

const selectionSchema = z
  .array(z.string().max(MAX_OPTION_LENGTH))
  .max(MAX_SELECTIONS_PER_QUESTION)

export const examSubmissionSchema = z.object({
  setId: z.string().min(1).max(MAX_ID_LENGTH),
  startedAt: z.string().datetime(),
  answers: z
    .record(z.string().max(MAX_ID_LENGTH), selectionSchema)
    .refine((a) => Object.keys(a).length <= MAX_ANSWERED_QUESTIONS, {
      message: "too many answers",
    }),
})

export type ExamSubmissionInput = z.infer<typeof examSubmissionSchema>

export const practiceAnswerSchema = z.object({
  questionId: z.string().min(1).max(MAX_ID_LENGTH),
  selected: selectionSchema,
})

export type PracticeAnswerInput = z.infer<typeof practiceAnswerSchema>

// Set comparison with duplicates removed on both sides — a plain
// length + every() check would accept ["A", "A"] for a correct ["A", "B"].
export function isAnswerCorrect(selected: string[], correctAnswers: string[]): boolean {
  const selectedSet = new Set(selected)
  const correctSet = new Set(correctAnswers)
  if (selectedSet.size !== correctSet.size) return false
  return Array.from(selectedSet).every((option) => correctSet.has(option))
}

// Grades against the authoritative question list from the DB: the total is
// always the number of questions in the set, answers for question IDs outside
// the set are ignored, and missing answers count as incorrect.
export function gradeSubmission(
  questions: GradableQuestion[],
  answers: Record<string, string[]>
): GradedSubmission {
  let correctCount = 0
  const domainMap = new Map<string, { correct: number; total: number }>()
  const missed: GradedMissedQuestion[] = []

  for (const q of questions) {
    const selected = Object.hasOwn(answers, q.id) ? answers[q.id] : []
    const isCorrect = isAnswerCorrect(selected, q.correctAnswers)

    if (isCorrect) {
      correctCount++
    } else {
      missed.push({
        questionId: q.id,
        text: q.text,
        options: q.options,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation,
        detailedExplanation: q.detailedExplanation,
      })
    }

    const stat = domainMap.get(q.domain) ?? { correct: 0, total: 0 }
    stat.total += 1
    if (isCorrect) stat.correct += 1
    domainMap.set(q.domain, stat)
  }

  const domainStats = Array.from(domainMap, ([domain, stat]) => ({ domain, ...stat }))
  const domainBreakdown: Record<string, number> = {}
  for (const stat of domainStats) {
    domainBreakdown[stat.domain] = stat.total > 0 ? stat.correct / stat.total : 0
  }

  return {
    correctCount,
    totalCount: questions.length,
    score: questions.length > 0 ? correctCount / questions.length : 0,
    domainStats,
    domainBreakdown,
    missed,
  }
}

export function gradePracticeAnswer(
  question: GradableQuestion,
  selected: string[]
): PracticeFeedback {
  return {
    isCorrect: isAnswerCorrect(selected, question.correctAnswers),
    correctAnswers: question.correctAnswers,
    explanation: question.explanation,
    detailedExplanation: question.detailedExplanation,
  }
}

// startedAt still comes from the client (there's no server-side attempt
// record until submit), so at least refuse a start time in the future.
export function sanitizeStartedAt(startedAt: string, now: Date): Date {
  const parsed = new Date(startedAt)
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() > now.getTime()) return now
  return parsed
}
