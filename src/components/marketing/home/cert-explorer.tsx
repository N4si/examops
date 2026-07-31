"use client"

import { useMemo } from "react"
import Link from "next/link"
import { SearchX } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CertView } from "@/lib/home-data"
import { useCertFilter } from "@/components/marketing/home/filter-context"
import { CertificationCard } from "@/components/marketing/home/certification-card"

export function CertExplorer({
  certs,
  vendors,
}: {
  certs: CertView[]
  vendors: string[]
}) {
  const { query, vendor, setVendor, setQuery } = useCertFilter()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return certs.filter((c) => {
      const matchesVendor = vendor === "All" || c.vendor === vendor
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.vendor.toLowerCase().includes(q) ||
        (c.examCode ?? "").toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      return matchesVendor && matchesQuery
    })
  }, [certs, query, vendor])

  return (
    <div>
      {/* Vendor rail */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {vendors.map((v) => {
          const isActive = vendor === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => setVendor(v)}
              aria-pressed={isActive}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
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

      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <SearchX className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No certifications match your search.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setVendor("All")
            }}
            className="text-sm font-medium text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cert) => (
            <CertificationCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/certs"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          Explore all certifications
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
