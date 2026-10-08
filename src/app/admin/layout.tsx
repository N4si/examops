import type { ReactNode } from "react"
import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"
import { requireAdminPage } from "@/lib/admin-auth"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/admin" className="text-base font-semibold tracking-tight">
            ExamOps Admin
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
