import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

export default async function StudyNotePage({
  params,
}: {
  params: { slug: string; noteId: string }
}) {
  const note = await prisma.studyNote.findFirst({
    where: { id: params.noteId, cert: { slug: params.slug } },
    include: { cert: true },
  })

  if (!note) notFound()

  return (
    <article className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <Button variant="outline" render={<Link href={`/certs/${params.slug}`} />}>
        ← Back to {note.cert.name}
      </Button>

      <p className="mt-8 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {note.domain}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        {note.title}
      </h1>

      <div className="prose prose-invert prose-lg mt-8 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.contentMd}</ReactMarkdown>
      </div>
    </article>
  )
}
