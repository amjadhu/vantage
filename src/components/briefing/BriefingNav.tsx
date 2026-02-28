import { Card } from "@/components/ui/Card";
import { format } from "date-fns";

interface BriefingNavProps {
  briefings: Array<{
    id: string;
    generatedAt: string;
    modelUsed: string;
  }>;
  currentId: string;
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
            {format(new Date(b.generatedAt), "MMM d, yyyy h:mm a")}
          </div>
        ))}
        {briefings.length === 0 && (
          <p className="text-xs text-text-muted">No previous briefings</p>
        )}
      </div>
    </Card>
  );
}
