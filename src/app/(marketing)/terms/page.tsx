import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of ExamOps.",
}

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="prose prose-invert mt-8 max-w-none">
        <h2>Introduction</h2>
        <p>
          This is placeholder terms-of-service copy for ExamOps while the product is in
          beta. It is not final legal language — a real terms document will replace this
          section before general availability.
        </p>

        <h2>Using ExamOps</h2>
        <p>
          Template section. In practice this will describe acceptable use of practice
          content and account restrictions.
        </p>

        <h2>Subscriptions and Billing</h2>
        <p>
          Template section. In practice this will describe how paid plans, renewals, and
          cancellations work.
        </p>

        <h2>Your Rights</h2>
        <p>
          Template section. In practice this will describe your rights as a user and any
          limitations of liability.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this placeholder document can be sent to{" "}
          <a href="mailto:hello@examops.dev">hello@examops.dev</a>.
        </p>
      </div>
    </section>
  )
}
