import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildBriefingPrompt } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db/client";
import { getDefaultPersona } from "@/lib/db/queries";
import { eq, desc, gte } from "drizzle-orm";

export async function runBriefingPipeline(): Promise<{
  briefingId: string;
  articleCount: number;
  totalTokens: number;
}> {
  const persona = await getDefaultPersona();
  if (!persona) {
    throw new Error("No default persona found");
  }

  // Get enriched articles from the last 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  // Fetch more candidates than needed so we can diversify
  const allCandidates = await db
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
    .limit(80);

  // Diversify: ensure no single source category dominates the briefing.
  // Take top items but cap any single category at ~40% of the total.
  const TARGET = 30;
  const MAX_PER_CATEGORY = Math.ceil(TARGET * 0.4); // 12
  const enrichedArticles: typeof allCandidates = [];
  const categoryCount: Record<string, number> = {};

  // First pass: always include critical/high impact items regardless of category
  for (const item of allCandidates) {
    if (enrichedArticles.length >= TARGET) break;
    const impact = item.enrichment.impactLevel;
    if (impact === "critical" || impact === "high") {
      const cat = item.source?.category || "unknown";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      enrichedArticles.push(item);
    }
  }

  // Second pass: fill remaining slots with diversity cap
  for (const item of allCandidates) {
    if (enrichedArticles.length >= TARGET) break;
    if (enrichedArticles.some((e) => e.article.id === item.article.id)) continue;
    const cat = item.source?.category || "unknown";
    if ((categoryCount[cat] || 0) >= MAX_PER_CATEGORY) continue;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    enrichedArticles.push(item);
  }

  // Third pass: if still under target, fill with remaining top-scored items
  for (const item of allCandidates) {
    if (enrichedArticles.length >= TARGET) break;
    if (enrichedArticles.some((e) => e.article.id === item.article.id)) continue;
    enrichedArticles.push(item);
  }

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

  const prompt = buildBriefingPrompt(articleData);

  const response = await callClaude({
    model: "claude-sonnet-4-5-20250929",
    prompt,
    maxTokens: 4096,
    temperature: 0.4,
  });

  const briefingId = uuid();
  const articleIds = enrichedArticles.map(({ article }) => article.id);

  await db.insert(schema.briefings).values({
    id: briefingId,
    personaId: persona.id,
    markdownContent: response.content,
    articleIds,
    modelUsed: "claude-sonnet-4-5-20250929",
    tokenCount: response.inputTokens + response.outputTokens,
    generatedAt: new Date().toISOString(),
  });

  return {
    briefingId,
    articleCount: enrichedArticles.length,
    totalTokens: response.inputTokens + response.outputTokens,
  };
}
