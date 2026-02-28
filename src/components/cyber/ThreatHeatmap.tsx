import { Card } from "@/components/ui/Card";

interface ThreatHeatmapProps {
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
}

export function ThreatHeatmap({ counts }: ThreatHeatmapProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const items = [
    { label: "Critical", count: counts.critical, color: "bg-critical", textColor: "text-critical" },
    { label: "High", count: counts.high, color: "bg-high", textColor: "text-high" },
    { label: "Medium", count: counts.medium, color: "bg-medium", textColor: "text-medium" },
    { label: "Low", count: counts.low, color: "bg-low", textColor: "text-low" },
    { label: "Info", count: counts.informational, color: "bg-info", textColor: "text-info" },
  ];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Threat Severity Distribution
      </h3>
      <div className="flex items-end gap-3 h-32 mb-3">
        {items.map((item) => {
          const height = total > 0 ? Math.max((item.count / total) * 100, 4) : 4;
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-xs font-bold ${item.textColor}`}>
                {item.count}
              </span>
              <div
                className={`w-full rounded-t ${item.color} opacity-80 transition-all`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex-1 text-center">
            <span className="text-[10px] text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-center">
        <span className="text-xs text-text-muted">{total} total cyber intel items</span>
      </div>
    </Card>
  );
}
