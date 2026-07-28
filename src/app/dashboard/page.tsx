import type { Metadata } from "next"
import Link from "next/link"
import { Award, ListChecks } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/require-auth"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your ExamOps progress and recommended certifications.",
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const session = await requireAuth()

  const userId = session.user.id

  const [user, examAttempts, dailyActivityTotal, certs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.examAttempt.findMany({
      where: { userId },
      include: { cert: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.dailyActivity.aggregate({
      where: { userId },
      _sum: { questionsAnswered: true },
    }),
    prisma.certification.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  const totalQuestionsAnswered = dailyActivityTotal._sum.questionsAnswered ?? 0
  const mostRecentAttempt = examAttempts[0] ?? null

  const attemptedCertIds = new Set(examAttempts.map((a) => a.certId))
  const yourCerts = certs.filter((c) => attemptedCertIds.has(c.id))
  const recommendedCerts = certs.filter((c) => !attemptedCertIds.has(c.id))

  // ExamAttempt tracks a score + per-domain breakdown, not which specific
  // question IDs were answered (no per-question join table in the schema).
  // So "completion" here is approximated as all-or-nothing per cert: any
  // attempt counts the cert as fully attempted. Fine for a v1 dashboard —
  // revisit if/when per-question attempt tracking is added.
  function completionFor(certId: string) {
    return attemptedCertIds.has(certId) ? 100 : 0
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {session.user.name ?? session.user.email}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Current streak" value={`${user.currentStreak}d`} />
        <StatCard label="Longest streak" value={`${user.longestStreak}d`} />
        <StatCard label="Exam attempts" value={String(examAttempts.length)} />
        <StatCard label="Questions answered" value={String(totalQuestionsAnswered)} />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Continue where you left off</h2>
        {mostRecentAttempt ? (
          <Card className="mt-4">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{mostRecentAttempt.cert.name}</p>
                <p className="text-sm text-muted-foreground">
                  Last attempt{" "}
                  {mostRecentAttempt.completedAt
                    ? new Date(mostRecentAttempt.completedAt).toLocaleDateString()
                    : "in progress"}
                  {typeof mostRecentAttempt.score === "number" &&
                    ` · Score ${Math.round(mostRecentAttempt.score * 100)}%`}
                </p>
              </div>
              <Link
                href={`/certs/${mostRecentAttempt.cert.slug}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                Continue →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={ListChecks}
              title="You haven't taken a practice exam yet."
              action={
                <Link
                  href="/certs"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Browse certifications
                </Link>
              }
            />
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Your certifications</h2>
        {yourCerts.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Award}
              title="No certifications attempted yet."
              action={
                <Link
                  href="/certs"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Browse certifications
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {yourCerts.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {completionFor(cert.id)}% complete
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Recommended</h2>
        {recommendedCerts.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            You&apos;ve tried every cert we cover — nice.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recommendedCerts.map((cert) => (
              <Link key={cert.id} href={`/certs/${cert.slug}`}>
                <Card>
                  <CardContent className="flex flex-col gap-2 py-4">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cert._count.questions} questions
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
