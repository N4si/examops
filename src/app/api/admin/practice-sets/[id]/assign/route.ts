import { NextRequest, NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { assignQuestionsInputSchema } from "@/lib/admin-schemas"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = assignQuestionsInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const set = await prisma.practiceSet.findUnique({ where: { id: params.id } })
  if (!set) {
    return NextResponse.json({ error: "Practice set not found" }, { status: 404 })
  }

  const result = await prisma.question.updateMany({
    where: { id: { in: parsed.data.questionIds }, certId: set.certId },
    data: { practiceSetId: set.id },
  })

  return NextResponse.json({ count: result.count })
}
