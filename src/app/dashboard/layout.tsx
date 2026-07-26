import type { ReactNode } from "react"
import Link from "next/link"

import { UserMenu } from "@/components/marketing/user-menu"
import { signOutAction } from "@/lib/auth"
import { requireAuth } from "@/lib/require-auth"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background text-base leading-[1.6] text-foreground">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            ExamOps
          </Link>
          <UserMenu user={session.user} signOutAction={signOutAction} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
