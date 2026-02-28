import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAllSources, getDefaultPersona, getArticleCount, getSourceStats } from "@/lib/db/queries";
import type { PersonaConfig } from "@/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [sources, persona, articleCount, sourceStats] = await Promise.all([
    getAllSources(),
    getDefaultPersona(),
    getArticleCount(),
    getSourceStats(),
  ]);

  const config = persona?.config as PersonaConfig | null;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Persona configuration, source management, and system monitoring"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Persona */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Active Persona</h3>
          {persona && config ? (
            <div className="space-y-3">
              <p className="text-sm text-text-primary font-medium">{persona.name}</p>
              <p className="text-xs text-text-secondary">{persona.description}</p>
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs text-text-muted font-medium">Interest Areas</p>
                <div className="space-y-1">
                  {config.interestAreas.map((ia) => (
                    <div key={ia.topic} className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">{ia.topic}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${ia.weight * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-6">{ia.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-xs text-text-muted font-medium">Company Watchlist</p>
                <div className="flex flex-wrap gap-1.5">
                  {config.companyWatchlist.map((ticker) => (
                    <Badge key={ticker}>{ticker}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border">
                <span className="text-text-muted">Depth</span>
                <span className="text-text-primary">{config.depthLevel}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Relevance Threshold</span>
                <span className="text-text-primary">{config.relevanceThreshold}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No persona configured</p>
          )}
        </Card>

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
              { name: "Generate Briefing", path: "/api/cron/briefing", desc: "Daily executive briefing" },
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

        {/* Sources */}
        <Card>
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
