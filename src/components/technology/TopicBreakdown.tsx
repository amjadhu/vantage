import { Card } from "@/components/ui/Card";

interface TopicBreakdownProps {
  topics: { tag: string; count: number }[];
  total: number;
}

export function TopicBreakdown({ topics, total }: TopicBreakdownProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Topic Breakdown
      </h3>
      <div className="space-y-2.5">
        {topics.slice(0, 10).map((topic) => {
          const pct = total > 0 ? (topic.count / total) * 100 : 0;
          return (
            <div key={topic.tag}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary">{topic.tag}</span>
                <span className="text-xs text-text-muted">{topic.count}</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent/60 rounded-full transition-all"
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-center">
        <span className="text-xs text-text-muted">{total} tech articles analyzed</span>
      </div>
    </Card>
  );
}
