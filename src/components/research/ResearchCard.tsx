import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { formatDistanceToNow } from "date-fns";

interface ResearchCardProps {
  article: {
    id: string;
    title: string;
    url: string;
    content: string;
    publishedAt: string;
  };
  enrichment?: {
    impactLevel: string;
    executiveSummary: string;
    relevanceScore: number;
    categoryTags: string[] | null;
    keyFacts: string[] | null;
    entities: Array<{ name: string; type: string }> | null;
  } | null;
  sourceName?: string;
}

const impactVariant: Record<string, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export function ResearchCard({ article, enrichment, sourceName }: ResearchCardProps) {
  const tags = (enrichment?.categoryTags as string[]) || [];
  const keyFacts = (enrichment?.keyFacts as string[]) || [];
  const entities = (enrichment?.entities as Array<{ name: string; type: string }>) || [];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {sourceName && (
              <span className="text-xs text-accent font-medium">{sourceName}</span>
            )}
            <span className="text-xs text-text-muted">
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
            </span>
            {enrichment?.impactLevel && (
              <Badge variant={impactVariant[enrichment.impactLevel] || "default"}>
                {enrichment.impactLevel}
              </Badge>
            )}
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
          <p className="mt-1.5 text-xs text-text-secondary">
            {enrichment?.executiveSummary || article.content.substring(0, 300)}
          </p>

          {keyFacts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {keyFacts.slice(0, 4).map((fact, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          )}

          {entities.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {entities.slice(0, 6).map((entity) => (
                <Badge key={entity.name} variant="info">
                  {entity.name}
                </Badge>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        {enrichment && (
          <div className="flex-shrink-0 w-16 text-right">
            <ScoreBar score={enrichment.relevanceScore} />
          </div>
        )}
      </div>
    </Card>
  );
}
