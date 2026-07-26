import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description: "Why we're building ExamOps and who it's for.",
}

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">About ExamOps</h1>
      <div className="prose prose-invert mt-8 max-w-none">
        <p>
          We built ExamOps because most cert-prep material is either an exam dump copied
          from forums or a bloated course that takes ten hours to say what a good
          practice question could teach in ten minutes. We wanted something narrower:
          real practice questions, explanations that actually teach the underlying
          concept, and nothing else in the way.
        </p>
        <p>
          ExamOps is for engineers who are already busy — people studying for an AWS,
          Azure, GCP, Kubernetes, DevOps, or AI certification around a full-time job, not
          people with a spare semester. If you learn best by doing problems and reading a
          tight explanation of what you got wrong, this is built for you.
        </p>
        <p>
          We&apos;re small and early — this is a beta, the question bank is still
          growing, and we&apos;d rather ship a few certs well than a hundred shallow
          ones. Feedback shapes what we build next.
        </p>
      </div>
    </section>
  )
}
