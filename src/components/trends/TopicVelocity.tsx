import { Card } from "@/components/ui/Card";

export interface TopicVelocityItem {
  topic: string;
  recentCount: number;
  priorCount: number;
  velocity: number;
}

interface TopicVelocityProps {
  items: TopicVelocityItem[];
}

function getMomentum(velocity: number) {
  if (velocity >= 2) return { label: "accelerating", color: "var(--color-positive)", textClass: "text-positive" };
  if (velocity >= 0.8) return { label: "steady", color: "var(--color-medium)", textClass: "text-medium" };
  return { label: "decelerating", color: "var(--color-negative)", textClass: "text-negative" };
}

export function TopicVelocity({ items }: TopicVelocityProps) {
  const maxRecent = Math.max(...items.map((i) => i.recentCount), 1);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-text-primary">
          Topic Velocity
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Growth rate: last 3 days vs prior 7 days
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[4rem_1fr_5rem] px-4 pb-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">
        <span>Rate</span>
        <span>Topic</span>
        <span className="text-right">Recent / Prior</span>
      </div>

      <div className="divide-y divide-border border-t border-border">
        {items.map((item, idx) => {
          const momentum = getMomentum(item.velocity);
          const trailWidth = (item.recentCount / maxRecent) * 100;
          const isHero = idx === 0;

          return (
            <div
              key={item.topic}
              className={`relative grid grid-cols-[4rem_1fr_5rem] items-center hover:bg-surface-hover transition-colors ${
                isHero ? "py-3 px-4 border-t-2 border-t-accent" : "py-2 px-4"
              }`}
            >
              {/* Gradient trail behind topic */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${momentum.color}, transparent)`,
                  opacity: 0.07,
                  width: `${Math.max(trailWidth, 8)}%`,
                  marginLeft: "4rem",
                }}
              />

              {/* Velocity number */}
              <span
                className={`font-mono font-bold ${momentum.textClass} ${
                  isHero ? "text-2xl" : "text-lg"
                }`}
              >
                {item.velocity.toFixed(1)}x
              </span>

              {/* Topic name */}
              <span
                className={`relative truncate ${
                  isHero
                    ? "text-sm font-semibold text-text-primary"
                    : "text-xs text-text-secondary"
                }`}
              >
                {item.topic}
              </span>

              {/* Counts */}
              <span className="text-right font-mono text-[11px] text-text-muted">
                {item.recentCount}
                <span className="opacity-50"> / </span>
                {item.priorCount}
              </span>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-text-muted text-center py-8">
          Not enough data for velocity analysis
        </p>
      )}
    </Card>
  );
}
