import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface EmergingSignalsData {
  newTopics: { topic: string; count: number }[];
  trendingEntities: { name: string; type: string; count: number }[];
}

const entityTypeVariant: Record<string, "info" | "high" | "low" | "medium" | "default"> = {
  Company: "info",
  Person: "high",
  Technology: "low",
  Organization: "medium",
};

export function EmergingSignals({ data }: { data: EmergingSignalsData }) {
  const hasTopics = data.newTopics.length > 0;
  const hasEntities = data.trendingEntities.length > 0;

  if (!hasTopics && !hasEntities) {
    return (
      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-1">Emerging Signals</h2>
        <p className="text-xs text-text-muted">No new signals detected recently.</p>
      </Card>
    );
  }

  // Group entities by type
  const entityGroups: Record<string, { name: string; count: number }[]> = {};
  for (const entity of data.trendingEntities) {
    if (!entityGroups[entity.type]) entityGroups[entity.type] = [];
    entityGroups[entity.type].push({ name: entity.name, count: entity.count });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Emerging Signals</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Topics */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2">New Topics</h3>
          {hasTopics ? (
            <div className="flex flex-wrap gap-2">
              {data.newTopics.map((t) => (
                <span
                  key={t.topic}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                >
                  {t.topic}
                  <span className="text-accent/60">{t.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No new topics in the last 3 days.</p>
          )}
        </div>

        {/* Trending Entities */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2">Trending Entities</h3>
          {hasEntities ? (
            <div className="space-y-3">
              {Object.entries(entityGroups).map(([type, entities]) => (
                <div key={type}>
                  <span className="text-xs text-text-muted">{type}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {entities.map((e) => (
                      <Badge key={e.name} variant={entityTypeVariant[type] || "default"}>
                        {e.name} · {e.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No trending entities detected.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
