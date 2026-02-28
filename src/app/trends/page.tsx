import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrendCard } from "@/components/trends/TrendCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { db, schema } from "@/lib/db/client";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  // Extract trending topics from enriched article tags
  const tagResults = await db
    .select({
      tags: schema.enrichments.categoryTags,
    })
    .from(schema.enrichments)
    .orderBy(desc(schema.enrichments.enrichedAt))
    .limit(200);

  // Count tag frequency
  const tagCounts: Record<string, number> = {};
  for (const row of tagResults) {
    const tags = (row.tags as string[]) || [];
    for (const tag of tags) {
      const normalized = tag.toLowerCase().trim();
      if (normalized) {
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      }
    }
  }

  const sortedTopics = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([topic, count]) => ({
      topic,
      count,
      trend: (count > 5 ? "rising" : count > 2 ? "stable" : "falling") as "rising" | "falling" | "stable",
    }));

  // Get stored trend data for sparklines
  const trendData = await db
    .select()
    .from(schema.trends)
    .orderBy(desc(schema.trends.date))
    .limit(100);

  // Build sparkline data
  const sparklines: Record<string, number[]> = {};
  for (const t of trendData) {
    if (!sparklines[t.topic]) sparklines[t.topic] = [];
    sparklines[t.topic].push(t.mentionCount);
  }

  return (
    <div>
      <PageHeader
        title="Trends"
        description="Topic frequency analysis and emerging patterns"
      />

      {sortedTopics.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Top Topics ({sortedTopics.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sortedTopics.map((topic) => (
                <TrendCard
                  key={topic.topic}
                  topic={topic.topic}
                  count={topic.count}
                  trend={topic.trend}
                  sparkline={sparklines[topic.topic]?.slice(0, 7).reverse()}
                />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Topic Distribution
            </h3>
            <div className="space-y-2">
              {sortedTopics.slice(0, 10).map((topic) => {
                const max = sortedTopics[0]?.count || 1;
                const width = (topic.count / max) * 100;
                return (
                  <div key={topic.topic} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-32 truncate">
                      {topic.topic}
                    </span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-muted w-8 text-right">
                      {topic.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="No trends yet"
          description="Run the enrichment pipeline to generate topic tags. Trends will appear once articles have been analyzed."
        />
      )}
    </div>
  );
}
