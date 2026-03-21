import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildResearchBriefingPrompt } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db/client";
import { getDefaultPersona } from "@/lib/db/queries";
import { eq, desc, gte, and, isNotNull } from "drizzle-orm";

export async function runResearchBriefingPipeline(): Promise<{
  briefingId: string;
  articleCount: number;
  totalTokens: number;
}> {
  const persona = await getDefaultPersona();
  if (!persona) {
    throw new Error("No default persona found");
  }

  // Get enriched research articles from the last 48 hours
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  const allCandidates = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .innerJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(
      and(
        eq(schema.sources.category, "research"),
        gte(schema.articles.publishedAt, cutoff.toISOString())
      )
    )
    .orderBy(desc(schema.articles.publishedAt))
    .limit(150);

  if (allCandidates.length === 0) {
    throw new Error("No enriched research articles available for briefing");
  }

  // Round-robin by source for diversity (max 3 per source, target 30)
  const MAX_PER_SOURCE = 3;
  const TARGET = 20;
  const sourceCount: Record<string, number> = {};
  const selected: typeof allCandidates = [];

  for (const item of allCandidates) {
    if (selected.length >= TARGET) break;
    const sourceName = item.source.name;
    if ((sourceCount[sourceName] || 0) >= MAX_PER_SOURCE) continue;
    sourceCount[sourceName] = (sourceCount[sourceName] || 0) + 1;
    selected.push(item);
  }

  const articleData = selected.map(({ article, enrichment, source }) => ({
    title: article.title,
    summary: enrichment.executiveSummary || article.summary || article.content.substring(0, 300),
    keyFacts: (enrichment.keyFacts as string[]) || [],
    tags: (enrichment.categoryTags as string[]) || [],
    source: source.name,
    url: article.url,
  }));

  const prompt = buildResearchBriefingPrompt(articleData);

  const response = await callClaude({
    model: "claude-sonnet-4-5-20250929",
    prompt,
    maxTokens: 3072,
    temperature: 0.5,
  });

  const briefingId = uuid();
  const articleIds = selected.map(({ article }) => article.id);

  await db.insert(schema.briefings).values({
    id: briefingId,
    personaId: persona.id,
    type: "research",
    markdownContent: response.content,
    articleIds,
    modelUsed: "claude-sonnet-4-5-20250929",
    tokenCount: response.inputTokens + response.outputTokens,
    generatedAt: new Date().toISOString(),
  });

  return {
    briefingId,
    articleCount: selected.length,
    totalTokens: response.inputTokens + response.outputTokens,
  };
}
