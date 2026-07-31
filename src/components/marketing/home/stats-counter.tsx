"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

import type { StatItem } from "@/lib/home-data"

function format(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return n.toLocaleString()
}

function Counter({ stat }: { stat: StatItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const duration = 1400
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setValue(Math.round(eased * stat.value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, stat.value])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-4 py-6 text-center"
    >
      <span className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-3xl font-semibold tabular-nums text-transparent sm:text-4xl">
        {format(value)}
        {stat.suffix ?? ""}
      </span>
      <span className="text-xs text-muted-foreground">{stat.label}</span>
    </div>
  )
}

export function StatsCounter({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {stats.map((stat) => (
        <Counter key={stat.label} stat={stat} />
      ))}
    </div>
  )
}
