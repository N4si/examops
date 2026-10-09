import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

// Local SVGs in public/vendors/ — kept in sync with VendorLogo's known-vendor
// list (src/components/vendor-logo.tsx). Falls back to the vendor's first
// initial when no logo file exists for the slug.
const KNOWN_VENDORS = new Set([
  "aws",
  "azure",
  "gcp",
  "kubernetes",
  "docker",
  "github",
  "hashicorp",
  "terraform",
])

const SIZES = {
  sm: { box: 32, icon: 18, text: "text-sm" },
  md: { box: 48, icon: 28, text: "text-lg" },
  lg: { box: 64, icon: 36, text: "text-2xl" },
} as const

export function VendorBadge({
  slug,
  vendor,
  brandColor,
  size = "md",
}: {
  slug: string
  vendor: string
  brandColor: string
  size?: keyof typeof SIZES
}) {
  const { box, icon, text } = SIZES[size]
  const hasLogo = Boolean(slug) && KNOWN_VENDORS.has(slug)

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg", text)}
      style={
        {
          width: box,
          height: box,
          backgroundColor: `color-mix(in oklch, ${brandColor} 20%, transparent)`,
          color: brandColor,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/vendors/${slug}.svg`}
          alt=""
          width={icon}
          height={icon}
          style={{ width: icon, height: icon, objectFit: "contain" }}
        />
      ) : (
        <span className="font-bold">{vendor.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}
