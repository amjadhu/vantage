import { Card } from "@/components/ui/Card";

export interface ImpactTimelineDay {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Feb 14"
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  total: number;
}

interface ImpactTimelineProps {
  days: ImpactTimelineDay[];
}

const impactConfig = [
  { key: "critical" as const, label: "Critical", color: "bg-critical" },
  { key: "high" as const, label: "High", color: "bg-high" },
  { key: "medium" as const, label: "Medium", color: "bg-medium" },
  { key: "low" as const, label: "Low", color: "bg-low" },
  { key: "informational" as const, label: "Info", color: "bg-info" },
];

export function ImpactTimeline({ days }: ImpactTimelineProps) {
  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Impact Timeline
      </h3>
      <p className="text-xs text-text-muted mb-4">
        14-day severity breakdown — is the landscape escalating?
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {impactConfig.map((level) => (
          <div key={level.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${level.color} opacity-80`} />
            <span className="text-[10px] text-text-muted">{level.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {days.map((day) => (
          <div key={day.date} className="flex items-center gap-3">
            <span className="text-[10px] text-text-muted w-14 shrink-0">
              {day.label}
            </span>
            <div className="flex-1 flex h-4 rounded overflow-hidden bg-border">
              {impactConfig.map((level) => {
                const pct = day.total > 0 ? (day[level.key] / maxTotal) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={level.key}
                    className={`${level.color} opacity-80 transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${level.label}: ${day[level.key]}`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-text-muted w-6 text-right shrink-0">
              {day.total}
            </span>
          </div>
        ))}
        {days.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">
            No impact data available
          </p>
        )}
      </div>
    </Card>
  );
}
