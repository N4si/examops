import type { ReactNode } from "react"

export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-brand">
        {eyebrow}
      </span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-pretty text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
