import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";

export interface StoryThread {
  articles: {
    id: string;
    title: string;
    url: string;
    sourceName: string;
    publishedAt: string;
  }[];
  connections: {
    relationshipType: string;
    reasoning: string;
    confidence: number;
  }[];
}

const relationshipVariant: Record<string, "info" | "low" | "high" | "critical"> = {
  "follow-up": "info",
  related: "low",
  contradicts: "critical",
  "caused-by": "high",
};

const relationshipLabel: Record<string, string> = {
  "follow-up": "Follow-up",
  related: "Related",
  contradicts: "Contradicts",
  "caused-by": "Caused by",
};

export function StoryThreads({ threads }: { threads: StoryThread[] }) {
  if (threads.length === 0) {
    return (
      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-1">Story Threads</h2>
        <p className="text-xs text-text-muted">
          No connected stories found yet. Connections will appear once the pipeline identifies related articles.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Story Threads</h2>
      <div className="space-y-4">
        {threads.map((thread, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3">
            {thread.articles.map((article, aIdx) => (
              <div key={article.id}>
                {/* Connection label between articles */}
                {aIdx > 0 && thread.connections[aIdx - 1] && (
                  <div className="flex items-center gap-2 my-2 pl-4">
                    <div className="w-px h-3 bg-border" />
                    <Badge
                      variant={relationshipVariant[thread.connections[aIdx - 1].relationshipType] || "default"}
                    >
                      {relationshipLabel[thread.connections[aIdx - 1].relationshipType] || thread.connections[aIdx - 1].relationshipType}
                    </Badge>
                    <span className="text-xs text-text-muted flex-1 min-w-0 truncate">
                      {thread.connections[aIdx - 1].reasoning}
                    </span>
                  </div>
                )}
                {/* Article */}
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text-primary hover:text-accent transition-colors line-clamp-1"
                    >
                      {article.title}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{article.sourceName}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
