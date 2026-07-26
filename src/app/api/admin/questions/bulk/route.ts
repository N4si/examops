import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { bulkQuestionInputSchema } from "@/lib/admin-schemas"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = bulkQuestionInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const slugs = Array.from(new Set(parsed.data.map((q) => q.certSlug)))
  const certs = await prisma.certification.findMany({ where: { slug: { in: slugs } } })
  const certIdBySlug = new Map(certs.map((c) => [c.slug, c.id]))

  const unknownSlug = slugs.find((slug) => !certIdBySlug.has(slug))
  if (unknownSlug) {
    return NextResponse.json({ error: `Unknown certSlug: ${unknownSlug}` }, { status: 400 })
  }

  const data = parsed.data.map(({ certSlug, ...q }) => ({
    certId: certIdBySlug.get(certSlug) as string,
    ...q,
  }))

  const result = await prisma.question.createMany({ data })

  return NextResponse.json({ count: result.count }, { status: 201 })
}
