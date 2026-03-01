import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface EmergingTopicsData {
  emerging: { topic: string; count: number }[];
  established: { topic: string; count: number }[];
  fading: { topic: string; count: number }[];
}

interface EmergingTopicsProps {
  data: EmergingTopicsData;
}

export function EmergingTopics({ data }: EmergingTopicsProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Emerging vs Established
      </h3>
      <p className="text-xs text-text-muted mb-4">
        New signals, stable themes, and declining topics
      </p>

      <div className="space-y-5">
        {/* Emerging */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">New</Badge>
            <span className="text-[10px] text-text-muted">
              Last 3 days only
            </span>
          </div>
          {data.emerging.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.emerging.map((t) => (
                <span
                  key={t.topic}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-info/10 text-info border border-info/20"
                >
                  {t.topic}
                  <span className="text-[10px] opacity-70">{t.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted">No new topics</p>
          )}
        </div>

        {/* Established */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="medium">Stable</Badge>
            <span className="text-[10px] text-text-muted">
              Present in both windows, 5+ mentions
            </span>
          </div>
          {data.established.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.established.map((t) => (
                <span
                  key={t.topic}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-medium/10 text-medium border border-medium/20"
                >
                  {t.topic}
                  <span className="text-[10px] opacity-70">{t.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted">No established topics yet</p>
          )}
        </div>

        {/* Fading */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">Fading</Badge>
            <span className="text-[10px] text-text-muted">
              Prior 7 days only, 3+ mentions
            </span>
          </div>
          {data.fading.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.fading.map((t) => (
                <span
                  key={t.topic}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-border text-text-muted"
                >
                  {t.topic}
                  <span className="text-[10px] opacity-70">{t.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted">No fading topics</p>
          )}
        </div>
      </div>
    </Card>
  );
}
