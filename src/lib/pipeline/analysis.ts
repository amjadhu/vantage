import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db/client";
import { eq, desc, like } from "drizzle-orm";

export async function generateAnalysis(opts: {
  topic: string;
  type: "competitive" | "trend" | "regulatory" | "threat";
  personaId?: string;
}): Promise<{ analysisId: string; totalTokens: number }> {
  // Find relevant articles
  const articles = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .leftJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .where(like(schema.articles.title, `%${opts.topic}%`))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(15);

  const articleData = articles.map(({ article, enrichment, source }) => ({
    title: article.title,
    summary: enrichment?.executiveSummary || article.summary || article.content.substring(0, 300),
    source: source?.name || "Unknown",
  }));

  const prompt = buildAnalysisPrompt(opts.topic, articleData, opts.type);

  const response = await callClaude({
    model: "claude-opus-4-6",
    prompt,
    maxTokens: 8192,
    temperature: 0.4,
  });

  const analysisId = uuid();

  await db.insert(schema.analyses).values({
    id: analysisId,
    title: `${opts.type.charAt(0).toUpperCase() + opts.type.slice(1)} Analysis: ${opts.topic}`,
    type: opts.type,
    markdownContent: response.content,
    articleIds: articles.map(({ article }) => article.id),
    personaId: opts.personaId || null,
    modelUsed: "claude-opus-4-6",
    tokenCount: response.inputTokens + response.outputTokens,
    generatedAt: new Date().toISOString(),
  });

  return {
    analysisId,
    totalTokens: response.inputTokens + response.outputTokens,
  };
}
