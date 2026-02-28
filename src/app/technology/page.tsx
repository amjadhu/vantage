import { Cpu } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TopicBreakdown } from "@/components/technology/TopicBreakdown";
import { TechStoryCard } from "@/components/technology/TechStoryCard";
import { db, schema } from "@/lib/db/client";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TechnologyPage() {
  const results = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(eq(schema.sources.category, "tech"))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(60);

  // Extract top stories (enriched, sorted by relevance)
  const enriched = results
    .filter((r) => r.enrichment)
    .sort((a, b) => (b.enrichment?.relevanceScore || 0) - (a.enrichment?.relevanceScore || 0));

  const topStories = enriched.slice(0, 5);
  const remaining = results.filter((r) => !topStories.some((t) => t.article.id === r.article.id));

  // Build topic breakdown from category tags
  const tagCounts: Record<string, number> = {};
  for (const { enrichment } of results) {
    const tags = (enrichment?.categoryTags as string[]) || [];
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topics = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="Technology"
        description="R&D breakthroughs, industry news, emerging tech, and market insights"
      />

      {results.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TopicBreakdown topics={topics} total={results.length} />
            </div>
            <div className="lg:col-span-2">
              {topStories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="info">Top Stories</Badge>
                    <span className="text-xs text-text-muted">Highest relevance</span>
                  </div>
                  <div className="space-y-3">
                    {topStories.map(({ article, enrichment, source }) => (
                      <TechStoryCard
                        key={article.id}
                        article={article}
                        enrichment={enrichment}
                        sourceName={source?.name}
                      />
                    ))}
                  </div>
                </div>
              )}
              {topStories.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-text-muted">Run enrichment to surface top stories</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              All Tech Intelligence ({results.length})
            </h3>
            <div className="space-y-3">
              {remaining.map(({ article, enrichment, source }) => (
                <TechStoryCard
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
          icon={Cpu}
          title="No technology intel yet"
          description="Technology articles from your sources will appear here. Run the fetch pipeline to populate news from TechCrunch, Ars Technica, Hacker News, and more."
        />
      )}
    </div>
  );
}
