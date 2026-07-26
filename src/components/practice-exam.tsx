"use client"

import { useState } from "react"
import Link from "next/link"

import { submitExamAttempt } from "@/app/actions/exam"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export type PracticeQuestion = {
  id: string
  domain: string
  text: string
  options: string[]
  correctAnswers: string[]
  explanation: string
  detailedExplanation: string
}

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const bSet = new Set(b)
  return a.every((item) => bSet.has(item))
}

export function PracticeExam({
  questions,
  certId,
  isSignedIn = false,
}: {
  questions: PracticeQuestion[]
  certId: string
  isSignedIn?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [showDetailed, setShowDetailed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [domainStats, setDomainStats] = useState<
    Record<string, { correct: number; total: number }>
  >({})
  const [startedAt] = useState(() => new Date())
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )

  const signInBanner = !isSignedIn && (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
      <span>Sign in to save your progress.</span>
      <Link href="/login" className="font-medium text-brand hover:underline">
        Sign in
      </Link>
    </div>
  )

  async function persistAttempt(finalCorrectCount: number) {
    setSaveState("saving")
    const domainBreakdown: Record<string, number> = {}
    for (const [domain, stat] of Object.entries(domainStats)) {
      domainBreakdown[domain] = stat.total > 0 ? stat.correct / stat.total : 0
    }

    try {
      const result = await submitExamAttempt({
        certId,
        startedAt: startedAt.toISOString(),
        score: finalCorrectCount / questions.length,
        domainBreakdown,
        questionsAnswered: questions.length,
      })
      setSaveState(result.saved ? "saved" : "idle")
    } catch {
      setSaveState("error")
    }
  }

  if (questions.length === 0) {
    return <p className="text-muted-foreground">No questions seeded yet.</p>
  }

  if (finished) {
    return (
      <>
        {signInBanner}
        <Card>
          <CardHeader>
            <CardTitle>Practice complete</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-lg">
              Score: {correctCount} / {questions.length}
            </p>
            {isSignedIn && saveState === "saved" && (
              <p className="text-sm text-muted-foreground">Progress saved.</p>
            )}
            {isSignedIn && saveState === "error" && (
              <p className="text-sm text-destructive">
                Couldn&apos;t save this attempt — your score above is still accurate.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => {
                setIndex(0)
                setSelected([])
                setSubmitted(false)
                setShowDetailed(false)
                setCorrectCount(0)
                setFinished(false)
                setDomainStats({})
                setSaveState("idle")
              }}
            >
              Restart
            </Button>
          </CardFooter>
        </Card>
      </>
    )
  }

  const question = questions[index]
  const isMultiSelect = question.correctAnswers.length > 1
  const isCorrect = sameSet(selected, question.correctAnswers)
  const isLast = index === questions.length - 1

  function toggleOption(option: string) {
    if (submitted) return
    if (isMultiSelect) {
      setSelected((current) =>
        current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option]
      )
    } else {
      setSelected([option])
    }
  }

  function handleSubmit() {
    if (selected.length === 0) return
    setSubmitted(true)
    const correct = sameSet(selected, question.correctAnswers)
    if (correct) {
      setCorrectCount((c) => c + 1)
    }
    setDomainStats((current) => {
      const existing = current[question.domain] ?? { correct: 0, total: 0 }
      return {
        ...current,
        [question.domain]: {
          correct: existing.correct + (correct ? 1 : 0),
          total: existing.total + 1,
        },
      }
    })
  }

  function handleNext() {
    if (isLast) {
      setFinished(true)
      if (isSignedIn) {
        void persistAttempt(correctCount)
      }
      return
    }
    setIndex((i) => i + 1)
    setSelected([])
    setSubmitted(false)
    setShowDetailed(false)
  }

  return (
    <>
      {signInBanner}
      <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">
          Question {index + 1} of {questions.length} · {question.domain}
          {isMultiSelect && ` · Choose ${question.correctAnswers.length}`}
        </p>
        <CardTitle className="text-base font-normal">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isMultiSelect ? (
          <div className="grid w-full gap-2">
            {question.options.map((option) => {
              const isSelected = selected.includes(option)
              const isRight = question.correctAnswers.includes(option)

              return (
                <div
                  key={option}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2",
                    submitted && isRight && "border-green-600 bg-green-50 dark:bg-green-950",
                    submitted && isSelected && !isRight && "border-red-600 bg-red-50 dark:bg-red-950"
                  )}
                >
                  <Checkbox
                    id={option}
                    checked={isSelected}
                    onCheckedChange={() => toggleOption(option)}
                    disabled={submitted}
                  />
                  <Label htmlFor={option} className="flex-1 font-normal">
                    {option}
                  </Label>
                </div>
              )
            })}
          </div>
        ) : (
          <RadioGroup
            value={selected[0] ?? undefined}
            onValueChange={(value) => toggleOption(value as string)}
            disabled={submitted}
          >
            {question.options.map((option) => {
              const isSelected = selected.includes(option)
              const isRight = question.correctAnswers.includes(option)

              return (
                <div
                  key={option}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2",
                    submitted && isRight && "border-green-600 bg-green-50 dark:bg-green-950",
                    submitted && isSelected && !isRight && "border-red-600 bg-red-50 dark:bg-red-950"
                  )}
                >
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 font-normal">
                    {option}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        )}

        {submitted && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">
              {isCorrect ? "Correct!" : "Incorrect."}
            </p>
            <p className="mt-1 text-muted-foreground">{question.explanation}</p>

            {!showDetailed ? (
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => setShowDetailed(true)}
              >
                Show detailed explanation
              </Button>
            ) : (
              <p className="mt-2 text-muted-foreground">
                {question.detailedExplanation}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={selected.length === 0}>
            Submit
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {isLast ? "Finish" : "Next question"}
          </Button>
        )}
      </CardFooter>
      </Card>
    </>
  )
}
