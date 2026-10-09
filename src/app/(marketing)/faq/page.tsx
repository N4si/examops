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
      "Every question is original. Questions are drafted with AI assistance from official exam guides and documentation, then checked for accuracy and duplicates before they go live. We never use exam dumps or leaked questions.",
  },
  {
    question: "How are practice exams scored?",
    answer:
      "Each practice set has the real exam's question count and time limit. Your score is the percentage of questions you answer correctly, with a breakdown by domain.",
  },
  {
    question: "Do the questions match the real exam?",
    answer:
      "They're written to match the style and difficulty of the official exam guides and are mapped to the guide's domains — but they're original questions, not reproductions of real exam content, which no legitimate prep tool can offer.",
  },
  {
    question: "Is there an exam-pass guarantee?",
    answer:
      "Not yet. We'd rather earn that claim with real pass-rate data as the question bank matures than promise it upfront.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer:
      "Right now everything is free: every practice set, quick notes, and an explanation for every answer. Pro isn't available yet.",
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
