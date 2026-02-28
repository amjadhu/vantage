import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnalysisForm } from "@/components/analysis/AnalysisForm";
import { getAnalyses } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const analyses = await getAnalyses();

  return (
    <div>
      <PageHeader
        title="Deep Analysis"
        description="AI-generated long-form analyses and competitive reports"
      />

      <AnalysisForm />

      {analyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyses.map((analysis) => (
            <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-2">
                  <Badge>{analysis.type}</Badge>
                  <span className="text-xs text-text-muted">
                    {new Date(analysis.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary mt-2">
                  {analysis.title}
                </h3>
                <p className="text-xs text-text-muted mt-2">
                  {analysis.modelUsed}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
