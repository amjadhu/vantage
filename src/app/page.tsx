import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { getLatestBriefing, getBriefings } from "@/lib/db/queries";
import { BriefingNav } from "@/components/briefing/BriefingNav";

export const dynamic = "force-dynamic";

export default async function BriefingPage() {
  const [briefing, allBriefings] = await Promise.all([
    getLatestBriefing(),
    getBriefings(10),
  ]);

  return (
    <div>
      <PageHeader
        title="Daily Briefing"
        description="AI-generated daily tech intelligence summary"
      />

      {briefing ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-xs text-text-muted">
                  Generated {new Date(briefing.generatedAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {(briefing.articleIds as string[] | null)?.length || 0} sources analyzed
                  </span>
                  <span className="text-xs text-text-muted">{briefing.modelUsed}</span>
                </div>
              </div>
              <Markdown content={briefing.markdownContent} />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <BriefingNav briefings={allBriefings} currentId={briefing.id} />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No briefing yet"
          description="Your daily intelligence briefing will appear here. Run the fetch, enrich, and briefing pipelines to generate your first briefing."
        />
      )}
    </div>
  );
}
