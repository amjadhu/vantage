import { v4 as uuid } from "uuid";
import { callClaude } from "@/lib/ai/client";
import { buildCrowdStrikeBriefingPrompt } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db/client";
import { getDefaultPersona } from "@/lib/db/queries";
import { eq, desc, gte, or, like, and } from "drizzle-orm";

export async function runCrowdStrikeBriefingPipeline(): Promise<{
  briefingId: string;
  articleCount: number;
  totalTokens: number;
}> {
  const persona = await getDefaultPersona();
  if (!persona) {
    throw new Error("No default persona found");
  }

  // Get CrowdStrike articles from the last 48 hours
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  // Articles from crowdstrike category sources
  const categoryResults = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(
      and(
        eq(schema.sources.category, "crowdstrike"),
        gte(schema.articles.publishedAt, cutoff.toISOString())
      )
    )
    .orderBy(desc(schema.articles.publishedAt))
    .limit(30);

  // Articles from any source mentioning CrowdStrike in title
  const mentionResults = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(
      and(
        or(
          like(schema.articles.title, "%CrowdStrike%"),
          like(schema.articles.title, "%crowdstrike%"),
          like(schema.articles.title, "%CRWD%"),
        ),
        gte(schema.articles.publishedAt, cutoff.toISOString())
      )
    )
    .orderBy(desc(schema.articles.publishedAt))
    .limit(30);

  // Dedupe by article ID
  const seen = new Set<string>();
  const allCandidates: typeof categoryResults = [];
  for (const r of [...categoryResults, ...mentionResults]) {
    if (!seen.has(r.article.id)) {
      seen.add(r.article.id);
      allCandidates.push(r);
    }
  }

  // Sort by publishedAt desc, cap at 20
  allCandidates.sort((a, b) =>
    new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime()
  );
  const selected = allCandidates.slice(0, 20);

  if (selected.length === 0) {
    throw new Error("No CrowdStrike articles available for briefing in the last 48 hours");
  }

  const articleData = selected.map(({ article, enrichment, source }) => ({
    title: article.title,
    summary: enrichment?.executiveSummary || article.summary || article.content.substring(0, 300),
    source: source.name,
    url: article.url,
    impactLevel: enrichment?.impactLevel || undefined,
    tags: (enrichment?.categoryTags as string[]) || undefined,
  }));

  const prompt = buildCrowdStrikeBriefingPrompt(articleData);

  const response = await callClaude({
    model: "claude-sonnet-4-5-20250929",
    prompt,
    maxTokens: 2048,
    temperature: 0.4,
  });

  const briefingId = uuid();
  const articleIds = selected.map(({ article }) => article.id);

  await db.insert(schema.briefings).values({
    id: briefingId,
    personaId: persona.id,
    type: "crowdstrike",
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
