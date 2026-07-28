"use client"

import { Flag, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const SHORTCUTS = [
  { key: "1-4", action: "Select an option" },
  { key: "F", action: "Flag this question" },
  { key: "N", action: "Next question" },
  { key: "P", action: "Previous question" },
  { key: "?", action: "Show this help" },
]

const DOMAIN_CHART_VARS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]

export function domainColorVar(domain: string) {
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 31 + domain.charCodeAt(i)) >>> 0
  }
  return DOMAIN_CHART_VARS[hash % DOMAIN_CHART_VARS.length]
}

export function PracticeExamHeader({
  certName,
  current,
  total,
  domain,
  timerLabel,
  isOverTime,
  isFlagged,
  onToggleFlag,
  shortcutsOpen,
  onShortcutsOpenChange,
}: {
  certName: string
  current: number
  total: number
  domain: string
  timerLabel: string
  isOverTime: boolean
  isFlagged: boolean
  onToggleFlag: () => void
  shortcutsOpen: boolean
  onShortcutsOpenChange: (open: boolean) => void
}) {
  const colorVar = domainColorVar(domain)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">{certName}</p>
        <p className="text-sm font-medium">
          Question {current} of {total}
        </p>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `color-mix(in oklch, var(--${colorVar}) 20%, transparent)`,
            color: `var(--${colorVar})`,
          }}
        >
          {domain}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-sm tabular-nums",
            isOverTime ? "font-semibold text-destructive" : "text-muted-foreground"
          )}
        >
          {timerLabel}
        </span>
        <Popover open={shortcutsOpen} onOpenChange={onShortcutsOpenChange}>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts" />
            }
          >
            <HelpCircle className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end">
            <PopoverTitle>Keyboard shortcuts</PopoverTitle>
            <ul className="flex flex-col gap-1.5">
              {SHORTCUTS.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{s.action}</span>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {s.key}
                  </kbd>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
        <Button
          variant={isFlagged ? "default" : "outline"}
          size="sm"
          onClick={onToggleFlag}
          className={cn(isFlagged && "bg-yellow-500 text-black hover:bg-yellow-500/90")}
        >
          <Flag className="size-4" />
          {isFlagged ? "Flagged" : "Flag"}
        </Button>
      </div>
    </div>
  )
}
