// Local SVGs in public/vendors/ — simple-icons is missing AWS and Azure
// (removed upstream for trademark reasons), so every vendor logo is sourced
// and stored locally instead of depending on a third-party icon package.
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

export function VendorLogo({ slug, size = 24 }: { slug: string; size?: number }) {
  if (!slug || !KNOWN_VENDORS.has(slug)) {
    return (
      <div
        className="shrink-0 rounded-full bg-muted"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/vendors/${slug}.svg`}
      alt={`${slug} logo`}
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  )
}
