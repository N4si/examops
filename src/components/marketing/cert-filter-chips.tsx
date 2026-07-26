"use client"

import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"

const VENDORS = ["All", "AWS", "Azure", "GCP", "Kubernetes", "DevOps", "AI"]

export function CertFilterChips() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get("vendor") ?? "All"

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {VENDORS.map((vendor) => {
        const isActive = active === vendor
        const href = vendor === "All" ? pathname : `${pathname}?vendor=${encodeURIComponent(vendor)}`

        return (
          // Plain <a>, not next/link: the client router cache can serve a
          // stale render when only the `?vendor=` query string changes on
          // this same route, so a full navigation is used to guarantee a
          // fresh filtered result every time.
          <a
            key={vendor}
            href={href}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-transparent bg-white/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {vendor}
          </a>
        )
      })}
    </div>
  )
}
