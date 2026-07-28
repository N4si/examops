"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type DomainStat = { domain: string; correct: number; total: number }
export type MissedQuestion = {
  text: string
  options: string[]
  correctAnswers: string[]
  explanation: string
  detailedExplanation: string
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function PracticeExamSummary({
  correctCount,
  totalCount,
  passingScore,
  brandColor,
  domainStats,
  elapsedSeconds,
  missedQuestions,
  onRetake,
}: {
  correctCount: number
  totalCount: number
  passingScore: number | null
  brandColor: string
  domainStats: DomainStat[]
  elapsedSeconds: number
  missedQuestions: MissedQuestion[]
  onRetake: () => void
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const passed = passingScore != null ? percent >= passingScore : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-5xl font-semibold tracking-tight">
            {correctCount} / {totalCount}
          </p>
          <p className="text-lg text-muted-foreground">{percent}%</p>
          {passed !== null && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                passed
                  ? "bg-green-600/10 text-green-600"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {passed ? "Pass" : "Not yet passing"} · {passingScore}% required
            </span>
          )}
          <p className="text-sm text-muted-foreground">
            Time taken: {formatTime(elapsedSeconds)}
          </p>
        </CardContent>
      </Card>

      {domainStats.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Per-domain breakdown</h2>
          {domainStats.map((stat) => {
            const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
            return (
              <div key={stat.domain} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{stat.domain}</span>
                  <span className="text-muted-foreground">
                    {stat.correct}/{stat.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: brandColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {missedQuestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Missed questions</h2>
          <div className="flex flex-col gap-2">
            {missedQuestions.map((q, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="flex items-start justify-between gap-3 text-left"
                  >
                    <span className="text-sm">
                      {q.text.length > 120 ? `${q.text.slice(0, 120)}…` : q.text}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-brand">
                      {expandedIndex === i ? "Hide" : "Review answer"}
                    </span>
                  </button>

                  {expandedIndex === i && (
                    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                      <div className="grid gap-2">
                        {q.options.map((option) => {
                          const isRight = q.correctAnswers.includes(option)
                          return (
                            <div
                              key={option}
                              className={cn(
                                "rounded-md border p-2 text-sm",
                                isRight &&
                                  "border-green-600 bg-green-50 dark:bg-green-950"
                              )}
                            >
                              {option}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">{q.explanation}</p>
                      <p className="text-sm text-muted-foreground">
                        {q.detailedExplanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRetake} className="flex-1">
          Retake this exam
        </Button>
        <Button variant="outline" render={<Link href="/certs" />} className="flex-1">
          Try another cert
        </Button>
      </div>
    </div>
  )
}
