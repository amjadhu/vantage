import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface TrendCardProps {
  topic: string;
  count: number;
  trend: "rising" | "falling" | "stable";
  sparkline?: number[];
}

export function TrendCard({ topic, count, trend, sparkline }: TrendCardProps) {
  const TrendIcon = trend === "rising" ? TrendingUp : trend === "falling" ? TrendingDown : Minus;
  const trendColor = trend === "rising" ? "text-positive" : trend === "falling" ? "text-negative" : "text-text-muted";

  return (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{topic}</h3>
          <p className="text-xs text-text-muted mt-0.5">{count} mentions</p>
        </div>
        <div className="flex items-center gap-2">
          {sparkline && sparkline.length > 0 && (
            <div className="flex items-end gap-px h-6">
              {sparkline.map((val, i) => {
                const max = Math.max(...sparkline);
                const height = max > 0 ? (val / max) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="w-1 bg-accent/40 rounded-t"
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                );
              })}
            </div>
          )}
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
      </div>
    </Card>
  );
}
