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

const sentimentOrder = [
  { key: "negative" as const, label: "Negative", colorClass: "bg-negative" },
  { key: "mixed" as const, label: "Mixed", colorClass: "bg-medium" },
  { key: "neutral" as const, label: "Neutral", colorClass: "bg-neutral opacity-70" },
  { key: "positive" as const, label: "Positive", colorClass: "bg-positive" },
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
        {sentimentOrder.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-[2px] ${s.colorClass}`} />
            <span className="text-[10px] text-text-muted">{s.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-text-muted ml-auto opacity-60">
          each square = 1 article
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          // Build array of dots ordered: negative → mixed → neutral → positive
          const dots: { key: string; colorClass: string }[] = [];
          for (const s of sentimentOrder) {
            const count = item[s.key];
            for (let i = 0; i < count; i++) {
              dots.push({ key: `${s.key}-${i}`, colorClass: s.colorClass });
            }
          }

          return (
            <div key={item.topic}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary truncate">
                  {item.topic}
                </span>
                <span className="text-[10px] text-text-muted ml-2 shrink-0">
                  {item.total}
                </span>
              </div>
              <div className="flex flex-wrap gap-[3px]">
                {dots.map((dot) => (
                  <div
                    key={dot.key}
                    className={`w-2.5 h-2.5 rounded-[2px] ${dot.colorClass} hover:scale-150 transition-transform`}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">
            No sentiment data available
          </p>
        )}
      </div>
    </Card>
  );
}
