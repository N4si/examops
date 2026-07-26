import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ExamOps collects, uses, and protects your data.",
}

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="prose prose-invert mt-8 max-w-none">
        <h2>Introduction</h2>
        <p>
          This is placeholder privacy policy copy for ExamOps while the product is in
          beta. It is not final legal language — a real policy will replace this section
          before general availability.
        </p>

        <h2>Data We Collect</h2>
        <p>
          Template section. In practice this will describe account details, practice
          activity, and any billing information we store to run the product.
        </p>

        <h2>How We Use It</h2>
        <p>
          Template section. In practice this will describe using your data to run the
          service, track your progress, and improve the question bank.
        </p>

        <h2>Your Rights</h2>
        <p>
          Template section. In practice this will describe how to access, export, or
          delete your data.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this placeholder policy can be sent to{" "}
          <a href="mailto:hello@examops.dev">hello@examops.dev</a>.
        </p>
      </div>
    </section>
  )
}
