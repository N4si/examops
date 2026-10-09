"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ReviewQuestionSummary = {
  index: number
  text: string
  answered: boolean
  flagged: boolean
}

export function PracticeExamReview({
  questions,
  onJump,
  onSubmit,
  submitting = false,
}: {
  questions: ReviewQuestionSummary[]
  onJump: (index: number) => void
  onSubmit: () => void
  submitting?: boolean
}) {
  const [confirmingSubmit, setConfirmingSubmit] = useState(false)
  const unansweredCount = questions.filter((q) => !q.answered).length

  function handleSubmitClick() {
    if (unansweredCount > 0 && !confirmingSubmit) {
      setConfirmingSubmit(true)
      return
    }
    onSubmit()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review your answers</h1>
        <p className="mt-1 text-muted-foreground">
          {questions.length - unansweredCount} of {questions.length} answered
          {unansweredCount > 0 && ` · ${unansweredCount} unanswered`}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {questions.map((q) => (
          <button
            key={q.index}
            type="button"
            onClick={() => onJump(q.index)}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                {q.index + 1}
              </span>
              <span className="truncate text-sm">{q.text}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {q.flagged && (
                <span className="rounded-full border border-yellow-500 bg-yellow-500/10 px-2 py-0.5 text-xs">
                  Flagged
                </span>
              )}
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs",
                  q.answered
                    ? "border-brand bg-brand/20 text-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {q.answered ? "Answered" : "Unanswered"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {confirmingSubmit && unansweredCount > 0 && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4">
          <p className="text-sm font-medium">
            You have {unansweredCount} unanswered question{unansweredCount === 1 ? "" : "s"}.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit anyway, or go back and finish them first?
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => setConfirmingSubmit(false)}>
              Go back
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit anyway"}
            </Button>
          </div>
        </div>
      )}

      {!confirmingSubmit && (
        <Button size="lg" onClick={handleSubmitClick} disabled={submitting} className="mt-2">
          {submitting ? "Submitting…" : "Submit exam"}
        </Button>
      )}
    </div>
  )
}
