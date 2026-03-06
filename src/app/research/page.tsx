import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TopicBreakdown } from "@/components/technology/TopicBreakdown";
import { ResearchCard } from "@/components/research/ResearchCard";
import { BriefingNav } from "@/components/briefing/BriefingNav";
import { getLatestResearchBriefing, getResearchBriefings } from "@/lib/db/queries";
import { ensureMigrations } from "@/lib/db/client";
import { db, schema } from "@/lib/db/client";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  await ensureMigrations();

  // Fetch briefing data and feed data in parallel
  const [briefing, allBriefings, pool] = await Promise.all([
    getLatestResearchBriefing(),
    getResearchBriefings(10),
    db
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
      .limit(200),
  ]);

  // Group by source name, preserving recency order within each group
  const bySource = new Map<string, typeof pool>();
  for (const row of pool) {
    const name = row.source?.name || "Unknown";
    if (!bySource.has(name)) bySource.set(name, []);
    bySource.get(name)!.push(row);
  }

  // Round-robin pick: every source gets representation before any gets a second slot
  const results: typeof pool = [];
  const iterators = [...bySource.values()].map((rows) => ({ rows, idx: 0 }));
  while (results.length < 60 && iterators.some((it) => it.idx < it.rows.length)) {
    for (const it of iterators) {
      if (it.idx < it.rows.length && results.length < 60) {
        results.push(it.rows[it.idx++]);
      }
    }
  }

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
        description="Cross-domain R&D intelligence — AI, semiconductors, quantum, biotech, materials, energy, robotics, space, and more"
      />

      {/* Research Briefing */}
      {briefing ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-xs text-text-muted">
                  Generated{" "}
                  {new Date(briefing.generatedAt).toLocaleString("en-US", {
                    timeZone: "America/Los_Angeles",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZoneName: "short",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {(briefing.articleIds as string[] | null)?.length || 0} sources analyzed
                  </span>
                  <span className="text-xs text-text-muted">{briefing.modelUsed}</span>
                </div>
              </div>
              <Markdown content={briefing.markdownContent} />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <BriefingNav briefings={allBriefings} currentId={briefing.id} />
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <Card>
            <p className="text-sm text-text-muted">
              No research briefing yet. Run the fetch, enrich, and research-briefing pipelines from Settings to generate your first cross-domain R&D synthesis.
            </p>
          </Card>
        </div>
      )}

      {/* Research Feed */}
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
          description="Research papers and technical deep-dives from arXiv, Nature, IEEE, NASA, and more will appear here. Run the fetch pipeline to populate."
        />
      )}
    </div>
  );
}
