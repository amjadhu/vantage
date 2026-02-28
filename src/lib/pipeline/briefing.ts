import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildBriefingPrompt } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db/client";
import { getDefaultPersona } from "@/lib/db/queries";
import { eq, desc, gte } from "drizzle-orm";
import type { PersonaConfig } from "@/types";

export async function runBriefingPipeline(): Promise<{
  briefingId: string;
  articleCount: number;
  totalTokens: number;
}> {
  const persona = await getDefaultPersona();
  if (!persona) {
    throw new Error("No default persona found");
  }

  const personaConfig = persona.config as PersonaConfig;

  // Get enriched articles from the last 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const enrichedArticles = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .leftJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .where(gte(schema.articles.publishedAt, yesterday.toISOString()))
    .orderBy(desc(schema.enrichments.relevanceScore))
    .limit(30);

  if (enrichedArticles.length === 0) {
    throw new Error("No enriched articles available for briefing");
  }

  const articleData = enrichedArticles.map(({ article, enrichment, source }) => ({
    title: article.title,
    summary: enrichment.executiveSummary,
    relevanceScore: enrichment.relevanceScore,
    impactLevel: enrichment.impactLevel,
    source: source?.name || "Unknown",
    url: article.url,
    categoryTags: (enrichment.categoryTags as string[]) || [],
  }));

  const prompt = buildBriefingPrompt(articleData, personaConfig);

  const response = await callClaude({
    model: "claude-opus-4-6",
    prompt,
    maxTokens: 8192,
    temperature: 0.4,
  });

  const briefingId = uuid();
  const articleIds = enrichedArticles.map(({ article }) => article.id);

  await db.insert(schema.briefings).values({
    id: briefingId,
    personaId: persona.id,
    markdownContent: response.content,
    articleIds,
    modelUsed: "claude-opus-4-6",
    tokenCount: response.inputTokens + response.outputTokens,
    generatedAt: new Date().toISOString(),
  });

  return {
    briefingId,
    articleCount: enrichedArticles.length,
    totalTokens: response.inputTokens + response.outputTokens,
  };
}
