import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  examSubmissionSchema,
  gradePracticeAnswer,
  gradeSubmission,
  isAnswerCorrect,
  practiceAnswerSchema,
  sanitizeStartedAt,
  type GradableQuestion,
} from "./exam-grading"

function question(overrides: Partial<GradableQuestion> & { id: string }): GradableQuestion {
  return {
    domain: "Cloud Concepts",
    text: `Question ${overrides.id}`,
    options: ["A", "B", "C", "D"],
    correctAnswers: ["A"],
    explanation: "Because A.",
    detailedExplanation: "Because A, in detail.",
    ...overrides,
  }
}

const questions: GradableQuestion[] = [
  question({ id: "q1", correctAnswers: ["A"] }),
  question({ id: "q2", correctAnswers: ["B"] }),
  question({ id: "q3", domain: "Security", correctAnswers: ["A", "C"] }),
  question({ id: "q4", domain: "Security", correctAnswers: ["D"] }),
]

describe("isAnswerCorrect", () => {
  it("accepts an exact single-select match", () => {
    assert.equal(isAnswerCorrect(["A"], ["A"]), true)
  })

  it("accepts a multi-select match in any order", () => {
    assert.equal(isAnswerCorrect(["C", "A"], ["A", "C"]), true)
  })

  it("rejects a partial multi-select answer", () => {
    assert.equal(isAnswerCorrect(["A"], ["A", "C"]), false)
  })

  it("rejects selecting every option", () => {
    assert.equal(isAnswerCorrect(["A", "B", "C", "D"], ["A", "C"]), false)
  })

  it("rejects duplicated selections padding out a multi-select answer", () => {
    assert.equal(isAnswerCorrect(["A", "A"], ["A", "C"]), false)
  })

  it("rejects an empty selection", () => {
    assert.equal(isAnswerCorrect([], ["A"]), false)
  })

  it("rejects option text that isn't one of the correct answers", () => {
    assert.equal(isAnswerCorrect(["a"], ["A"]), false)
    assert.equal(isAnswerCorrect(["A "], ["A"]), false)
  })
})

describe("gradeSubmission", () => {
  it("scores a fully correct submission", () => {
    const result = gradeSubmission(questions, {
      q1: ["A"],
      q2: ["B"],
      q3: ["C", "A"],
      q4: ["D"],
    })
    assert.equal(result.correctCount, 4)
    assert.equal(result.totalCount, 4)
    assert.equal(result.score, 1)
    assert.deepEqual(result.missed, [])
    assert.deepEqual(result.domainBreakdown, { "Cloud Concepts": 1, Security: 1 })
  })

  it("scores a mixed submission with per-domain stats and missed questions", () => {
    const result = gradeSubmission(questions, {
      q1: ["A"],
      q2: ["C"],
      q3: ["A", "C"],
    })
    assert.equal(result.correctCount, 2)
    assert.equal(result.score, 0.5)
    assert.deepEqual(result.domainStats, [
      { domain: "Cloud Concepts", correct: 1, total: 2 },
      { domain: "Security", correct: 1, total: 2 },
    ])
    assert.deepEqual(
      result.missed.map((m) => m.questionId),
      ["q2", "q4"]
    )
    assert.deepEqual(result.missed[0].correctAnswers, ["B"])
  })

  it("counts unanswered questions as incorrect against the full set size", () => {
    const result = gradeSubmission(questions, {})
    assert.equal(result.correctCount, 0)
    assert.equal(result.totalCount, 4)
    assert.equal(result.score, 0)
    assert.equal(result.missed.length, 4)
  })

  it("returns a zero score for an empty set instead of NaN", () => {
    const result = gradeSubmission([], {})
    assert.equal(result.score, 0)
    assert.equal(result.totalCount, 0)
  })

  describe("tampered submissions", () => {
    it("ignores answers for question IDs outside the set", () => {
      const result = gradeSubmission(questions, {
        q1: ["A"],
        "not-in-set-1": ["A"],
        "not-in-set-2": ["A"],
      })
      assert.equal(result.correctCount, 1)
      assert.equal(result.totalCount, 4)
      assert.equal(result.score, 0.25)
    })

    it("does not let a duplicated selection pass a multi-select question", () => {
      const result = gradeSubmission(questions, { q3: ["A", "A"] })
      assert.equal(result.correctCount, 0)
    })

    it("marks a single-select question wrong when every option is selected", () => {
      const result = gradeSubmission(questions, { q1: ["A", "B", "C", "D"] })
      assert.equal(result.correctCount, 0)
    })

    it("marks invented option text wrong", () => {
      const result = gradeSubmission(questions, { q1: ["A", "an option that doesn't exist"] })
      assert.equal(result.correctCount, 0)
    })

    it("is not fooled by prototype keys in the answers object", () => {
      const answers = JSON.parse('{"__proto__": {"q1": ["A"]}, "constructor": ["A"]}')
      const result = gradeSubmission(questions, answers)
      assert.equal(result.correctCount, 0)
    })
  })
})

describe("examSubmissionSchema", () => {
  const valid = {
    setId: "set-1",
    startedAt: "2026-10-08T10:00:00.000Z",
    answers: { q1: ["A"] },
  }

  it("accepts a well-formed submission", () => {
    assert.equal(examSubmissionSchema.safeParse(valid).success, true)
  })

  it("strips a client-supplied score, certId and domain breakdown", () => {
    const parsed = examSubmissionSchema.parse({
      ...valid,
      score: 1,
      certId: "some-other-cert",
      domainBreakdown: { "Cloud Concepts": 1 },
      questionsAnswered: 9999,
    })
    assert.deepEqual(Object.keys(parsed).sort(), ["answers", "setId", "startedAt"])
  })

  it("rejects a missing setId", () => {
    const result = examSubmissionSchema.safeParse({ ...valid, setId: undefined })
    assert.equal(result.success, false)
  })

  it("rejects non-string selections", () => {
    const result = examSubmissionSchema.safeParse({ ...valid, answers: { q1: [0] } })
    assert.equal(result.success, false)
  })

  it("rejects a selection that isn't an array", () => {
    const result = examSubmissionSchema.safeParse({ ...valid, answers: { q1: "A" } })
    assert.equal(result.success, false)
  })

  it("rejects an invalid startedAt", () => {
    const result = examSubmissionSchema.safeParse({ ...valid, startedAt: "yesterday" })
    assert.equal(result.success, false)
  })

  it("rejects an oversized selection list", () => {
    const result = examSubmissionSchema.safeParse({
      ...valid,
      answers: { q1: Array.from({ length: 21 }, (_, i) => `opt-${i}`) },
    })
    assert.equal(result.success, false)
  })

  it("rejects an oversized answers map", () => {
    const answers = Object.fromEntries(
      Array.from({ length: 501 }, (_, i) => [`q${i}`, ["A"]])
    )
    assert.equal(examSubmissionSchema.safeParse({ ...valid, answers }).success, false)
  })
})

describe("practice answers", () => {
  it("returns feedback with the correct answers and explanations", () => {
    const feedback = gradePracticeAnswer(questions[2], ["C", "A"])
    assert.deepEqual(feedback, {
      isCorrect: true,
      correctAnswers: ["A", "C"],
      explanation: "Because A.",
      detailedExplanation: "Because A, in detail.",
    })
  })

  it("marks a wrong practice answer incorrect", () => {
    assert.equal(gradePracticeAnswer(questions[0], ["B"]).isCorrect, false)
  })

  it("rejects a malformed practice payload", () => {
    assert.equal(practiceAnswerSchema.safeParse({ questionId: "q1" }).success, false)
    assert.equal(
      practiceAnswerSchema.safeParse({ questionId: "q1", selected: "A" }).success,
      false
    )
  })
})

describe("sanitizeStartedAt", () => {
  const now = new Date("2026-10-08T12:00:00.000Z")

  it("keeps a start time in the past", () => {
    const started = "2026-10-08T10:30:00.000Z"
    assert.equal(sanitizeStartedAt(started, now).toISOString(), started)
  })

  it("replaces a start time in the future with now", () => {
    assert.equal(sanitizeStartedAt("2026-10-09T00:00:00.000Z", now), now)
  })

  it("replaces an unparseable start time with now", () => {
    assert.equal(sanitizeStartedAt("not a date", now), now)
  })
})
