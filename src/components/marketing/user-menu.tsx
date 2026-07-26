"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SessionUser = {
  name?: string | null
  email: string
  image?: string | null
}

export function UserMenu({
  user,
  signOutAction,
}: {
  user: SessionUser
  signOutAction: () => Promise<void>
}) {
  const label = user.name ?? user.email
  const initial = label.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            className="size-6 rounded-full"
          />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {initial}
          </span>
        )}
        <span className="max-w-32 truncate text-sm">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem render={<button type="submit" className="w-full text-left" />}>
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
