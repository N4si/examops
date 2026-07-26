"use client"

import { useRef, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function BulkUploadPage() {
  const [json, setJson] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setJson(text)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccessCount(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      setSubmitting(false)
      setError("Invalid JSON.")
      return
    }

    const res = await fetch("/api/admin/questions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    })

    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(
        typeof body?.error === "string"
          ? body.error
          : "Failed to bulk upload. Check the JSON and try again."
      )
      return
    }

    const body = await res.json()
    setSuccessCount(body.count)
    setJson("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bulk upload</h1>
        <Button variant="outline" render={<Link href="/admin" />}>
          Back to dashboard
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Paste or upload a JSON array of questions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="text-sm"
            />
            <Textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder={`[\n  {\n    "certSlug": "aws-cloud-practitioner",\n    "domain": "Cloud Concepts",\n    "text": "...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswers": ["A"],\n    "explanation": "...",\n    "detailedExplanation": "...",\n    "difficulty": "EASY"\n  }\n]`}
              className="min-h-64 font-mono text-sm"
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {successCount !== null && (
              <p className="text-sm text-green-600">
                Created {successCount} question{successCount === 1 ? "" : "s"}.
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={submitting || json.trim().length === 0}>
              {submitting ? "Uploading..." : "Upload"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
