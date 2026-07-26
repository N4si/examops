import type { Metadata } from "next"

import { PricingTiers } from "@/components/marketing/pricing-tiers"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for ExamOps — Free, Pro, and Team plans.",
}

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <h1 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
        Simple, transparent pricing
      </h1>
      <div className="mt-12">
        <PricingTiers />
      </div>
    </section>
  )
}
