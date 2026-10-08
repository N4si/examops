// Only same-origin relative paths are allowed as post-sign-in redirects, so a
// crafted ?callbackUrl= can't send someone to another site after login.
// "//host" and "/\host" are rejected because browsers treat both as
// protocol-relative URLs to another origin.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/

export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!raw) return fallback
  if (!raw.startsWith("/")) return fallback
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback
  if (raw.includes("://")) return fallback
  if (CONTROL_CHARS.test(raw)) return fallback
  return raw
}
