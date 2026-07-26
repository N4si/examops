import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

// Server-side auth guard for protected routes. Runs in the Node.js runtime
// (Server Components / route handlers), not Edge — safe to use with Auth.js's
// database session strategy, unlike calling auth() from middleware.
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}
