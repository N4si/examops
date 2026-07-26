import { z } from "zod"

export const questionInputSchema = z
  .object({
    certSlug: z.string().min(1, "certSlug is required"),
    domain: z.string().min(1, "domain is required"),
    text: z.string().min(1, "text is required"),
    options: z.array(z.string().min(1)).min(2, "at least 2 options required"),
    correctAnswers: z.array(z.string().min(1)).min(1, "at least 1 correct answer required"),
    explanation: z.string().min(1, "explanation is required"),
    detailedExplanation: z.string().default(""),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  })
  .refine((q) => q.correctAnswers.every((a) => q.options.includes(a)), {
    message: "correctAnswers must all be present in options",
    path: ["correctAnswers"],
  })

export const bulkQuestionInputSchema = z.array(questionInputSchema).min(1)

export type QuestionInput = z.infer<typeof questionInputSchema>

export const practiceSetInputSchema = z.object({
  certSlug: z.string().min(1, "certSlug is required"),
  number: z.number().int().positive(),
  name: z.string().min(1, "name is required"),
  description: z.string().default(""),
})

export const assignQuestionsInputSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1, "at least 1 questionId required"),
})
