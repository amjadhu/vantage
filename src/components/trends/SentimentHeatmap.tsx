import { Card } from "@/components/ui/Card";

export interface SentimentHeatmapItem {
  topic: string;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
  total: number;
}

interface SentimentHeatmapProps {
  items: SentimentHeatmapItem[];
}

const sentimentConfig = [
  { key: "positive" as const, label: "Positive", color: "bg-positive" },
  { key: "neutral" as const, label: "Neutral", color: "bg-info" },
  { key: "mixed" as const, label: "Mixed", color: "bg-medium" },
  { key: "negative" as const, label: "Negative", color: "bg-negative" },
];

export function SentimentHeatmap({ items }: SentimentHeatmapProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Sentiment Heatmap
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Topic sentiment distribution across articles
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {sentimentConfig.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${s.color} opacity-80`} />
            <span className="text-[10px] text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.topic} className="flex items-center gap-3">
            <span className="text-xs text-text-secondary w-36 truncate shrink-0">
              {item.topic}
            </span>
            <div className="flex-1 h-5 flex rounded overflow-hidden">
              {sentimentConfig.map((s) => {
                const pct = item.total > 0 ? (item[s.key] / item.total) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={s.key}
                    className={`${s.color} opacity-80 transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${s.label}: ${item[s.key]} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-text-muted w-6 text-right shrink-0">
              {item.total}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">
            No sentiment data available
          </p>
        )}
      </div>
    </Card>
  );
}
