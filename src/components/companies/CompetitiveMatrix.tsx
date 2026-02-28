import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Company {
  id: string;
  ticker: string;
  name: string;
  slug: string;
  sector: string;
  description: string;
  isMain: boolean;
}

interface CompetitiveMatrixProps {
  companies: Company[];
  articleCounts: Record<string, number>;
}

export function CompetitiveMatrix({ companies, articleCounts }: CompetitiveMatrixProps) {
  const primary = companies.find((c) => c.isMain);
  const competitors = companies.filter((c) => !c.isMain);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Competitive Landscape
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-text-muted font-medium">Company</th>
              <th className="text-left py-2 pr-4 text-text-muted font-medium">Ticker</th>
              <th className="text-left py-2 pr-4 text-text-muted font-medium">Sector</th>
              <th className="text-right py-2 text-text-muted font-medium">Intel Count</th>
            </tr>
          </thead>
          <tbody>
            {primary && (
              <tr className="border-b border-border bg-accent/5">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium">{primary.name}</span>
                    <Badge variant="info">Primary</Badge>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-text-secondary">{primary.ticker}</td>
                <td className="py-2.5 pr-4 text-text-secondary">{primary.sector}</td>
                <td className="py-2.5 text-right text-text-primary font-medium">
                  {articleCounts[primary.ticker] || 0}
                </td>
              </tr>
            )}
            {competitors.map((company) => (
              <tr key={company.id} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-4 text-text-primary">{company.name}</td>
                <td className="py-2.5 pr-4 text-text-secondary">{company.ticker}</td>
                <td className="py-2.5 pr-4 text-text-secondary">{company.sector}</td>
                <td className="py-2.5 text-right text-text-primary font-medium">
                  {articleCounts[company.ticker] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
