import { db, schema } from "./client";
import { eq, desc, and, gte, lte, inArray, like, sql } from "drizzle-orm";

// ============ Articles ============

export async function getArticles(opts: {
  limit?: number;
  offset?: number;
  category?: string;
  sourceId?: string;
  minRelevance?: number;
  impactLevel?: string;
  from?: string;
  to?: string;
  search?: string;
} = {}) {
  const { limit = 50, offset = 0 } = opts;

  const conditions = [];

  if (opts.from) {
    conditions.push(gte(schema.articles.publishedAt, opts.from));
  }
  if (opts.to) {
    conditions.push(lte(schema.articles.publishedAt, opts.to));
  }
  if (opts.sourceId) {
    conditions.push(eq(schema.articles.sourceId, opts.sourceId));
  }
  if (opts.search) {
    conditions.push(like(schema.articles.title, `%${opts.search}%`));
  }

  const articlesResult = await db
    .select()
    .from(schema.articles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.articles.publishedAt))
    .limit(limit)
    .offset(offset);

  return articlesResult;
}

export async function getArticlesWithEnrichments(opts: {
  limit?: number;
  offset?: number;
  personaId?: string;
  category?: string;
  minRelevance?: number;
  impactLevel?: string;
  search?: string;
} = {}) {
  const { limit = 50, offset = 0 } = opts;

  const result = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .leftJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getArticleById(id: string) {
  const result = await db
    .select({
      article: schema.articles,
      enrichment: schema.enrichments,
      source: schema.sources,
    })
    .from(schema.articles)
    .leftJoin(schema.enrichments, eq(schema.articles.id, schema.enrichments.articleId))
    .leftJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .where(eq(schema.articles.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getUnenrichedArticles(limit = 20) {
  const enrichedIds = db
    .select({ articleId: schema.enrichments.articleId })
    .from(schema.enrichments);

  const result = await db
    .select()
    .from(schema.articles)
    .where(
      sql`${schema.articles.id} NOT IN (${enrichedIds})`
    )
    .orderBy(desc(schema.articles.publishedAt))
    .limit(limit);

  return result;
}

export async function articleExistsByHash(contentHash: string) {
  const result = await db
    .select({ id: schema.articles.id })
    .from(schema.articles)
    .where(eq(schema.articles.contentHash, contentHash))
    .limit(1);

  return result.length > 0;
}

// ============ Sources ============

export async function getEnabledSources() {
  return db
    .select()
    .from(schema.sources)
    .where(eq(schema.sources.enabled, true));
}

export async function getAllSources() {
  return db.select().from(schema.sources);
}

export async function updateSourceLastFetched(sourceId: string) {
  await db
    .update(schema.sources)
    .set({ lastFetchedAt: new Date().toISOString() })
    .where(eq(schema.sources.id, sourceId));
}

// ============ Enrichments ============

export async function insertEnrichment(data: typeof schema.enrichments.$inferInsert) {
  await db.insert(schema.enrichments).values(data);
}

// ============ Briefings ============

export async function getLatestBriefing(personaId?: string) {
  const conditions = personaId ? eq(schema.briefings.personaId, personaId) : undefined;

  const result = await db
    .select()
    .from(schema.briefings)
    .where(conditions)
    .orderBy(desc(schema.briefings.generatedAt))
    .limit(1);

  return result[0] || null;
}

export async function getBriefings(limit = 10) {
  return db
    .select()
    .from(schema.briefings)
    .orderBy(desc(schema.briefings.generatedAt))
    .limit(limit);
}

// ============ Personas ============

export async function getDefaultPersona() {
  const result = await db
    .select()
    .from(schema.personas)
    .where(eq(schema.personas.isDefault, true))
    .limit(1);

  return result[0] || null;
}

export async function getAllPersonas() {
  return db.select().from(schema.personas);
}

// ============ Companies ============

export async function getWatchlistCompanies() {
  return db.select().from(schema.watchlistCompanies);
}

export async function getCompanyBySlug(slug: string) {
  const result = await db
    .select()
    .from(schema.watchlistCompanies)
    .where(eq(schema.watchlistCompanies.slug, slug))
    .limit(1);

  return result[0] || null;
}

// ============ Connections ============

export async function getConnectionsForArticle(articleId: string) {
  return db
    .select()
    .from(schema.articleConnections)
    .where(
      sql`${schema.articleConnections.sourceArticleId} = ${articleId} OR ${schema.articleConnections.targetArticleId} = ${articleId}`
    );
}

// ============ Trends ============

export async function getTrends(topic?: string, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const conditions = [gte(schema.trends.date, fromDate.toISOString().split("T")[0])];
  if (topic) {
    conditions.push(eq(schema.trends.topic, topic));
  }

  return db
    .select()
    .from(schema.trends)
    .where(and(...conditions))
    .orderBy(schema.trends.date);
}

// ============ Analyses ============

export async function getAnalyses(limit = 20) {
  return db
    .select()
    .from(schema.analyses)
    .orderBy(desc(schema.analyses.generatedAt))
    .limit(limit);
}

export async function getAnalysisById(id: string) {
  const result = await db
    .select()
    .from(schema.analyses)
    .where(eq(schema.analyses.id, id))
    .limit(1);

  return result[0] || null;
}

// ============ Stats ============

export async function getArticleCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.articles);

  return result[0]?.count || 0;
}

export async function getSourceStats() {
  const result = await db
    .select({
      sourceId: schema.articles.sourceId,
      sourceName: schema.sources.name,
      count: sql<number>`count(*)`,
    })
    .from(schema.articles)
    .leftJoin(schema.sources, eq(schema.articles.sourceId, schema.sources.id))
    .groupBy(schema.articles.sourceId);

  return result;
}
