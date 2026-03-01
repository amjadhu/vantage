import { TrendingUp } from "lucide-react";
import { subDays, format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingTopics, type TrendingTopic } from "@/components/trends/TrendingTopics";
import { HighImpact, type HighImpactItem } from "@/components/trends/HighImpact";
import { StoryThreads, type StoryThread } from "@/components/trends/StoryThreads";
import { EmergingSignals, type EmergingSignalsData } from "@/components/trends/EmergingSignals";
import { db, schema } from "@/lib/db/client";
import { eq, gte, desc, or, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const now = new Date();
  const threeDaysAgo = subDays(now, 3).toISOString();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const tenDaysAgo = subDays(now, 10).toISOString();

  // ── Fetch articles + enrichments + sources (last 7 days) ─────────
  const rows = await db
    .select({
      articleId: schema.articles.id,
      title: schema.articles.title,
      url: schema.articles.url,
      publishedAt: schema.articles.publishedAt,
      sourceName: schema.sources.name,
      categoryTags: schema.enrichments.categoryTags,
      entities: schema.enrichments.entities,
      impactLevel: schema.enrichments.impactLevel,
      relevanceScore: schema.enrichments.relevanceScore,
      executiveSummary: schema.enrichments.executiveSummary,
    })
    .from(schema.articles)
    .innerJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .where(gte(schema.articles.publishedAt, tenDaysAgo));

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          title="Trends"
          description="What's happening, what matters, and how stories connect"
        />
        <EmptyState
          icon={TrendingUp}
          title="No trends yet"
          description="Run the enrichment pipeline to generate topic tags. Trends will appear once articles have been analyzed."
        />
      </div>
    );
  }

  // ── Fetch article connections (last 7 days) ──────────────────────
  const connections = await db
    .select({
      sourceArticleId: schema.articleConnections.sourceArticleId,
      targetArticleId: schema.articleConnections.targetArticleId,
      relationshipType: schema.articleConnections.relationshipType,
      reasoning: schema.articleConnections.reasoning,
      confidence: schema.articleConnections.confidence,
    })
    .from(schema.articleConnections)
    .where(gte(schema.articleConnections.createdAt, sevenDaysAgo))
    .orderBy(desc(schema.articleConnections.confidence));

  // Build article lookup
  const articleMap = new Map(rows.map((r) => [r.articleId, r]));

  // ── 1. Trending Topics ──────────────────────────────────────────
  // Aggregate daily counts per topic over 7 days
  const topicDailyCounts: Record<string, Record<string, number>> = {};
  const topicTotals: Record<string, number> = {};

  for (const row of rows) {
    const tags = (row.categoryTags as string[]) || [];
    const dateStr = row.publishedAt.slice(0, 10);
    for (const tag of tags) {
      const t = tag.toLowerCase().trim();
      if (!t) continue;
      if (!topicDailyCounts[t]) topicDailyCounts[t] = {};
      topicDailyCounts[t][dateStr] = (topicDailyCounts[t][dateStr] || 0) + 1;
      topicTotals[t] = (topicTotals[t] || 0) + 1;
    }
  }

  // Build sparkline (7 days) and trend for each topic
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    last7Days.push(format(subDays(now, i), "yyyy-MM-dd"));
  }

  const trendingTopics: TrendingTopic[] = Object.entries(topicTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([topic, totalCount]) => {
      const daily = topicDailyCounts[topic] || {};
      const sparkline = last7Days.map((d) => daily[d] || 0);

      // Compare last 3 days vs prior 4 days
      const recent = sparkline.slice(4).reduce((a, b) => a + b, 0);
      const prior = sparkline.slice(0, 4).reduce((a, b) => a + b, 0);
      const ratio = recent / Math.max(prior, 1);
      const trend: "rising" | "falling" | "stable" =
        ratio >= 1.5 ? "rising" : ratio <= 0.5 ? "falling" : "stable";

      return { topic, totalCount, trend, sparkline };
    });

  // ── 2. High Impact ──────────────────────────────────────────────
  const sevenDaysAgoStr = sevenDaysAgo;
  const highImpactItems: HighImpactItem[] = rows
    .filter(
      (r) =>
        (r.impactLevel === "critical" || r.impactLevel === "high") &&
        r.publishedAt >= sevenDaysAgoStr
    )
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8)
    .map((r) => ({
      title: r.title,
      url: r.url,
      sourceName: r.sourceName,
      publishedAt: r.publishedAt,
      impactLevel: r.impactLevel,
      relevanceScore: r.relevanceScore,
      executiveSummary: r.executiveSummary,
    }));

  // ── 3. Story Threads ────────────────────────────────────────────
  // Build thread clusters from connections using union-find
  const parent: Record<string, string> = {};
  function find(x: string): string {
    if (!parent[x]) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a: string, b: string) {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  }

  for (const conn of connections) {
    if (articleMap.has(conn.sourceArticleId) && articleMap.has(conn.targetArticleId)) {
      union(conn.sourceArticleId, conn.targetArticleId);
    }
  }

  // Group articles by cluster
  const clusters: Record<string, Set<string>> = {};
  for (const conn of connections) {
    if (!articleMap.has(conn.sourceArticleId) || !articleMap.has(conn.targetArticleId)) continue;
    const root = find(conn.sourceArticleId);
    if (!clusters[root]) clusters[root] = new Set();
    clusters[root].add(conn.sourceArticleId);
    clusters[root].add(conn.targetArticleId);
  }

  // Build threads from clusters
  const storyThreads: StoryThread[] = Object.values(clusters)
    .filter((articleIds) => articleIds.size >= 2)
    .map((articleIds) => {
      const ids = Array.from(articleIds);
      const articles = ids
        .map((id) => {
          const a = articleMap.get(id);
          if (!a) return null;
          return {
            id,
            title: a.title,
            url: a.url,
            sourceName: a.sourceName,
            publishedAt: a.publishedAt,
          };
        })
        .filter(Boolean) as StoryThread["articles"];

      // Sort articles by publishedAt
      articles.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

      // Find connections between consecutive articles in the thread
      const threadConnections: StoryThread["connections"] = [];
      for (let i = 1; i < articles.length; i++) {
        const conn = connections.find(
          (c) =>
            (c.sourceArticleId === articles[i - 1].id && c.targetArticleId === articles[i].id) ||
            (c.sourceArticleId === articles[i].id && c.targetArticleId === articles[i - 1].id)
        );
        threadConnections.push(
          conn
            ? { relationshipType: conn.relationshipType, reasoning: conn.reasoning, confidence: conn.confidence }
            : { relationshipType: "related", reasoning: "", confidence: 0 }
        );
      }

      // Average confidence for sorting
      const avgConfidence =
        threadConnections.reduce((sum, c) => sum + c.confidence, 0) / Math.max(threadConnections.length, 1);

      return { articles: articles.slice(0, 3), connections: threadConnections, avgConfidence };
    })
    .sort((a, b) => (b as any).avgConfidence - (a as any).avgConfidence)
    .slice(0, 5)
    .map(({ articles, connections: conns }) => ({ articles, connections: conns }));

  // ── 4. Emerging Signals ─────────────────────────────────────────
  // New topics: appeared in last 3 days, not in prior 7
  const recentTopics: Record<string, number> = {};
  const priorTopics: Record<string, number> = {};

  for (const row of rows) {
    const tags = (row.categoryTags as string[]) || [];
    const isRecent = row.publishedAt >= threeDaysAgo;
    for (const tag of tags) {
      const t = tag.toLowerCase().trim();
      if (!t) continue;
      if (isRecent) {
        recentTopics[t] = (recentTopics[t] || 0) + 1;
      } else {
        priorTopics[t] = (priorTopics[t] || 0) + 1;
      }
    }
  }

  const newTopics = Object.entries(recentTopics)
    .filter(([topic]) => !priorTopics[topic])
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // Trending entities: aggregate from enrichments
  const entityCounts: Record<string, { name: string; type: string; count: number }> = {};
  for (const row of rows) {
    const entities = (row.entities as Array<{ name: string; type: string }>) || [];
    for (const entity of entities) {
      const key = `${entity.type}:${entity.name}`;
      if (!entityCounts[key]) {
        entityCounts[key] = { name: entity.name, type: entity.type, count: 0 };
      }
      entityCounts[key].count += 1;
    }
  }

  const trendingEntities = Object.values(entityCounts)
    .filter((e) => e.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const emergingSignals: EmergingSignalsData = { newTopics, trendingEntities };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Trends"
        description="What's happening, what matters, and how stories connect"
      />

      <div className="space-y-6">
        {/* Row 1: Trending Topics + High Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendingTopics items={trendingTopics} />
          <HighImpact items={highImpactItems} />
        </div>

        {/* Row 2: Story Threads */}
        <StoryThreads threads={storyThreads} />

        {/* Row 3: Emerging Signals */}
        <EmergingSignals data={emergingSignals} />
      </div>
    </div>
  );
}
