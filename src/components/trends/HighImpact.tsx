import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";

export interface HighImpactItem {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  impactLevel: string;
  relevanceScore: number;
  executiveSummary: string;
}

export function HighImpact({ items }: { items: HighImpactItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-1">High Impact</h2>
        <p className="text-xs text-text-muted">No high-impact articles in the last 7 days.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-3">High Impact</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.url} className="border-b border-border last:border-0 pb-3 last:pb-0">
            <div className="flex items-start gap-2">
              <Badge variant={item.impactLevel === "critical" ? "critical" : "high"} className="shrink-0 mt-0.5">
                {item.impactLevel}
              </Badge>
              <div className="min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-primary hover:text-accent transition-colors line-clamp-1"
                >
                  {item.title}
                </a>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-muted">{item.sourceName}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">
                    {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1">{item.executiveSummary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
