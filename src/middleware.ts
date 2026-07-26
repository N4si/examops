import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"])

// /dashboard/* auth is enforced in src/app/dashboard/layout.tsx (a Server
// Component, running in the Node.js runtime) instead of here. Auth.js is
// configured with `session: { strategy: "database" }`, which needs a real
// Prisma/Postgres connection on every check — that works in middleware under
// `next dev`/`next start` (not a true sandboxed runtime), but Vercel's actual
// Edge Network runs middleware in a V8 isolate that can't open raw TCP, so a
// Prisma call here would break in that specific deployment target. Keeping
// this file admin-only (a plain cookie-string comparison, no DB call) keeps
// it edge-safe everywhere.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const session = request.cookies.get("admin_session")?.value
  const adminPassword = process.env.ADMIN_PASSWORD
  const isAuthorized = Boolean(adminPassword) && session === adminPassword

  if (isAuthorized) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/admin/login", request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
