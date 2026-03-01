import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface TopicVelocityItem {
  topic: string;
  recentCount: number;
  priorCount: number;
  velocity: number;
}

interface TopicVelocityProps {
  items: TopicVelocityItem[];
}

export function TopicVelocity({ items }: TopicVelocityProps) {
  const maxRecent = Math.max(...items.map((i) => i.recentCount), 1);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Topic Velocity
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Growth rate: last 3 days vs prior 7 days
      </p>
      <div className="space-y-3">
        {items.map((item) => {
          const momentum = item.velocity >= 2 ? "accelerating" : item.velocity >= 0.8 ? "steady" : "decelerating";
          const barColor =
            momentum === "accelerating"
              ? "bg-positive"
              : momentum === "steady"
                ? "bg-medium"
                : "bg-negative";
          const badgeVariant =
            momentum === "accelerating"
              ? "info"
              : momentum === "steady"
                ? "medium"
                : "critical";
          const barWidth = (item.recentCount / maxRecent) * 100;

          return (
            <div key={item.topic} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-primary truncate flex-1">
                  {item.topic}
                </span>
                <span className="text-[10px] text-text-muted shrink-0">
                  {item.recentCount} recent
                </span>
                <Badge variant={badgeVariant} className="shrink-0">
                  {item.velocity.toFixed(1)}x
                </Badge>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all`}
                  style={{ width: `${Math.max(barWidth, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">
            Not enough data for velocity analysis
          </p>
        )}
      </div>
    </Card>
  );
}
