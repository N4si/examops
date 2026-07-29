"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { submitExamAttempt } from "@/app/actions/exam"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/empty-state"
import { Label } from "@/components/ui/label"
import { PracticeExamHeader } from "@/components/practice-exam-header"
import {
  PracticeExamNavigator,
  type NavigatorQuestionStatus,
} from "@/components/practice-exam-navigator"
import { PracticeExamReview } from "@/components/practice-exam-review"
import {
  PracticeExamSummary,
  type DomainStat,
  type MissedQuestion,
} from "@/components/practice-exam-summary"
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

type AnswerState = { selected: string[]; submitted: boolean; showDetailed: boolean }
type Mode = "practice" | "exam"
type Phase = "setup" | "in-progress" | "review" | "summary"

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const bSet = new Set(b)
  return a.every((item) => bSet.has(item))
}

function formatClock(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds)
  const m = Math.floor(clamped / 60)
  const s = clamped % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

// Deterministic per-seed PRNG (mulberry32) — same seed always produces the
// same shuffle, so a re-render mid-attempt doesn't reshuffle under the user.
function mulberry32(seed: number) {
  let state = seed | 0
  return function random() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// correctAnswers stores the answer text itself, not an option index, so
// shuffling `options` never requires remapping correctAnswers.
function shuffleForAttempt(source: PracticeQuestion[], seed: number): PracticeQuestion[] {
  const random = mulberry32(seed)
  return shuffle(source, random).map((q) => ({ ...q, options: shuffle(q.options, random) }))
}

export function PracticeExam({
  questions,
  certId,
  certName,
  brandColor,
  passingScore,
  examDurationMinutes,
  isSignedIn = false,
}: {
  questions: PracticeQuestion[]
  certId: string
  certName: string
  brandColor: string
  passingScore: number | null
  examDurationMinutes: number
  isSignedIn?: boolean
}) {
  const [phase, setPhase] = useState<Phase>("setup")
  const [mode, setMode] = useState<Mode>("practice")
  const [activeQuestions, setActiveQuestions] = useState<PracticeQuestion[]>(questions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [examStartedAt, setExamStartedAt] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )
  const [finalCorrect, setFinalCorrect] = useState(0)
  const [finalDomainStats, setFinalDomainStats] = useState<DomainStat[]>([])
  const [finalMissed, setFinalMissed] = useState<MissedQuestion[]>([])

  const examDurationSeconds = examDurationMinutes * 60
  const remainingSeconds = examDurationSeconds - elapsedSeconds
  const isOverTime = mode === "exam" && remainingSeconds < 5 * 60

  function getAnswerState(questionId: string): AnswerState {
    return answers[questionId] ?? { selected: [], submitted: false, showDetailed: false }
  }

  function computeResults() {
    let correct = 0
    const domainMap: Record<string, { correct: number; total: number }> = {}
    const missed: MissedQuestion[] = []

    for (const q of activeQuestions) {
      const selected = getAnswerState(q.id).selected
      const isCorrect = sameSet(selected, q.correctAnswers)
      if (isCorrect) {
        correct++
      } else {
        missed.push({
          text: q.text,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          detailedExplanation: q.detailedExplanation,
        })
      }
      const dm = domainMap[q.domain] ?? { correct: 0, total: 0 }
      dm.total += 1
      if (isCorrect) dm.correct += 1
      domainMap[q.domain] = dm
    }

    return { correct, domainMap, missed }
  }

  async function persistAttempt(finalCorrectCount: number, domainBreakdown: Record<string, number>) {
    if (!examStartedAt) return
    setSaveState("saving")
    try {
      const result = await submitExamAttempt({
        certId,
        startedAt: examStartedAt.toISOString(),
        score: finalCorrectCount / activeQuestions.length,
        domainBreakdown,
        questionsAnswered: activeQuestions.length,
      })
      setSaveState(result.saved ? "saved" : "idle")
    } catch {
      setSaveState("error")
    }
  }

  function finalizeExam() {
    const { correct, domainMap, missed } = computeResults()
    const domainStats: DomainStat[] = Object.entries(domainMap).map(([domain, stat]) => ({
      domain,
      correct: stat.correct,
      total: stat.total,
    }))
    setFinalCorrect(correct)
    setFinalDomainStats(domainStats)
    setFinalMissed(missed)
    setPhase("summary")

    if (isSignedIn) {
      const domainBreakdown: Record<string, number> = {}
      for (const [domain, stat] of Object.entries(domainMap)) {
        domainBreakdown[domain] = stat.total > 0 ? stat.correct / stat.total : 0
      }
      void persistAttempt(correct, domainBreakdown)
    }
  }

  // Timer: ticks while an attempt is actively in progress (including review,
  // which still counts against exam-mode time). Stops on setup/summary.
  useEffect(() => {
    if (phase !== "in-progress" && phase !== "review") return
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Exam-mode auto-submit when the countdown hits zero.
  useEffect(() => {
    if (mode !== "exam" || phase !== "in-progress") return
    if (remainingSeconds > 0) return
    finalizeExam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, mode, phase])

  function startExam() {
    setActiveQuestions(shuffleForAttempt(questions, Date.now()))
    setExamStartedAt(new Date())
    setPhase("in-progress")
  }

  function goToIndex(index: number) {
    if (index < 0 || index >= activeQuestions.length) return
    setCurrentIndex(index)
  }

  function toggleOption(option: string) {
    const q = activeQuestions[currentIndex]
    const isMultiSelect = q.correctAnswers.length > 1
    setAnswers((current) => {
      const existing = current[q.id] ?? { selected: [], submitted: false, showDetailed: false }
      if (existing.submitted) return current
      const nextSelected = isMultiSelect
        ? existing.selected.includes(option)
          ? existing.selected.filter((o) => o !== option)
          : [...existing.selected, option]
        : [option]
      return { ...current, [q.id]: { ...existing, selected: nextSelected } }
    })
  }

  function toggleFlag(questionId: string) {
    setFlagged((current) => {
      const next = new Set(current)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  function handleSubmitAnswer() {
    const q = activeQuestions[currentIndex]
    setAnswers((current) => ({
      ...current,
      [q.id]: { ...getAnswerState(q.id), submitted: true },
    }))
  }

  function handleToggleDetailed() {
    const q = activeQuestions[currentIndex]
    setAnswers((current) => ({
      ...current,
      [q.id]: { ...getAnswerState(q.id), showDetailed: true },
    }))
  }

  function handleFinishExam() {
    const unansweredCount = activeQuestions.filter(
      (q) => getAnswerState(q.id).selected.length === 0
    ).length
    if (mode === "exam" && unansweredCount > 0) {
      const proceed = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Go to review anyway?`
      )
      if (!proceed) return
    }
    setPhase("review")
  }

  function handleRetake() {
    setPhase("setup")
    setMode("practice")
    setActiveQuestions(questions)
    setCurrentIndex(0)
    setAnswers({})
    setFlagged(new Set())
    setExamStartedAt(null)
    setElapsedSeconds(0)
    setSaveState("idle")
  }

  // Keyboard shortcuts: 1-4 select options, F flag, N/P navigate, ? shows help.
  useEffect(() => {
    if (phase !== "in-progress") return

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return

      const q = activeQuestions[currentIndex]
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1
        if (idx < q.options.length) toggleOption(q.options[idx])
      } else if (e.key.toLowerCase() === "f") {
        toggleFlag(q.id)
      } else if (e.key.toLowerCase() === "n") {
        goToIndex(currentIndex + 1)
      } else if (e.key.toLowerCase() === "p") {
        goToIndex(currentIndex - 1)
      } else if (e.key === "?") {
        setShortcutsOpen((s) => !s)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, activeQuestions])

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="No questions seeded yet for this practice exam."
        action={
          <Link href="/certs" className="text-sm font-medium text-brand hover:underline">
            Browse other certifications
          </Link>
        }
      />
    )
  }

  const signInBanner = !isSignedIn && (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
      <span>Sign in to save your progress.</span>
      <Link href="/login" className="font-medium text-brand hover:underline">
        Sign in
      </Link>
    </div>
  )

  // ---------- Setup screen ----------
  if (phase === "setup") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {signInBanner}
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">{certName}</p>
            <h1 className="text-xl font-medium">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </h1>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4",
                  mode === "practice" && "border-brand bg-brand/5"
                )}
              >
                <RadioGroupItem value="practice" id="mode-practice" className="mt-1" />
                <Label htmlFor="mode-practice" className="flex flex-col items-start gap-1 font-normal">
                  <span className="text-base font-medium text-foreground">
                    Practice mode
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Submit each question for immediate feedback and explanations. No
                    timer pressure.
                  </span>
                </Label>
              </div>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4",
                  mode === "exam" && "border-brand bg-brand/5"
                )}
              >
                <RadioGroupItem value="exam" id="mode-exam" className="mt-1" />
                <Label htmlFor="mode-exam" className="flex flex-col items-start gap-1 font-normal">
                  <span className="text-base font-medium text-foreground">Exam mode</span>
                  <span className="text-sm text-muted-foreground">
                    Submit at the end only, {examDurationMinutes}-minute countdown, no
                    per-question feedback — like the real thing.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button onClick={startExam} className="w-full">
              Start {mode === "exam" ? "exam" : "practice"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ---------- Review screen ----------
  if (phase === "review") {
    const reviewQuestions = activeQuestions.map((q, i) => ({
      index: i,
      text: q.text,
      answered: getAnswerState(q.id).selected.length > 0,
      flagged: flagged.has(q.id),
    }))

    return (
      <>
        {signInBanner}
        <PracticeExamReview
          questions={reviewQuestions}
          onJump={(i) => {
            goToIndex(i)
            setPhase("in-progress")
          }}
          onSubmit={finalizeExam}
        />
      </>
    )
  }

  // ---------- Summary screen ----------
  if (phase === "summary") {
    return (
      <>
        {signInBanner}
        {isSignedIn && saveState === "error" && (
          <p className="mb-4 text-sm text-destructive">
            Couldn&apos;t save this attempt — your score below is still accurate.
          </p>
        )}
        <PracticeExamSummary
          correctCount={finalCorrect}
          totalCount={activeQuestions.length}
          passingScore={passingScore}
          brandColor={brandColor}
          domainStats={finalDomainStats}
          elapsedSeconds={elapsedSeconds}
          missedQuestions={finalMissed}
          onRetake={handleRetake}
        />
      </>
    )
  }

  // ---------- In-progress screen ----------
  const question = activeQuestions[currentIndex]
  const isMultiSelect = question.correctAnswers.length > 1
  const answerState = getAnswerState(question.id)
  const isCorrect = sameSet(answerState.selected, question.correctAnswers)
  const showFeedback = mode === "practice" && answerState.submitted
  const statuses: NavigatorQuestionStatus[] = activeQuestions.map((q) => ({
    answered: getAnswerState(q.id).selected.length > 0,
    flagged: flagged.has(q.id),
  }))

  return (
    <>
      {signInBanner}
      <PracticeExamHeader
        certName={certName}
        current={currentIndex + 1}
        total={activeQuestions.length}
        domain={question.domain}
        timerLabel={
          mode === "exam" ? formatClock(remainingSeconds) : formatClock(elapsedSeconds)
        }
        isOverTime={isOverTime}
        isFlagged={flagged.has(question.id)}
        onToggleFlag={() => toggleFlag(question.id)}
        shortcutsOpen={shortcutsOpen}
        onShortcutsOpenChange={setShortcutsOpen}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="order-2 lg:order-1">
          <Card>
            <CardHeader>
              <p className="text-xl leading-relaxed font-normal md:text-2xl">
                {question.text}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isMultiSelect ? (
                <div className="grid w-full gap-2">
                  {question.options.map((option) => {
                    const isSelected = answerState.selected.includes(option)
                    const isRight = question.correctAnswers.includes(option)

                    return (
                      <div
                        key={option}
                        className={cn(
                          "flex items-center gap-3 rounded-md border p-5",
                          showFeedback &&
                            isRight &&
                            "border-green-600 bg-green-50 dark:bg-green-950",
                          showFeedback &&
                            isSelected &&
                            !isRight &&
                            "border-red-600 bg-red-50 dark:bg-red-950"
                        )}
                      >
                        <Checkbox
                          id={option}
                          checked={isSelected}
                          onCheckedChange={() => toggleOption(option)}
                          disabled={showFeedback}
                        />
                        <Label
                          htmlFor={option}
                          className="flex-1 text-base font-normal md:text-lg"
                        >
                          {option}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <RadioGroup
                  value={answerState.selected[0] ?? undefined}
                  onValueChange={(value) => toggleOption(value as string)}
                  disabled={showFeedback}
                >
                  {question.options.map((option) => {
                    const isSelected = answerState.selected.includes(option)
                    const isRight = question.correctAnswers.includes(option)

                    return (
                      <div
                        key={option}
                        className={cn(
                          "flex items-center gap-3 rounded-md border p-5",
                          showFeedback &&
                            isRight &&
                            "border-green-600 bg-green-50 dark:bg-green-950",
                          showFeedback &&
                            isSelected &&
                            !isRight &&
                            "border-red-600 bg-red-50 dark:bg-red-950"
                        )}
                      >
                        <RadioGroupItem value={option} id={option} />
                        <Label
                          htmlFor={option}
                          className="flex-1 text-base font-normal md:text-lg"
                        >
                          {option}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              )}

              {showFeedback && (
                <div className="rounded-md bg-muted p-3 text-base leading-relaxed">
                  <p className="font-medium">{isCorrect ? "Correct!" : "Incorrect."}</p>
                  <p className="mt-1 text-muted-foreground">{question.explanation}</p>

                  {!answerState.showDetailed ? (
                    <Button
                      variant="link"
                      className="mt-2 h-auto p-0"
                      onClick={handleToggleDetailed}
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
            <CardFooter className="justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {mode === "practice" && !answerState.submitted && (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={answerState.selected.length === 0}
                  >
                    Submit answer
                  </Button>
                )}
                {mode === "exam" && (
                  <Button variant="outline" disabled={answerState.selected.length === 0}>
                    Save
                  </Button>
                )}
                <Button
                  onClick={() => goToIndex(currentIndex + 1)}
                  disabled={currentIndex === activeQuestions.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="order-1 lg:order-2">
          <PracticeExamNavigator
            statuses={statuses}
            currentIndex={currentIndex}
            onJump={goToIndex}
            onFinish={handleFinishExam}
          />
        </div>
      </div>
    </>
  )
}
