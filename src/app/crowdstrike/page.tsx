import { Crosshair } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { TopicBreakdown } from "@/components/technology/TopicBreakdown";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { db, schema } from "@/lib/db/client";
import { eq, desc, sql, or, like } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CrowdStrikePage() {
  // 1. Articles from crowdstrike category sources
  const categoryResults = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(eq(schema.sources.category, "crowdstrike"))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(60);

  // 2. Articles from ANY source mentioning CrowdStrike or CRWD in title
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
      or(
        like(schema.articles.title, "%CrowdStrike%"),
        like(schema.articles.title, "%crowdstrike%"),
        like(schema.articles.title, "%CRWD%"),
      )
    )
    .orderBy(desc(schema.articles.publishedAt))
    .limit(60);

  // Dedupe by article ID
  const seen = new Set<string>();
  const allResults: typeof categoryResults = [];
  for (const r of [...categoryResults, ...mentionResults]) {
    if (!seen.has(r.article.id)) {
      seen.add(r.article.id);
      allResults.push(r);
    }
  }

  // Sort by publishedAt desc, limit 60
  allResults.sort((a, b) =>
    new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime()
  );
  const results = allResults.slice(0, 60);

  // Top 5 for the featured section
  const topIntel = results.slice(0, 5);

  // Source breakdown
  const sourceCounts = new Map<string, number>();
  for (const { source } of results) {
    const name = source.name;
    sourceCounts.set(name, (sourceCounts.get(name) || 0) + 1);
  }
  const sourceTopics = Array.from(sourceCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // Topic/tag breakdown from enrichments
  const tagCounts = new Map<string, number>();
  for (const { enrichment } of results) {
    if (enrichment?.categoryTags) {
      for (const tag of enrichment.categoryTags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }
  const tagTopics = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="CrowdStrike"
        description="Aggregated intel — blog posts, financial analysis, market news, and cross-category mentions"
      />

      {results.length > 0 ? (
        <div className="space-y-6">
          {/* Row 1: Profile + Source Breakdown | Top Intel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              {/* Company Profile Card */}
              <Card>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Crosshair className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">CrowdStrike Holdings</h3>
                    <span className="text-xs text-text-muted">CRWD — Cybersecurity</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  Endpoint security and threat intelligence platform. Primary watchlist company.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info">Primary Watchlist</Badge>
                  <Badge>{results.length} articles</Badge>
                  <Badge>{sourceCounts.size} sources</Badge>
                </div>
              </Card>

              {/* Source Breakdown */}
              <TopicBreakdown
                topics={sourceTopics}
                total={results.length}
                label="CrowdStrike"
                title="Source Breakdown"
              />

              {/* Topic Breakdown (if tags exist) */}
              {tagTopics.length > 0 && (
                <TopicBreakdown
                  topics={tagTopics}
                  total={results.length}
                  label="CrowdStrike"
                  title="Topic Breakdown"
                />
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="high">Top Intel</Badge>
                <span className="text-xs text-text-muted">Most recent</span>
              </div>
              <div className="space-y-3">
                {topIntel.map(({ article, enrichment, source }) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    enrichment={enrichment}
                    sourceName={source.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Full list */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              All CrowdStrike Intel ({results.length})
            </h3>
            <div className="space-y-3">
              {results.map(({ article, enrichment, source }) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  enrichment={enrichment}
                  sourceName={source.name}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Crosshair}
          title="No CrowdStrike intel yet"
          description="CrowdStrike blog posts, financial analysis, and cross-category mentions will appear here. Run the fetch pipeline to populate data."
        />
      )}
    </div>
  );
}
