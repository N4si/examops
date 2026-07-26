import Link from "next/link"

import { Button } from "@/components/ui/button"
import { NavShell } from "@/components/marketing/nav-shell"
import { UserMenu } from "@/components/marketing/user-menu"
import { auth, signOutAction } from "@/lib/auth"

const LINKS = [
  { label: "Certifications", href: "#certifications" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "#" },
]

export async function MarketingNav() {
  const session = await auth()

  const authSlot = session?.user ? (
    <UserMenu user={session.user} signOutAction={signOutAction} />
  ) : (
    <>
      <Button variant="ghost" render={<Link href="/login" />}>
        Sign in
      </Button>
      <Button render={<Link href="/login" />}>Get started</Button>
    </>
  )

  return <NavShell links={LINKS} authSlot={authSlot} />
}
