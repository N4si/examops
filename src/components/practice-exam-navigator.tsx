"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type NavigatorQuestionStatus = {
  answered: boolean
  flagged: boolean
}

function QuestionGrid({
  statuses,
  currentIndex,
  onJump,
}: {
  statuses: NavigatorQuestionStatus[]
  currentIndex: number
  onJump: (index: number) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {statuses.map((status, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          aria-label={`Go to question ${i + 1}`}
          aria-current={i === currentIndex}
          className={cn(
            "flex size-9 items-center justify-center rounded-md border text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            !status.answered && !status.flagged && "border-border text-muted-foreground",
            status.answered && !status.flagged && "border-brand bg-brand/20 text-foreground",
            status.flagged && !status.answered && "border-yellow-500 bg-yellow-500/10",
            status.flagged && status.answered && "border-yellow-500 bg-brand/20 text-foreground",
            i === currentIndex && "ring-2 ring-brand"
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}

export function PracticeExamNavigator({
  statuses,
  currentIndex,
  onJump,
  onFinish,
}: {
  statuses: NavigatorQuestionStatus[]
  currentIndex: number
  onJump: (index: number) => void
  onFinish: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Questions
          </p>
          <QuestionGrid statuses={statuses} currentIndex={currentIndex} onJump={onJump} />
        </div>
        <Button onClick={onFinish} className="w-full">
          Finish exam
        </Button>
      </aside>

      {/* Mobile */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-full">
                {`${currentIndex + 1}/${statuses.length}`} — View all questions
              </Button>
            }
          />
          <SheetContent side="top" className="h-auto max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Questions</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto px-4 pb-2">
              <QuestionGrid
                statuses={statuses}
                currentIndex={currentIndex}
                onJump={(i) => {
                  onJump(i)
                  setMobileOpen(false)
                }}
              />
            </div>
            <div className="p-4">
              <Button
                onClick={() => {
                  setMobileOpen(false)
                  onFinish()
                }}
                className="w-full"
              >
                Finish exam
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
