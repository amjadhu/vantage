import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllSources, getArticleCount, getSourceStats } from "@/lib/db/queries";
import { getDailyUsageSummary } from "@/lib/pipeline/usage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [sources, articleCount, sourceStats, usage] = await Promise.all([
    getAllSources(),
    getArticleCount(),
    getSourceStats(),
    getDailyUsageSummary(),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Source management, cost monitoring, and system configuration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">System Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Articles</span>
              <span className="text-text-primary font-medium">{articleCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Active Sources</span>
              <span className="text-text-primary font-medium">
                {sources.filter((s) => s.enabled).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Sources</span>
              <span className="text-text-primary font-medium">{sources.length}</span>
            </div>
          </div>

          {sourceStats.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-text-muted font-medium mb-2">Articles by Source</p>
              <div className="space-y-1.5">
                {sourceStats
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .map((stat) => (
                    <div key={stat.sourceId} className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary truncate">
                        {stat.sourceName || stat.sourceId}
                      </span>
                      <span className="text-text-primary font-medium">{stat.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Pipeline Endpoints */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Pipeline Endpoints</h3>
          <div className="space-y-2">
            {[
              { name: "Fetch Articles", path: "/api/cron/fetch", desc: "Fetch from all sources" },
              { name: "Enrich Articles", path: "/api/cron/enrich", desc: "AI enrichment pipeline" },
              { name: "Find Connections", path: "/api/cron/connect", desc: "Cross-article connections" },
              { name: "Generate Briefing", path: "/api/cron/briefing", desc: "Daily tech briefing" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <p className="text-xs text-text-primary font-medium">{ep.name}</p>
                  <p className="text-xs text-text-muted">{ep.desc}</p>
                </div>
                <code className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                  {ep.path}
                </code>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Usage / Cost Control */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Daily Usage — {new Date().toISOString().split("T")[0]}
          </h3>
          <p className="text-xs text-text-muted mb-3">
            Each pipeline runs once automatically via cron. You can manually refresh up to 2 additional times per day.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-text-muted font-medium">Pipeline</th>
                  <th className="text-center py-2 px-4 text-text-muted font-medium">Cron Runs</th>
                  <th className="text-center py-2 px-4 text-text-muted font-medium">Manual Refreshes</th>
                  <th className="text-right py-2 text-text-muted font-medium">Tokens Used</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(usage).map(([pipeline, data]) => (
                  <tr key={pipeline} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-text-primary font-medium capitalize">{pipeline}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={data.cronUsed >= data.cronLimit ? "text-critical" : "text-text-secondary"}>
                        {data.cronUsed}/{data.cronLimit}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={data.manualUsed >= data.manualLimit ? "text-critical" : "text-text-secondary"}>
                        {data.manualUsed}/{data.manualLimit}
                      </span>
                    </td>
                    <td className="py-2 text-right text-text-secondary">
                      {data.totalTokens > 0 ? data.totalTokens.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sources */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Configured Sources ({sources.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${source.enabled ? "bg-positive" : "bg-text-muted"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary font-medium">{source.name}</p>
                    <p className="text-xs text-text-muted truncate">{source.url}</p>
                    {source.lastFetchedAt && (
                      <p className="text-xs text-text-muted">
                        Last fetched: {new Date(source.lastFetchedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge>{source.category}</Badge>
                  <Badge>{source.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
