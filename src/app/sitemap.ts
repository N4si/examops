import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const certs = await prisma.certification.findMany({ select: { slug: true } })

  const staticRoutes = [
    "",
    "/certs",
    "/pricing",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }))

  const certRoutes = certs.map((cert) => ({
    url: `${SITE_URL}/certs/${cert.slug}`,
    lastModified: new Date(),
  }))

  return [...staticRoutes, ...certRoutes]
}
