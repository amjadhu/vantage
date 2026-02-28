import { z } from "zod/v4";
import type { EnrichmentResult, ArticleConnection } from "@/types";

const enrichmentSchema = z.object({
  executiveSummary: z.string(),
  relevanceScore: z.number().min(0).max(1),
  impactLevel: z.enum(["critical", "high", "medium", "low", "informational"]),
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["company", "person", "technology", "vulnerability", "regulation", "product"]),
    })
  ),
  categoryTags: z.array(z.string()),
  keyFacts: z.array(z.string()),
  connectionHints: z.array(z.string()),
});

const connectionSchema = z.array(
  z.object({
    sourceArticleId: z.string(),
    targetArticleId: z.string(),
    relationshipType: z.enum(["related", "follow-up", "contradicts", "caused-by"]),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
  })
);

function extractJson(text: string): string {
  // Try to find JSON in the response, handling possible markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find array or object
  const start = text.indexOf("[") !== -1 && (text.indexOf("{") === -1 || text.indexOf("[") < text.indexOf("{"))
    ? text.indexOf("[")
    : text.indexOf("{");
  const end = text.lastIndexOf("]") !== -1 && (text.lastIndexOf("}") === -1 || text.lastIndexOf("]") > text.lastIndexOf("}"))
    ? text.lastIndexOf("]") + 1
    : text.lastIndexOf("}") + 1;

  if (start >= 0 && end > start) {
    return text.substring(start, end);
  }

  return text;
}

export function parseEnrichmentResponse(text: string): EnrichmentResult {
  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr);
  return enrichmentSchema.parse(parsed);
}

export function parseConnectionResponse(text: string): ArticleConnection[] {
  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr);
  return connectionSchema.parse(parsed);
}
