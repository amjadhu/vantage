import { Card } from "@/components/ui/Card";

export interface EmergingTopicsData {
  emerging: { topic: string; count: number }[];
  established: { topic: string; count: number }[];
  fading: { topic: string; count: number }[];
}

interface EmergingTopicsProps {
  data: EmergingTopicsData;
}

export function EmergingTopics({ data }: EmergingTopicsProps) {
  const maxEmergingCount = Math.max(...data.emerging.map((t) => t.count), 1);

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Emerging vs Established
        </h3>
        <p className="text-xs text-text-muted mt-1">
          New signals, stable themes, and declining topics
        </p>
      </div>

      {/* Emerging zone */}
      <div
        className="px-4 py-3"
        style={{
          background: "linear-gradient(180deg, var(--color-accent, #3b82f6) 0%, transparent 100%)",
          backgroundSize: "100% 100%",
          opacity: 1,
        }}
      >
        <div
          className="px-4 py-3 -mx-4 -my-3"
          style={{
            background: "linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)",
          }}
        >
          <SectionLabel label="emerging" />
          {data.emerging.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.emerging.map((t) => {
                // Higher-count chips rendered larger
                const sizeRatio = t.count / maxEmergingCount;
                const fontSize = sizeRatio > 0.7 ? "text-sm" : "text-xs";
                const padding = sizeRatio > 0.7 ? "px-3 py-1.5" : "px-2 py-1";
                return (
                  <span
                    key={t.topic}
                    className={`inline-flex items-center gap-1.5 ${padding} rounded-md ${fontSize} bg-accent/10 text-accent border border-accent/25`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    {t.topic}
                    <span className="text-[10px] opacity-60">{t.count}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted mt-2">No new topics</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Established zone */}
      <div className="px-4 py-3">
        <SectionLabel label="established" />
        {data.established.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.established.map((t) => (
              <span
                key={t.topic}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-surface-hover text-text-secondary border border-border"
              >
                {t.topic}
                <span className="text-[10px] opacity-60">{t.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-text-muted mt-2">No established topics yet</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Fading zone */}
      <div
        className="px-4 py-3"
        style={{
          background: "linear-gradient(0deg, rgba(128,128,128,0.04) 0%, transparent 100%)",
        }}
      >
        <SectionLabel label="fading" />
        {data.fading.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.fading.map((t) => (
              <span
                key={t.topic}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-text-muted border border-border/50"
              >
                {t.topic}
                <span className="text-[10px] opacity-40">{t.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-text-muted mt-2">No fading topics</p>
        )}
      </div>
    </Card>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted shrink-0">
        // {label}
      </span>
      <div className="h-px bg-border flex-1" />
    </div>
  );
}
