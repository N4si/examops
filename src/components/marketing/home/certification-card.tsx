"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Clock, ListChecks, Layers, NotebookPen } from "lucide-react"

import { VendorLogo } from "@/components/vendor-logo"
import { cn } from "@/lib/utils"
import type { CertView } from "@/lib/home-data"

const LEVEL_STYLES: Record<CertView["level"], string> = {
  Foundational: "bg-success/10 text-success",
  Associate: "bg-accent-blue/10 text-accent-blue",
  Professional: "bg-brand/10 text-brand",
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock
  value: string | number
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="font-medium tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

export function CertificationCard({ cert }: { cert: CertView }) {
  const readinessPct = Math.round(cert.readiness * 100)

  const inner = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors",
        cert.hasContent ? "hover:border-foreground/20" : "opacity-70"
      )}
      style={{ "--brand-color": cert.brandColor } as CSSProperties}
    >
      {/* Accent top border */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: cert.brandColor }}
      />
      {/* Hover glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ backgroundColor: cert.brandColor }}
      />

      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-background">
          <VendorLogo slug={cert.logoSlug} size={24} />
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              LEVEL_STYLES[cert.level]
            )}
          >
            {cert.level}
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      <div className="mt-4 flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{cert.vendor}</span>
          {cert.examCode && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono">{cert.examCode}</span>
            </>
          )}
        </div>
        <h3 className="mt-1 text-base font-medium leading-snug text-balance">
          {cert.shortName}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <Metric icon={Clock} value={`${cert.studyHours}h`} label="study" />
          <Metric icon={ListChecks} value={cert.counts.questions} label="questions" />
          <Metric icon={Layers} value={cert.counts.flashcards} label="cards" />
          <Metric icon={NotebookPen} value={cert.counts.studyNotes} label="notes" />
        </div>
      </div>

      {/* Readiness / progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{cert.hasContent ? "Content ready" : "Coming soon"}</span>
          <span className="tabular-nums">{cert.hasContent ? `${readinessPct}%` : ""}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${cert.hasContent ? Math.max(8, readinessPct) : 0}%`,
              backgroundColor: cert.brandColor,
            }}
          />
        </div>
      </div>
    </motion.div>
  )

  if (!cert.hasContent) {
    return <div aria-disabled="true">{inner}</div>
  }

  return (
    <Link href={`/certs/${cert.slug}`} className="block h-full">
      {inner}
    </Link>
  )
}
