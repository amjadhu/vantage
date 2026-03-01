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

// Stacking order bottom→top: informational, low, medium, high, critical
const severityStack = [
  { key: "informational" as const, label: "Info", colorClass: "bg-info" },
  { key: "low" as const, label: "Low", colorClass: "bg-low" },
  { key: "medium" as const, label: "Medium", colorClass: "bg-medium" },
  { key: "high" as const, label: "High", colorClass: "bg-high" },
  { key: "critical" as const, label: "Critical", colorClass: "bg-critical" },
];

export function ImpactTimeline({ days }: ImpactTimelineProps) {
  const maxTotal = Math.max(...days.map((d) => d.total), 1);
  // If any day has >20 articles, 1 block = 2 articles
  const scale = maxTotal > 20 ? 2 : 1;

  // Parse today's date for highlighting
  const today = new Date().toISOString().slice(0, 10);

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
        {[...severityStack].reverse().map((level) => (
          <div key={level.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-[2px] ${level.colorClass} opacity-80`} />
            <span className="text-[10px] text-text-muted">{level.label}</span>
          </div>
        ))}
        {scale > 1 && (
          <span className="text-[10px] text-text-muted ml-auto opacity-60">
            1 block = {scale} articles
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="flex gap-1">
        {days.map((day) => {
          // Build blocks bottom→top: informational, low, medium, high, critical
          const blocks: { key: string; colorClass: string }[] = [];
          for (const level of severityStack) {
            const count = Math.ceil(day[level.key] / scale);
            for (let i = 0; i < count; i++) {
              blocks.push({
                key: `${level.key}-${i}`,
                colorClass: level.colorClass,
              });
            }
          }

          const isToday = day.date === today;
          // Extract day number and detect month boundary
          const dayNum = day.label.replace(/^\w+\s/, "");
          const showMonth = day.label;

          return (
            <div key={day.date} className="flex-1 group">
              {/* Hover count */}
              <div className="text-[9px] text-text-muted text-center h-4 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                {day.total}
              </div>

              {/* Column of blocks */}
              <div className="flex flex-col-reverse gap-px items-end min-h-[2rem]">
                {blocks.map((block) => (
                  <div
                    key={block.key}
                    className={`w-full aspect-square rounded-[2px] ${block.colorClass} opacity-70 group-hover:opacity-100 transition-opacity`}
                  />
                ))}
              </div>

              {/* Today marker */}
              {isToday && (
                <div className="border-b-2 border-accent mt-0.5" />
              )}

              {/* Date label */}
              <div className="text-[9px] text-text-muted text-center mt-1 font-mono leading-tight truncate">
                {dayNum === day.label ? dayNum : (
                  <>
                    <span className="block">{dayNum}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-1 mt-0.5">
        {days.map((day, idx) => {
          const month = day.label.split(" ")[0];
          const prevMonth = idx > 0 ? days[idx - 1].label.split(" ")[0] : "";
          const showMonthLabel = idx === 0 || month !== prevMonth;
          return (
            <div key={day.date} className="flex-1 text-[8px] text-text-muted font-mono text-center">
              {showMonthLabel ? month : ""}
            </div>
          );
        })}
      </div>

      {days.length === 0 && (
        <p className="text-xs text-text-muted text-center py-4">
          No impact data available
        </p>
      )}
    </Card>
  );
}
