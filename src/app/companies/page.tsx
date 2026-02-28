import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompetitiveMatrix } from "@/components/companies/CompetitiveMatrix";
import { getWatchlistCompanies } from "@/lib/db/queries";
import { db, schema } from "@/lib/db/client";
import { like, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getWatchlistCompanies();

  // Count articles mentioning each company
  const articleCounts: Record<string, number> = {};
  for (const company of companies) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.articles)
      .where(like(schema.articles.title, `%${company.name}%`));
    articleCounts[company.ticker] = result[0]?.count || 0;
  }

  return (
    <div>
      <PageHeader
        title="Company Watch"
        description="CrowdStrike and competitive landscape intelligence"
      />

      {companies.length > 0 ? (
        <div className="space-y-6">
          <CompetitiveMatrix companies={companies} articleCounts={articleCounts} />

          <h3 className="text-sm font-semibold text-text-primary">Company Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <Link key={company.id} href={`/companies/${company.slug}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {company.name}
                      </h3>
                      <span className="text-xs text-text-muted">{company.ticker}</span>
                    </div>
                    {company.isMain && <Badge variant="info">Primary</Badge>}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {company.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge>{company.sector}</Badge>
                    <span className="text-xs text-text-muted">
                      {articleCounts[company.ticker] || 0} articles
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No companies tracked"
          description="Company watchlist will be populated when the database is seeded."
        />
      )}
    </div>
  );
}
