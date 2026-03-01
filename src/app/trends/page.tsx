import { TrendingUp } from "lucide-react";
import { subDays, format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopicVelocity, type TopicVelocityItem } from "@/components/trends/TopicVelocity";
import { SentimentHeatmap, type SentimentHeatmapItem } from "@/components/trends/SentimentHeatmap";
import { ImpactTimeline, type ImpactTimelineDay } from "@/components/trends/ImpactTimeline";
import { EmergingTopics, type EmergingTopicsData } from "@/components/trends/EmergingTopics";
import { db, schema } from "@/lib/db/client";
import { eq, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const now = new Date();
  const threeDaysAgo = subDays(now, 3).toISOString();
  const tenDaysAgo = subDays(now, 10).toISOString();
  const fourteenDaysAgo = subDays(now, 14).toISOString();

  // Fetch enrichments joined with articles for the last 14 days
  const rows = await db
    .select({
      categoryTags: schema.enrichments.categoryTags,
      sentiment: schema.enrichments.sentiment,
      impactLevel: schema.enrichments.impactLevel,
      publishedAt: schema.articles.publishedAt,
    })
    .from(schema.enrichments)
    .innerJoin(
      schema.articles,
      eq(schema.enrichments.articleId, schema.articles.id)
    )
    .where(gte(schema.articles.publishedAt, fourteenDaysAgo));

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader
          title="Trends"
          description="Topic velocity, sentiment patterns, and emerging signals"
        />
        <EmptyState
          icon={TrendingUp}
          title="No trends yet"
          description="Run the enrichment pipeline to generate topic tags. Trends will appear once articles have been analyzed."
        />
      </div>
    );
  }

  // ── 1. Topic Velocity ──────────────────────────────────────────────
  const recentCounts: Record<string, number> = {};
  const priorCounts: Record<string, number> = {};

  for (const row of rows) {
    const tags = (row.categoryTags as string[]) || [];
    const isRecent = row.publishedAt >= threeDaysAgo;
    for (const tag of tags) {
      const t = tag.toLowerCase().trim();
      if (!t) continue;
      if (isRecent) {
        recentCounts[t] = (recentCounts[t] || 0) + 1;
      } else {
        priorCounts[t] = (priorCounts[t] || 0) + 1;
      }
    }
  }

  const allTopics = new Set([...Object.keys(recentCounts), ...Object.keys(priorCounts)]);
  const velocityItems: TopicVelocityItem[] = [];
  for (const topic of allTopics) {
    const recent = recentCounts[topic] || 0;
    const prior = priorCounts[topic] || 0;
    if (recent === 0 && prior === 0) continue;
    velocityItems.push({
      topic,
      recentCount: recent,
      priorCount: prior,
      velocity: recent / Math.max(prior, 1),
    });
  }
  // Sort by velocity desc, then by recent count desc
  velocityItems.sort((a, b) => b.velocity - a.velocity || b.recentCount - a.recentCount);
  const topVelocity = velocityItems.filter((i) => i.recentCount > 0).slice(0, 15);

  // ── 2. Sentiment Heatmap ───────────────────────────────────────────
  const topicSentiment: Record<string, Record<string, number>> = {};
  const topicTotals: Record<string, number> = {};

  for (const row of rows) {
    const tags = (row.categoryTags as string[]) || [];
    const sentiment = row.sentiment || "neutral";
    for (const tag of tags) {
      const t = tag.toLowerCase().trim();
      if (!t) continue;
      if (!topicSentiment[t]) topicSentiment[t] = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
      topicSentiment[t][sentiment] = (topicSentiment[t][sentiment] || 0) + 1;
      topicTotals[t] = (topicTotals[t] || 0) + 1;
    }
  }

  const sentimentItems: SentimentHeatmapItem[] = Object.entries(topicSentiment)
    .map(([topic, counts]) => ({
      topic,
      positive: counts.positive || 0,
      negative: counts.negative || 0,
      neutral: counts.neutral || 0,
      mixed: counts.mixed || 0,
      total: topicTotals[topic] || 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  // ── 3. Impact Timeline ─────────────────────────────────────────────
  const dailyImpact: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    const date = row.publishedAt.slice(0, 10); // YYYY-MM-DD
    const impact = row.impactLevel || "informational";
    if (!dailyImpact[date]) dailyImpact[date] = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
    dailyImpact[date][impact] = (dailyImpact[date][impact] || 0) + 1;
  }

  // Build sorted 14-day array (fill missing days with zeros)
  const timelineDays: ImpactTimelineDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const label = format(d, "MMM d");
    const counts = dailyImpact[dateStr] || { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
    timelineDays.push({
      date: dateStr,
      label,
      critical: counts.critical || 0,
      high: counts.high || 0,
      medium: counts.medium || 0,
      low: counts.low || 0,
      informational: counts.informational || 0,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    });
  }

  // ── 4. Emerging vs Established vs Fading ───────────────────────────
  const emergingData: EmergingTopicsData = {
    emerging: [],
    established: [],
    fading: [],
  };

  for (const topic of allTopics) {
    const recent = recentCounts[topic] || 0;
    const prior = priorCounts[topic] || 0;
    const total = recent + prior;

    if (recent > 0 && prior === 0) {
      // Emerging: appeared in last 3 days, NOT in prior 7
      emergingData.emerging.push({ topic, count: recent });
    } else if (recent > 0 && prior > 0 && total >= 5) {
      // Established: present in both, 5+ total
      emergingData.established.push({ topic, count: total });
    } else if (recent === 0 && prior >= 3) {
      // Fading: only in prior window, 3+ mentions
      emergingData.fading.push({ topic, count: prior });
    }
  }

  emergingData.emerging.sort((a, b) => b.count - a.count);
  emergingData.established.sort((a, b) => b.count - a.count);
  emergingData.fading.sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="Trends"
        description="Topic velocity, sentiment patterns, and emerging signals"
      />

      <div className="space-y-6">
        {/* Row 1: Velocity + Emerging side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopicVelocity items={topVelocity} />
          <EmergingTopics data={emergingData} />
        </div>

        {/* Row 2: Sentiment Heatmap full width */}
        <SentimentHeatmap items={sentimentItems} />

        {/* Row 3: Impact Timeline full width */}
        <ImpactTimeline days={timelineDays} />
      </div>
    </div>
  );
}
