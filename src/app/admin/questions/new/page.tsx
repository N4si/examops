"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

type Difficulty = "EASY" | "MEDIUM" | "HARD"

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"]

export default function NewQuestionPage() {
  const [certSlug, setCertSlug] = useState("")
  const [domain, setDomain] = useState("")
  const [text, setText] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [correct, setCorrect] = useState<boolean[]>([false, false])
  const [explanation, setExplanation] = useState("")
  const [detailedExplanation, setDetailedExplanation] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((o, i) => (i === index ? value : o)))
  }

  function toggleCorrect(index: number) {
    setCorrect((current) => current.map((c, i) => (i === index ? !c : c)))
  }

  function addOption() {
    setOptions((current) => [...current, ""])
    setCorrect((current) => [...current, false])
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, i) => i !== index))
    setCorrect((current) => current.filter((_, i) => i !== index))
  }

  function resetForm() {
    setCertSlug("")
    setDomain("")
    setText("")
    setOptions(["", ""])
    setCorrect([false, false])
    setExplanation("")
    setDetailedExplanation("")
    setDifficulty("MEDIUM")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    const trimmedOptions = options.map((o) => o.trim())
    const correctAnswers = trimmedOptions.filter((_, i) => correct[i] && trimmedOptions[i])

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certSlug: certSlug.trim(),
        domain: domain.trim(),
        text: text.trim(),
        options: trimmedOptions.filter((o) => o.length > 0),
        correctAnswers,
        explanation: explanation.trim(),
        detailedExplanation: detailedExplanation.trim(),
        difficulty,
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(
        typeof body?.error === "string"
          ? body.error
          : "Failed to create question. Check the fields and try again."
      )
      return
    }

    setSuccess(true)
    resetForm()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add question</h1>
        <Button variant="outline" render={<Link href="/admin" />}>
          Back to dashboard
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Question details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="certSlug">Cert slug</Label>
                <Input
                  id="certSlug"
                  value={certSlug}
                  onChange={(e) => setCertSlug(e.target.value)}
                  placeholder="aws-cloud-practitioner"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Cloud Concepts"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="text">Question text</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Options (check all correct answers)</Label>
              {options.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={correct[i]}
                    onCheckedChange={() => toggleCorrect(i)}
                  />
                  <Input
                    value={option}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={options.length <= 2}
                    onClick={() => removeOption(i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                Add option
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="detailedExplanation">Detailed explanation</Label>
              <Textarea
                id="detailedExplanation"
                value={detailedExplanation}
                onChange={(e) => setDetailedExplanation(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Difficulty</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as Difficulty)}
                className="flex gap-4"
              >
                {DIFFICULTIES.map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <RadioGroupItem value={d} id={`difficulty-${d}`} />
                    <Label htmlFor={`difficulty-${d}`} className="font-normal">
                      {d}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">Question created.</p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Create question"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
