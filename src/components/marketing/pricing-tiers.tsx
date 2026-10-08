"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Period = "monthly" | "annual"

type Tier = {
  name: string
  price: Record<Period, string>
  cadence: Record<Period, string>
  cta: string
  href: string
  highlighted?: boolean
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: { monthly: "$0", annual: "$0" },
    cadence: { monthly: "/mo", annual: "/mo" },
    cta: "Start practicing",
    href: "/certs",
    features: ["All practice sets", "Quick notes", "Explanations for every answer"],
  },
  {
    name: "Pro",
    price: { monthly: "$19", annual: "$190" },
    cadence: { monthly: "/mo", annual: "/yr" },
    cta: "Get notified",
    href: "/contact",
    highlighted: true,
    features: ["Not yet available", "Coming later"],
  },
  {
    name: "Team",
    price: { monthly: "Custom", annual: "Custom" },
    cadence: { monthly: "", annual: "" },
    cta: "Contact sales",
    href: "/contact",
    features: ["Not yet available", "Contact us for early access"],
  },
]

export function PricingTiers() {
  const [period, setPeriod] = useState<Period>("monthly")

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1">
        {(["monthly", "annual"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              period === p
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p === "monthly" ? "Monthly" : "Annual"}
            {p === "annual" && (
              <span className="ml-1.5 text-xs text-brand">2 months free</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid w-full gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={cn(
              "flex flex-col justify-between",
              tier.highlighted && "border-brand/50 ring-1 ring-brand/30"
            )}
          >
            <div>
              <CardHeader>
                <p className="text-sm font-medium text-muted-foreground">{tier.name}</p>
                <p className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {tier.price[period]}
                  </span>
                  {tier.cadence[period] && (
                    <span className="text-sm text-muted-foreground">
                      {tier.cadence[period]}
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </div>
            <CardFooter>
              <Button
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
                render={<Link href={tier.href} />}
              >
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
