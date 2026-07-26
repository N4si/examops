import * as simpleIcons from "simple-icons"

type SimpleIcon = { title: string; slug: string; path: string }

// simple-icons exports each icon as a top-level `si<PascalSlug>` named export
// (e.g. slug "googlecloud" -> `siGooglecloud`) rather than a `icons/{slug}`
// subpath module, and this version of the package has no AWS or Azure icon at
// all (removed upstream for trademark reasons) — resolveIcon returning null
// for those slugs is expected and falls through to the placeholder below.
function resolveIcon(slug: string): SimpleIcon | null {
  if (!slug) return null
  const key = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`
  const icon = (simpleIcons as unknown as Record<string, SimpleIcon>)[key]
  return icon ?? null
}

export function VendorLogo({ slug, size = 24 }: { slug: string; size?: number }) {
  const icon = resolveIcon(slug)

  if (!icon) {
    return (
      <div
        className="shrink-0 rounded-full bg-muted"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label={icon.title}
      className="shrink-0"
    >
      <path d={icon.path} />
    </svg>
  )
}
