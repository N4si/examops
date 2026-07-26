import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ExamOps team.",
}

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Contact</h1>
      <div className="prose prose-invert mt-8 max-w-none">
        <p>
          Reach us at <a href="mailto:hello@examops.dev">hello@examops.dev</a> — we read
          every message.
        </p>
        <p>
          A proper contact form is coming soon; for now, email is the fastest way to
          reach us.
        </p>
      </div>
    </section>
  )
}
