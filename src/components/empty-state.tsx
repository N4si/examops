import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon
  title: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="max-w-sm text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  )
}
