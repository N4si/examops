import { existsSync, readFileSync } from "fs"
import { extname } from "path"

import type { GoogleGenAI } from "@google/genai"

import { buildSourceExtractionPrompt } from "./prompts"

const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"])

export type SourceExtraction = {
  concepts: string[]
  learningObjectives: string[]
}

const SOURCE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    concepts: { type: "array", items: { type: "string" } },
    learningObjectives: { type: "array", items: { type: "string" } },
  },
  required: ["concepts", "learningObjectives"],
}

/**
 * Reads and validates a --source file. Exits the process directly (matching
 * this pipeline's existing CLI error-handling style) on any failure.
 */
export function readSourceFile(path: string): string {
  const ext = extname(path).toLowerCase()
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    console.error("Only .md and .txt supported in v1")
    process.exit(1)
  }

  if (!existsSync(path)) {
    console.error(`Source file not found: ${path}`)
    process.exit(1)
  }

  const content = readFileSync(path, "utf-8")
  if (content.trim().length < 50) {
    console.error("Source file appears empty")
    process.exit(1)
  }

  return content
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function extractSourceConcepts({
  ai,
  model,
  sourceText,
}: {
  ai: GoogleGenAI
  model: string
  sourceText: string
}): Promise<{ extraction: SourceExtraction; inputTokens: number; outputTokens: number }> {
  const response = await ai.models.generateContent({
    model,
    contents: buildSourceExtractionPrompt(sourceText),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: SOURCE_EXTRACTION_SCHEMA,
      maxOutputTokens: 4000,
    },
  })

  const rawText = response.text
  if (!rawText) {
    console.error("Source concept extraction returned no output.")
    process.exit(1)
  }

  let extraction: SourceExtraction
  try {
    extraction = JSON.parse(rawText)
  } catch {
    console.error("Source concept extraction output was not valid JSON:")
    console.error(rawText)
    process.exit(1)
  }

  if (!Array.isArray(extraction.concepts) || extraction.concepts.length === 0) {
    console.error("Source concept extraction found no concepts in the source file.")
    process.exit(1)
  }

  const usage = response.usageMetadata
  return {
    extraction,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
  }
}
