"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/empty-state"
import { Label } from "@/components/ui/label"

type QuestionSummary = { id: string; text: string; domain: string }

export function AssignQuestionsForm({
  setId,
  certSlug,
  questions,
}: {
  setId: string
  certSlug: string
  questions: QuestionSummary[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<number | null>(null)

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    if (selected.size === 0) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/admin/practice-sets/${setId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: Array.from(selected) }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(
        typeof body?.error === "string" ? body.error : "Failed to assign questions."
      )
      return
    }

    const body = await res.json()
    setSuccess(body.count)
    setSelected(new Set())
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} unassigned question{questions.length === 1 ? "" : "s"} ·{" "}
          {selected.size} selected
        </p>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/admin/certs/${certSlug}`} />}>
            Back
          </Button>
          <Button onClick={handleSave} disabled={submitting || selected.size === 0}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success !== null && (
        <p className="text-sm text-green-600">
          Assigned {success} question{success === 1 ? "" : "s"}.
        </p>
      )}

      {questions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No unassigned questions for this certification — everything's been assigned."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <Checkbox
                  id={q.id}
                  checked={selected.has(q.id)}
                  onCheckedChange={() => toggle(q.id)}
                  className="mt-0.5"
                />
                <Label htmlFor={q.id} className="flex flex-1 flex-col items-start gap-1 font-normal">
                  <span className="text-xs tracking-wide text-muted-foreground uppercase">
                    {q.domain}
                  </span>
                  <span>{q.text}</span>
                </Label>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
