import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildGlobalNewsBriefingPrompt } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db/client";
import { getDefaultPersona } from "@/lib/db/queries";
import { eq, desc, gte } from "drizzle-orm";

export async function runGlobalNewsBriefingPipeline(): Promise<{
  briefingId: string;
  articleCount: number;
  totalTokens: number;
}> {
  const persona = await getDefaultPersona();
  if (!persona) {
    throw new Error("No default persona found");
  }

  // Get articles from global sources in the last 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const allCandidates = await db
    .select({
      article: schema.articles,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .where(gte(schema.articles.publishedAt, yesterday.toISOString()))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(100);

  // Filter to global category only
  const globalArticles = allCandidates.filter(
    (item) => item.source.category === "global"
  );

  if (globalArticles.length === 0) {
    throw new Error("No global news articles available for briefing");
  }

  // Round-robin by source to ensure geographic diversity (max 3 per source)
  const MAX_PER_SOURCE = 3;
  const TARGET = 25;
  const sourceCount: Record<string, number> = {};
  const selected: typeof globalArticles = [];

  for (const item of globalArticles) {
    if (selected.length >= TARGET) break;
    const sourceName = item.source.name;
    if ((sourceCount[sourceName] || 0) >= MAX_PER_SOURCE) continue;
    sourceCount[sourceName] = (sourceCount[sourceName] || 0) + 1;
    selected.push(item);
  }

  const articleData = selected.map(({ article, source }) => ({
    title: article.title,
    summary: article.summary || article.content.substring(0, 300),
    source: source.name,
    url: article.url,
  }));

  const prompt = buildGlobalNewsBriefingPrompt(articleData);

  const response = await callClaude({
    model: "claude-sonnet-4-5-20250929",
    prompt,
    maxTokens: 4096,
    temperature: 0.5,
  });

  const briefingId = uuid();
  const articleIds = selected.map(({ article }) => article.id);

  await db.insert(schema.briefings).values({
    id: briefingId,
    personaId: persona.id,
    type: "global-news",
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
