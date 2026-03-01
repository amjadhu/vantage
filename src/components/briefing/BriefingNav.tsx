import { Card } from "@/components/ui/Card";

interface BriefingNavProps {
  briefings: Array<{
    id: string;
    generatedAt: string;
    modelUsed: string;
  }>;
  currentId: string;
}

function formatPT(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function BriefingNav({ briefings, currentId }: BriefingNavProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Briefing History
      </h3>
      <div className="space-y-1.5">
        {briefings.map((b) => (
          <div
            key={b.id}
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
              b.id === currentId
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {formatPT(b.generatedAt)}
          </div>
        ))}
        {briefings.length === 0 && (
          <p className="text-xs text-text-muted">No previous briefings</p>
        )}
      </div>
    </Card>
  );
}
