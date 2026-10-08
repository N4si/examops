import { NextRequest, NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { practiceSetInputSchema } from "@/lib/admin-schemas"

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = practiceSetInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { certSlug, ...data } = parsed.data

  const cert = await prisma.certification.findUnique({ where: { slug: certSlug } })
  if (!cert) {
    return NextResponse.json({ error: `Unknown certSlug: ${certSlug}` }, { status: 400 })
  }

  const existing = await prisma.practiceSet.findUnique({
    where: { certId_number: { certId: cert.id, number: data.number } },
  })
  if (existing) {
    return NextResponse.json(
      { error: `Practice set number ${data.number} already exists for this cert` },
      { status: 400 }
    )
  }

  const practiceSet = await prisma.practiceSet.create({
    data: { certId: cert.id, ...data },
  })

  return NextResponse.json(practiceSet, { status: 201 })
}
