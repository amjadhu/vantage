import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildEnrichmentPrompt } from "@/lib/ai/prompts";
import { parseEnrichmentResponse } from "@/lib/ai/parse";
import { getUnenrichedArticles, getDefaultPersona, insertEnrichment } from "@/lib/db/queries";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import type { PersonaConfig } from "@/types";

export async function runEnrichmentPipeline(opts: {
  limit?: number;
} = {}): Promise<{
  enriched: number;
  failed: number;
  errors: string[];
  totalTokens: number;
}> {
  const { limit = 20 } = opts;

  const persona = await getDefaultPersona();
  if (!persona) {
    throw new Error("No default persona found");
  }

  const personaConfig = persona.config as PersonaConfig;
  const articles = await getUnenrichedArticles(limit);

  let enriched = 0;
  let failed = 0;
  let totalTokens = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      // Fetch source name
      const sourceResult = await db
        .select({ name: schema.sources.name })
        .from(schema.sources)
        .where(eq(schema.sources.id, article.sourceId))
        .limit(1);

      const sourceName = sourceResult[0]?.name || "Unknown";

      const prompt = buildEnrichmentPrompt(
        {
          title: article.title,
          content: article.content,
          source: sourceName,
          publishedAt: article.publishedAt,
        },
        personaConfig
      );

      const response = await callClaude({
        model: "claude-sonnet-4-5-20250929",
        prompt,
        maxTokens: 2048,
        temperature: 0.2,
      });

      const enrichment = parseEnrichmentResponse(response.content);

      await insertEnrichment({
        id: uuid(),
        articleId: article.id,
        personaId: persona.id,
        executiveSummary: enrichment.executiveSummary,
        relevanceScore: enrichment.relevanceScore,
        impactLevel: enrichment.impactLevel,
        sentiment: enrichment.sentiment,
        entities: enrichment.entities,
        categoryTags: enrichment.categoryTags,
        keyFacts: enrichment.keyFacts,
        connectionHints: enrichment.connectionHints,
        modelUsed: "claude-sonnet-4-5-20250929",
        tokenCount: response.inputTokens + response.outputTokens,
        enrichedAt: new Date().toISOString(),
      });

      totalTokens += response.inputTokens + response.outputTokens;
      enriched++;
      console.log(`[Enrich] Enriched: ${article.title.substring(0, 60)}...`);
    } catch (error) {
      failed++;
      const msg = `Failed to enrich "${article.title.substring(0, 40)}...": ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[Enrich] ${msg}`);
      errors.push(msg);
    }

    // Rate limit pause
    await new Promise((r) => setTimeout(r, 500));
  }

  return { enriched, failed, errors, totalTokens };
}
