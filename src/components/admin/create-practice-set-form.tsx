"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CreatePracticeSetForm({
  certSlug,
  nextNumber,
}: {
  certSlug: string
  nextNumber: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState(nextNumber)
  const [name, setName] = useState(`Practice Exam ${nextNumber}`)
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Create practice set</Button>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch("/api/admin/practice-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certSlug,
        number,
        name: name.trim(),
        description: description.trim(),
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(
        typeof body?.error === "string" ? body.error : "Failed to create practice set."
      )
      return
    }

    setOpen(false)
    setDescription("")
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-base">New practice set</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ps-number">Number</Label>
            <Input
              id="ps-number"
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ps-name">Name</Label>
            <Input
              id="ps-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ps-description">Description</Label>
            <Textarea
              id="ps-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
