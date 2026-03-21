import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildEnrichmentPrompt } from "@/lib/ai/prompts";
import { parseEnrichmentResponse } from "@/lib/ai/parse";
import { getUnenrichedArticles, getDefaultPersona, insertEnrichment } from "@/lib/db/queries";
import { db, schema } from "@/lib/db/client";
import { inArray } from "drizzle-orm";
import { withConcurrency } from "@/lib/utils/concurrency";

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

  const articles = await getUnenrichedArticles(limit);

  // Pre-fetch all source names in one query
  const sourceIds = [...new Set(articles.map((a) => a.sourceId))];
  const sourceMap = new Map<string, string>();
  if (sourceIds.length > 0) {
    const sources = await db
      .select({ id: schema.sources.id, name: schema.sources.name })
      .from(schema.sources)
      .where(inArray(schema.sources.id, sourceIds));
    for (const s of sources) {
      sourceMap.set(s.id, s.name);
    }
  }

  let enriched = 0;
  let failed = 0;
  let totalTokens = 0;
  const errors: string[] = [];

  await withConcurrency(articles, 4, async (article) => {
    try {
      const sourceName = sourceMap.get(article.sourceId) || "Unknown";

      const prompt = buildEnrichmentPrompt({
        title: article.title,
        content: article.content,
        source: sourceName,
        publishedAt: article.publishedAt,
      });

      const response = await callClaude({
        model: "claude-haiku-4-5-20251001",
        prompt,
        maxTokens: 512,
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
        connectionHints: [],
        modelUsed: "claude-haiku-4-5-20251001",
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
    await new Promise((r) => setTimeout(r, 100));
  });

  return { enriched, failed, errors, totalTokens };
}
