import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type SampleQuestion = {
  domain: string
  text: string
  options: string[]
  correctAnswers: string[]
  explanation: string
  detailedExplanation: string
}

// Static replica of PracticeExam's post-submit state — same Card structure and
// option-row styling as src/components/practice-exam.tsx, but with no
// interactivity: the correct answer is pre-highlighted and both explanation
// levels are always visible (there's no "show more" toggle here).
export function SampleQuestionPreview({ question }: { question: SampleQuestion }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">{question.domain}</p>
        <CardTitle className="text-base font-normal">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid w-full gap-2">
          {question.options.map((option) => {
            const isRight = question.correctAnswers.includes(option)
            return (
              <div
                key={option}
                className={cn(
                  "flex items-center gap-2 rounded-md border p-2",
                  isRight && "border-green-600 bg-green-50 dark:bg-green-950"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0 rounded-full border",
                    isRight ? "border-green-600 bg-green-600" : "border-input"
                  )}
                />
                <span className="flex-1 text-sm">{option}</span>
              </div>
            )
          })}
        </div>

        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium">Correct.</p>
          <p className="mt-1 text-muted-foreground">{question.explanation}</p>
          <p className="mt-2 text-muted-foreground">{question.detailedExplanation}</p>
        </div>
      </CardContent>
    </Card>
  )
}
