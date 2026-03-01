import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface TrendingTopic {
  topic: string;
  totalCount: number;
  trend: "rising" | "falling" | "stable";
  sparkline: number[]; // 7 values, one per day
}

const trendBadge: Record<string, { variant: "low" | "medium" | "critical"; label: string }> = {
  rising: { variant: "low", label: "Rising" },
  stable: { variant: "medium", label: "Stable" },
  falling: { variant: "critical", label: "Falling" },
};

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px h-4">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-accent/60"
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

export function TrendingTopics({ items }: { items: TrendingTopic[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-1">Trending Topics</h2>
        <p className="text-xs text-text-muted">No topic data available yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-3">Trending Topics</h2>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const { variant, label } = trendBadge[item.trend];
          return (
            <div key={item.topic} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-5 text-right shrink-0">{idx + 1}</span>
              <span className="text-sm text-text-primary truncate flex-1 min-w-0">{item.topic}</span>
              <Sparkline data={item.sparkline} />
              <span className="text-xs text-text-secondary w-6 text-right shrink-0">{item.totalCount}</span>
              <Badge variant={variant} className="w-16 justify-center shrink-0">{label}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
