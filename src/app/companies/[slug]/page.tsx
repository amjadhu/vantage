import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { getCompanyBySlug } from "@/lib/db/queries";
import { db, schema } from "@/lib/db/client";
import { desc, like, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  // Get articles mentioning this company
  const articles = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .leftJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .where(like(schema.articles.title, `%${company.name}%`))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(20);

  return (
    <div>
      <PageHeader
        title={company.name}
        description={company.description}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Company Profile</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Ticker</span>
                <span className="text-text-primary font-medium">{company.ticker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Sector</span>
                <span className="text-text-primary">{company.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tracking</span>
                <Badge variant={company.isMain ? "info" : "default"}>
                  {company.isMain ? "Primary" : "Competitor"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Related Articles ({articles.length})
          </h3>
          {articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map(({ article, enrichment, source }) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  enrichment={enrichment}
                  sourceName={source?.name}
                />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-text-muted text-center py-4">
                No articles found mentioning {company.name} yet.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
