import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";

interface AdvisoryCardProps {
  article: {
    id: string;
    title: string;
    url: string;
    content: string;
    publishedAt: string;
    categories: string[] | null;
  };
  enrichment?: {
    impactLevel: string;
    executiveSummary: string;
    relevanceScore: number;
  } | null;
}

const severityConfig: Record<string, { variant: "critical" | "high" | "medium" | "low" | "info"; icon: boolean }> = {
  critical: { variant: "critical", icon: true },
  high: { variant: "high", icon: true },
  medium: { variant: "medium", icon: false },
  low: { variant: "low", icon: false },
  informational: { variant: "info", icon: false },
};

export function AdvisoryCard({ article, enrichment }: AdvisoryCardProps) {
  const severity = enrichment?.impactLevel || "informational";
  const config = severityConfig[severity] || severityConfig.informational;
  const isCritical = severity === "critical" || severity === "high";

  return (
    <Card className={isCritical ? "border-critical/30" : ""}>
      <div className="flex items-start gap-3">
        {config.icon && (
          <AlertTriangle
            className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              severity === "critical" ? "text-critical" : "text-high"
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={config.variant}>{severity}</Badge>
            <span className="text-xs text-text-muted">
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
            </span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5"
          >
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {article.title}
            </h3>
            <ExternalLink className="h-3.5 w-3.5 text-text-muted flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
          </a>
          <p className="mt-1 text-xs text-text-secondary line-clamp-2">
            {enrichment?.executiveSummary || article.content.substring(0, 200)}
          </p>
        </div>
      </div>
    </Card>
  );
}
