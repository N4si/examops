"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ClipboardCheck,
  ListChecks,
  NotebookPen,
  Layers,
  FileText,
  FlaskConical,
  MessagesSquare,
  Route,
  type LucideIcon,
} from "lucide-react"

import type { ResourceCategory } from "@/lib/home-data"

const ICONS: Record<string, LucideIcon> = {
  ClipboardCheck,
  ListChecks,
  NotebookPen,
  Layers,
  FileText,
  FlaskConical,
  MessagesSquare,
  Route,
}

export function LearningResources({ resources }: { resources: ResourceCategory[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {resources.map((r, i) => {
        const Icon = ICONS[r.icon] ?? FileText
        return (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: (i % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={r.href}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-foreground/20"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                <Icon className="size-5" />
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{r.title}</h3>
                {r.count != null && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                    {r.count.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {r.description}
              </p>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
