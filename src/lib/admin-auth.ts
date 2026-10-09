import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Admin access = a signed-in user whose email is listed in ADMIN_EMAILS and
// who has signed in with Google at least once (an Account row with provider
// "google"). Missing or empty ADMIN_EMAILS means nobody is an admin.
//
// Every admin page and API handler must call requireAdminPage()/requireAdminApi()
// itself. Layout and middleware checks are not sufficient on their own.

export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

export function isAdminIdentity(
  email: string | null | undefined,
  providers: string[],
  allowlist: string[]
): boolean {
  if (!email) return false
  return allowlist.includes(email.toLowerCase()) && providers.includes("google")
}

async function getSessionAndAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { signedIn: false, admin: null }

  const allowlist = parseAdminEmails(process.env.ADMIN_EMAILS)
  if (allowlist.length === 0) return { signedIn: true, admin: null }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  })
  const providers = accounts.map((a) => a.provider)

  const admin = isAdminIdentity(session.user.email, providers, allowlist)
    ? session.user
    : null
  return { signedIn: true, admin }
}

export async function getAdminUser() {
  return (await getSessionAndAdmin()).admin
}

// For server components. redirect() throws, so callers can rely on code after
// this line only running for admins.
export async function requireAdminPage() {
  const { signedIn, admin } = await getSessionAndAdmin()
  if (!admin) redirect(signedIn ? "/" : "/login?callbackUrl=/admin")
  return admin
}

// For route handlers: returns null for admins, otherwise the response to send.
export async function requireAdminApi(): Promise<NextResponse | null> {
  const { signedIn, admin } = await getSessionAndAdmin()
  if (admin) return null
  return signedIn
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
