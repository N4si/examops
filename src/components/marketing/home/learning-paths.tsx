"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { VendorLogo } from "@/components/vendor-logo"
import { cn } from "@/lib/utils"
import type { LearningPath } from "@/lib/home-data"

const ACCENT: Record<LearningPath["accent"], { text: string; bg: string; ring: string }> = {
  brand: { text: "text-brand", bg: "bg-brand", ring: "ring-brand/30" },
  blue: { text: "text-accent-blue", bg: "bg-accent-blue", ring: "ring-accent-blue/30" },
  cyan: { text: "text-accent-cyan", bg: "bg-accent-cyan", ring: "ring-accent-cyan/30" },
  success: { text: "text-success", bg: "bg-success", ring: "ring-success/30" },
}

const VENDOR_LOGO: Record<string, string> = {
  AWS: "aws",
  Azure: "azure",
  GCP: "gcp",
  Kubernetes: "kubernetes",
  Docker: "docker",
  Terraform: "terraform",
  GitHub: "github",
  Security: "",
}

export function LearningPaths({ paths }: { paths: LearningPath[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {paths.map((path, i) => {
        const accent = ACCENT[path.accent]
        return (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{path.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{path.role}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
                  accent.text,
                  accent.ring
                )}
              >
                {path.steps.length} steps
              </span>
            </div>

            {/* Timeline */}
            <ol className="relative mt-5 flex flex-col gap-4 pl-1">
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
              />
              {path.steps.map((step) => {
                const logo = VENDOR_LOGO[step.vendor] ?? ""
                const node = (
                  <li className="relative flex items-center gap-3">
                    <span
                      className={cn(
                        "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background",
                        step.slug && "ring-2",
                        step.slug && accent.ring
                      )}
                    >
                      {logo ? (
                        <VendorLogo slug={logo} size={16} />
                      ) : (
                        <span className={cn("size-2 rounded-full", accent.bg)} />
                      )}
                    </span>
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm">{step.label}</span>
                      {step.slug ? (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-[11px] font-medium",
                            accent.text
                          )}
                        >
                          <Check className="size-3" /> Available
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Soon</span>
                      )}
                    </div>
                  </li>
                )
                return step.slug ? (
                  <Link key={step.label} href={`/certs/${step.slug}`} className="group">
                    {node}
                  </Link>
                ) : (
                  <div key={step.label}>{node}</div>
                )
              })}
            </ol>
          </motion.div>
        )
      })}
    </div>
  )
}
