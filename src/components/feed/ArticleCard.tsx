import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    url: string;
    summary: string | null;
    author: string | null;
    publishedAt: string;
    categories: string[] | null;
  };
  enrichment?: {
    executiveSummary: string;
    relevanceScore: number;
    impactLevel: string;
    sentiment: string;
    categoryTags: string[] | null;
  } | null;
  sourceName?: string | null;
}

const impactVariant: Record<string, "critical" | "high" | "medium" | "low" | "info"> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
  informational: "info",
};

export function ArticleCard({ article, enrichment, sourceName }: ArticleCardProps) {
  const displaySummary = enrichment?.executiveSummary || article.summary || "";
  const tags = enrichment?.categoryTags || article.categories || [];

  return (
    <Card hover className="group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {sourceName && (
              <span className="text-xs font-medium text-accent">{sourceName}</span>
            )}
            <div className="flex items-center gap-1 text-text-muted">
              <Clock className="h-3 w-3" />
              <span className="text-xs">
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-start gap-1.5"
          >
            <h3 className="text-sm font-semibold text-text-primary group-hover/link:text-accent transition-colors line-clamp-2">
              {article.title}
            </h3>
            <ExternalLink className="h-3.5 w-3.5 text-text-muted flex-shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>

          {displaySummary && (
            <p className="mt-1.5 text-xs text-text-secondary line-clamp-2">
              {displaySummary}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {enrichment?.impactLevel && (
              <Badge variant={impactVariant[enrichment.impactLevel] || "default"}>
                {enrichment.impactLevel}
              </Badge>
            )}
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>

        {enrichment && (
          <div className="flex-shrink-0 w-24">
            <ScoreBar score={enrichment.relevanceScore} label="Relevance" />
          </div>
        )}
      </div>
    </Card>
  );
}
