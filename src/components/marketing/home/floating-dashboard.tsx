"use client"

import { motion } from "framer-motion"
import { Flame, Target, Clock, CalendarClock, Sparkles, TrendingUp } from "lucide-react"

import { VendorLogo } from "@/components/vendor-logo"
import type { DashboardData } from "@/lib/home-data"

function ProgressRing({ value }: { value: number }) {
  const size = 96
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-brand"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">{value}%</span>
        <span className="text-[10px] text-muted-foreground">ready</span>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactIcon
  label: string
  value: string
}) {
  const Icon = icon
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/40 p-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

type ReactIcon = typeof Flame

export function FloatingDashboard({ data }: { data: DashboardData }) {
  const accuracyBar = data.accuracy

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative mx-auto w-full max-w-md"
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 10%, var(--brand), transparent 70%), radial-gradient(50% 50% at 90% 90%, var(--accent-cyan), transparent 70%)",
        }}
      />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-background">
              <VendorLogo slug={data.cert.logoSlug} size={20} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {data.cert.vendor}
                {data.cert.examCode ? ` · ${data.cert.examCode}` : ""}
              </p>
              <p className="max-w-[180px] truncate text-sm font-medium">
                {data.cert.shortName}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
            <Flame className="size-3" /> {data.streak}d
          </span>
        </div>

        {/* Progress + accuracy */}
        <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-background/40 p-3">
          <ProgressRing value={data.progress} />
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Target className="size-3.5" /> Accuracy
              </span>
              <span className="font-semibold tabular-nums">{data.accuracy}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                whileInView={{ width: `${accuracyBar}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {data.questionsSolved.toLocaleString()} of {data.questionPool.toLocaleString()}+ questions solved
            </p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat icon={Clock} label="Study hours" value={`${data.studyHours}h`} />
          <Stat
            icon={Sparkles}
            label="Flashcards"
            value={`${data.flashcardsDone}/${data.flashcardsTotal}`}
          />
          <Stat icon={TrendingUp} label="Labs done" value={`${data.labsDone}/${data.labsTotal}`} />
          <Stat icon={CalendarClock} label="Exam in" value={`${data.examCountdownDays}d`} />
        </div>

        {/* Weak domains */}
        <div className="mt-3 rounded-xl border border-border bg-background/40 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Weak domains</p>
          <div className="mt-2 flex flex-col gap-2">
            {data.weakDomains.map((d) => (
              <div key={d.domain} className="flex items-center gap-2">
                <span className="w-32 shrink-0 truncate text-[11px]">{d.domain}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full rounded-full bg-accent-cyan"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
                  {d.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 p-2.5">
          <Sparkles className="size-4 shrink-0 text-brand" />
          <p className="text-[11px] leading-snug">
            <span className="text-muted-foreground">Next up: </span>
            <span className="font-medium">{data.nextRecommendation}</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
