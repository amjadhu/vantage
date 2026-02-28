import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ThreatHeatmap } from "@/components/cyber/ThreatHeatmap";
import { AdvisoryCard } from "@/components/cyber/AdvisoryCard";
import { Badge } from "@/components/ui/Badge";
import { db, schema } from "@/lib/db/client";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CyberPage() {
  const results = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .innerJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .where(eq(schema.sources.category, "cyber"))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(50);

  // Count by severity
  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  for (const { enrichment } of results) {
    const level = enrichment?.impactLevel as keyof typeof counts;
    if (level && level in counts) {
      counts[level]++;
    } else {
      counts.informational++;
    }
  }

  // Separate critical/high alerts from the rest
  const alerts = results.filter(
    (r) => r.enrichment?.impactLevel === "critical" || r.enrichment?.impactLevel === "high"
  );
  const others = results.filter(
    (r) => r.enrichment?.impactLevel !== "critical" && r.enrichment?.impactLevel !== "high"
  );

  return (
    <div>
      <PageHeader
        title="Cybersecurity"
        description="Breaches, CVEs, CISA advisories, and threat intelligence"
      />

      {results.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ThreatHeatmap counts={counts} />
            </div>
            <div className="lg:col-span-2">
              {alerts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="critical">Flash Alerts</Badge>
                    <span className="text-xs text-text-muted">{alerts.length} items</span>
                  </div>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map(({ article, enrichment }) => (
                      <AdvisoryCard
                        key={article.id}
                        article={article}
                        enrichment={enrichment}
                      />
                    ))}
                  </div>
                </div>
              )}
              {alerts.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-text-muted">No critical alerts at this time</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              All Cyber Intelligence ({results.length})
            </h3>
            <div className="space-y-3">
              {results.map(({ article, enrichment }) => (
                <AdvisoryCard
                  key={article.id}
                  article={article}
                  enrichment={enrichment}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Shield}
          title="No cybersecurity intel yet"
          description="Cybersecurity articles from your sources will appear here. Run the fetch pipeline to populate CISA advisories, CVE feeds, and threat intel."
        />
      )}
    </div>
  );
}
