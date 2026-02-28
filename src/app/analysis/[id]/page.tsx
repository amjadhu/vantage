import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Markdown } from "@/components/ui/Markdown";
import { getAnalysisById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = await getAnalysisById(id);
  if (!analysis) notFound();

  return (
    <div>
      <PageHeader title={analysis.title} />

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Badge>{analysis.type}</Badge>
          <span className="text-xs text-text-muted">
            Generated {new Date(analysis.generatedAt).toLocaleString()}
          </span>
          <span className="text-xs text-text-muted">{analysis.modelUsed}</span>
        </div>
        <Markdown content={analysis.markdownContent} />
      </Card>
    </div>
  );
}
