import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TopicBreakdown } from "@/components/technology/TopicBreakdown";
import { ResearchCard } from "@/components/research/ResearchCard";
import { db, schema } from "@/lib/db/client";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const results = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(eq(schema.sources.category, "research"))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(60);

  // Extract top papers — prefer enriched by relevance, fall back to most recent
  const sorted = [...results].sort((a, b) => {
    const aScore = a.enrichment?.relevanceScore ?? -1;
    const bScore = b.enrichment?.relevanceScore ?? -1;
    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
  });

  const hasEnrichments = results.some((r) => r.enrichment);
  const topPapers = sorted.slice(0, 5);
  const remaining = results.filter((r) => !topPapers.some((t) => t.article.id === r.article.id));

  // Build topic breakdown from category tags, fall back to source breakdown
  const tagCounts: Record<string, number> = {};
  for (const { enrichment } of results) {
    const tags = (enrichment?.categoryTags as string[]) || [];
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const hasTopics = Object.keys(tagCounts).length > 0;
  let topics: { tag: string; count: number }[];
  if (hasTopics) {
    topics = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  } else {
    const sourceCounts: Record<string, number> = {};
    for (const { source } of results) {
      const name = source?.name || "Unknown";
      sourceCounts[name] = (sourceCounts[name] || 0) + 1;
    }
    topics = Object.entries(sourceCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  return (
    <div>
      <PageHeader
        title="Research"
        description="Cutting-edge research, technical deep-dives, and R&D intelligence"
      />

      {results.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TopicBreakdown
                topics={topics}
                total={results.length}
                label="research"
                title={hasTopics ? "Topic Breakdown" : "Sources"}
              />
            </div>
            <div className="lg:col-span-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="info">Key Papers</Badge>
                  <span className="text-xs text-text-muted">
                    {hasEnrichments ? "Highest relevance" : "Most recent"}
                  </span>
                </div>
                <div className="space-y-3">
                  {topPapers.map(({ article, enrichment, source }) => (
                    <ResearchCard
                      key={article.id}
                      article={article}
                      enrichment={enrichment}
                      sourceName={source?.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              All Research ({results.length})
            </h3>
            <div className="space-y-3">
              {remaining.map(({ article, enrichment, source }) => (
                <ResearchCard
                  key={article.id}
                  article={article}
                  enrichment={enrichment}
                  sourceName={source?.name}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FlaskConical}
          title="No research intel yet"
          description="Research papers and technical deep-dives from arXiv, Google Research, DeepMind, and more will appear here. Run the fetch pipeline to populate."
        />
      )}
    </div>
  );
}
