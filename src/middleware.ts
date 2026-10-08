import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"]

// Admin access is checked in two layers:
//
// 1. Here (edge-safe, no DB): requests to /admin/* or /api/admin/* without an
//    Auth.js session cookie are turned away early — pages redirect to /login,
//    API routes get 401. Presence of the cookie proves nothing on its own.
// 2. In the Node.js runtime: every admin page calls requireAdminPage() and
//    every admin API handler calls requireAdminApi() (src/lib/admin-auth.ts),
//    which validate the session against the database and check ADMIN_EMAILS
//    plus a Google account. That is the real authorization check.
//
// Auth.js uses `session: { strategy: "database" }`, so validating a session
// needs Prisma/Postgres. Vercel runs middleware in a V8 isolate that can't
// open raw TCP, so no Prisma call belongs in this file.
//
// /dashboard/* auth is enforced separately in src/app/dashboard/layout.tsx.
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name))
  if (hasSessionCookie) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("callbackUrl", pathname + search)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
