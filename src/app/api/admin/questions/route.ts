import { NextRequest, NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { questionInputSchema } from "@/lib/admin-schemas"

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = questionInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { certSlug, ...data } = parsed.data

  const cert = await prisma.certification.findUnique({ where: { slug: certSlug } })
  if (!cert) {
    return NextResponse.json({ error: `Unknown certSlug: ${certSlug}` }, { status: 400 })
  }

  const question = await prisma.question.create({
    data: { certId: cert.id, ...data },
  })

  return NextResponse.json(question, { status: 201 })
}
