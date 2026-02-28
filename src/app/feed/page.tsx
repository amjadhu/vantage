import { Rss } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getArticlesWithEnrichments } from "@/lib/db/queries";
import { FeedClient } from "./feed-client";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = await getArticlesWithEnrichments({
    limit: 100,
    search: q || undefined,
  });

  return (
    <div>
      <PageHeader
        title={q ? `Search: "${q}"` : "Intel Feed"}
        description={
          q
            ? `${results.length} results found`
            : "All enriched articles from your intelligence sources"
        }
      />

      {results.length > 0 ? (
        <FeedClient items={results} />
      ) : (
        <EmptyState
          icon={Rss}
          title={q ? "No results found" : "No articles yet"}
          description={
            q
              ? `No articles matching "${q}". Try a different search term.`
              : "Trigger the fetch pipeline to pull articles from your configured sources."
          }
        />
      )}
    </div>
  );
}
