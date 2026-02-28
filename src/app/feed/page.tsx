import { Rss } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getArticlesWithEnrichments } from "@/lib/db/queries";
import { FeedClient } from "./feed-client";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const results = await getArticlesWithEnrichments({ limit: 100 });

  return (
    <div>
      <PageHeader
        title="Intel Feed"
        description="All enriched articles from your intelligence sources"
      />

      {results.length > 0 ? (
        <FeedClient items={results} />
      ) : (
        <EmptyState
          icon={Rss}
          title="No articles yet"
          description="Trigger the fetch pipeline to pull articles from your configured sources. Visit /api/cron/fetch to run it manually."
        />
      )}
    </div>
  );
}
