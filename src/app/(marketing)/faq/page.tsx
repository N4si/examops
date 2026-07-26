import type { Metadata } from "next"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ExamOps practice exams and plans.",
}

const FAQS = [
  {
    question: "How are the practice questions written?",
    answer:
      "Every question is written fresh by a human against the official exam guide for that certification — never copied from exam dumps or forums. Each one is checked against current documentation before it ships.",
  },
  {
    question: "How are practice exams scored?",
    answer:
      "Each practice set scores you on percentage correct overall and per domain, using the same domain weighting as the real exam, so you can see where to focus before test day.",
  },
  {
    question: "Do the questions match the real exam?",
    answer:
      "They're written to match the style, difficulty, and domain weighting of the official exam guides — but they're original questions, not reproductions of real exam content, which no legitimate prep tool can offer.",
  },
  {
    question: "Is there an exam-pass guarantee?",
    answer:
      "Not yet. We'd rather earn that claim with real pass-rate data as the question bank matures than promise it upfront.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer:
      "Free gives you one practice set per certification and quick notes. Pro unlocks every practice set, the AI quick-question tool, the AI roadmap generator, and progress tracking across certs.",
  },
  {
    question: "How do I cancel?",
    answer:
      "Cancel anytime from your account settings — you'll keep Pro access until the end of the current billing period, then drop to Free automatically.",
  },
  {
    question: "What's your refund policy?",
    answer:
      "If you're within the first 7 days of a paid plan and it's not for you, email us and we'll refund it in full, no questions asked.",
  },
  {
    question: "When do you add new certifications?",
    answer:
      "We prioritize by demand — new certs get added as we see enough engineers searching or asking for them, rather than trying to cover every catalog shallowly at once.",
  },
]

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Frequently asked questions
      </h1>
      <Accordion className="mt-12">
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.question} value={`faq-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
