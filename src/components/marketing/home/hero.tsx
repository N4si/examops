"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Search, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/lib/home-data"
import { useCertFilter } from "@/components/marketing/home/filter-context"
import { FloatingDashboard } from "@/components/marketing/home/floating-dashboard"

function scrollToExplorer() {
  document
    .getElementById("certifications")
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function Hero({
  vendors,
  dashboard,
}: {
  vendors: string[]
  dashboard: DashboardData
}) {
  const { query, setQuery, vendor, setVendor } = useCertFilter()
  const chips = vendors.slice(0, 11)

  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-10 sm:px-6 md:pt-20">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left */}
        <div className="flex flex-col items-start gap-6">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-success" />
            AI-powered certification prep for developers
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            Master every
            <br />
            <span className="bg-gradient-to-r from-brand to-accent-cyan bg-clip-text text-transparent">
              IT certification.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Learn faster with AI-powered tutoring, expert notes, realistic practice
            exams, flashcards, labs and personalized roadmaps — for AWS, Azure, GCP,
            Kubernetes, Terraform, Linux, Security and AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button size="lg" render={<Link href="/certs" />}>
              Start learning
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToExplorer}
              render={<button type="button" />}
            >
              Browse certifications
            </Button>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="w-full max-w-xl"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3.5 py-2.5 shadow-sm backdrop-blur transition-colors focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/20">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) scrollToExplorer()
                }}
                placeholder="Search certifications, services, notes, flashcards or labs..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search certifications"
              />
            </div>

            {/* Chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((v) => {
                const isActive = vendor === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setVendor(v)
                      scrollToExplorer()
                    }}
                    aria-pressed={isActive}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      isActive
                        ? "border-brand/50 bg-brand/10 text-brand"
                        : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                    )}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Right — floating dashboard */}
        <div className="relative">
          <FloatingDashboard data={dashboard} />
        </div>
      </div>
    </section>
  )
}
