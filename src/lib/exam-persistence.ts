import { prisma } from "@/lib/prisma"

export type ExamResults = {
  startedAt: Date
  score: number // 0..1
  domainBreakdown: Record<string, number> // domain -> 0..1
  questionsAnswered: number
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function recordAttempt(userId: string, certId: string, results: ExamResults) {
  const completedAt = new Date()
  const today = startOfDay(completedAt)
  const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000))

  await prisma.$transaction(
    async (tx) => {
      await tx.examAttempt.create({
        data: {
          userId,
          certId,
          startedAt: results.startedAt,
          completedAt,
          score: results.score,
          domainBreakdown: results.domainBreakdown,
        },
      })

      const existingToday = await tx.dailyActivity.findUnique({
        where: { userId_date: { userId, date: today } },
      })

      if (existingToday) {
        await tx.dailyActivity.update({
          where: { userId_date: { userId, date: today } },
          data: { questionsAnswered: { increment: results.questionsAnswered } },
        })
      } else {
        await tx.dailyActivity.create({
          data: { userId, date: today, questionsAnswered: results.questionsAnswered },
        })
      }

      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })

      // Same-day repeats don't extend the streak — only bump it the first time
      // activity lands on a new day, and only when yesterday was also active.
      let newStreak = user.currentStreak
      if (!existingToday) {
        const yesterdayActivity = await tx.dailyActivity.findUnique({
          where: { userId_date: { userId, date: yesterday } },
        })
        newStreak = yesterdayActivity ? user.currentStreak + 1 : 1
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastActiveAt: completedAt,
        },
      })
    },
    // Neon (serverless Postgres) can have cold-start latency on the first
    // query after idling — Prisma's 5s default transaction timeout can be
    // too tight for that plus 5 sequential queries. Give it more headroom.
    { timeout: 15000, maxWait: 10000 }
  )
}
