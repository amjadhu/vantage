import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildConnectionPrompt } from "@/lib/ai/prompts";
import { parseConnectionResponse } from "@/lib/ai/parse";
import { db, schema } from "@/lib/db/client";
import { desc, gte, eq } from "drizzle-orm";

export async function runConnectionPipeline(): Promise<{
  connectionsFound: number;
  totalTokens: number;
}> {
  // Get recently enriched articles
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  const enrichedArticles = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
    })
    .from(schema.articles)
    .innerJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(gte(schema.articles.publishedAt, cutoff.toISOString()))
    .orderBy(desc(schema.enrichments.relevanceScore))
    .limit(30);

  if (enrichedArticles.length < 2) {
    return { connectionsFound: 0, totalTokens: 0 };
  }

  const articleData = enrichedArticles.map(({ article, enrichment }) => ({
    id: article.id,
    title: article.title,
    summary: enrichment.executiveSummary,
    categoryTags: (enrichment.categoryTags as string[]) || [],
  }));

  const prompt = buildConnectionPrompt(articleData);

  const response = await callClaude({
    model: "claude-sonnet-4-5-20250929",
    prompt,
    maxTokens: 4096,
    temperature: 0.2,
  });

  const connections = parseConnectionResponse(response.content);

  // Validate that article IDs exist in our batch
  const validIds = new Set(articleData.map((a) => a.id));
  const validConnections = connections.filter(
    (c) => validIds.has(c.sourceArticleId) && validIds.has(c.targetArticleId)
  );

  for (const conn of validConnections) {
    await db.insert(schema.articleConnections).values({
      id: uuid(),
      sourceArticleId: conn.sourceArticleId,
      targetArticleId: conn.targetArticleId,
      relationshipType: conn.relationshipType,
      reasoning: conn.reasoning,
      confidence: conn.confidence,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    connectionsFound: validConnections.length,
    totalTokens: response.inputTokens + response.outputTokens,
  };
}
