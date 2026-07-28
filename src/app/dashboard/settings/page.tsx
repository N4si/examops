import type { Metadata } from "next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/require-auth"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your ExamOps account.",
}

export default async function SettingsPage() {
  const session = await requireAuth()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{session.user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{session.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span>{session.user.plan}</span>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-base text-muted-foreground">
        More settings — notification preferences, plan management, data export — are
        coming soon.
      </p>
    </div>
  )
}
