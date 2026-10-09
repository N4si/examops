import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "@/lib/auth"
import { safeCallbackUrl } from "@/lib/safe-redirect"

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to ExamOps to save your progress.",
}

const GOOGLE_CONFIGURED = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
)
const GITHUB_CONFIGURED = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
)

// redirectTo is bound into the form and comes back from the browser, so it is
// re-checked here rather than trusted.
async function signInWithGoogle(redirectTo: string) {
  "use server"
  await signIn("google", { redirectTo: safeCallbackUrl(redirectTo) })
}

async function signInWithGitHub(redirectTo: string) {
  "use server"
  await signIn("github", { redirectTo: safeCallbackUrl(redirectTo) })
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string | string[] }
}) {
  const callbackUrl =
    typeof searchParams.callbackUrl === "string" ? searchParams.callbackUrl : undefined
  const redirectTo = safeCallbackUrl(callbackUrl)
  const noProvidersConfigured = !GOOGLE_CONFIGURED && !GITHUB_CONFIGURED

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-xl font-medium">
            Sign in to ExamOps
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {GOOGLE_CONFIGURED && (
            <form action={signInWithGoogle.bind(null, redirectTo)}>
              <Button type="submit" variant="outline" className="w-full">
                Continue with Google
              </Button>
            </form>
          )}
          {GITHUB_CONFIGURED && (
            <form action={signInWithGitHub.bind(null, redirectTo)}>
              <Button type="submit" variant="outline" className="w-full">
                Continue with GitHub
              </Button>
            </form>
          )}
          {noProvidersConfigured && process.env.NODE_ENV !== "production" && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Auth is not configured — set <code>AUTH_GOOGLE_ID</code> /{" "}
              <code>AUTH_GITHUB_ID</code> (and their secrets) in <code>.env</code>. See
              the README for OAuth app setup.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
