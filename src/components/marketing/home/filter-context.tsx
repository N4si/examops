"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type FilterState = {
  query: string
  setQuery: (v: string) => void
  vendor: string
  setVendor: (v: string) => void
}

const FilterContext = createContext<FilterState | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")
  const [vendor, setVendor] = useState("All")

  const value = useMemo(
    () => ({ query, setQuery, vendor, setVendor }),
    [query, vendor]
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useCertFilter() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error("useCertFilter must be used within FilterProvider")
  return ctx
}
