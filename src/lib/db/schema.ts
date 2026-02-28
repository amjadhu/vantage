import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // rss, hackernews, reddit, cisa, nist_nvd, sec_edgar
  url: text("url").notNull(),
  category: text("category").notNull(), // tech, cyber, company, regulatory
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  fetchIntervalMinutes: integer("fetch_interval_minutes").notNull().default(120),
  lastFetchedAt: text("last_fetched_at"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  author: text("author"),
  publishedAt: text("published_at").notNull(),
  categories: text("categories", { mode: "json" }).$type<string[]>(),
  metadata: text("metadata", { mode: "json" }),
  fetchedAt: text("fetched_at").notNull().$defaultFn(() => new Date().toISOString()),
  contentHash: text("content_hash").notNull(),
});

export const enrichments = sqliteTable("enrichments", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  personaId: text("persona_id").notNull().references(() => personas.id),
  executiveSummary: text("executive_summary").notNull(),
  relevanceScore: real("relevance_score").notNull(),
  impactLevel: text("impact_level").notNull(), // critical, high, medium, low, informational
  sentiment: text("sentiment").notNull(), // positive, negative, neutral, mixed
  entities: text("entities", { mode: "json" }).$type<Array<{ name: string; type: string }>>(),
  categoryTags: text("category_tags", { mode: "json" }).$type<string[]>(),
  keyFacts: text("key_facts", { mode: "json" }).$type<string[]>(),
  connectionHints: text("connection_hints", { mode: "json" }).$type<string[]>(),
  enrichedAt: text("enriched_at").notNull().$defaultFn(() => new Date().toISOString()),
  modelUsed: text("model_used").notNull(),
  tokenCount: integer("token_count"),
});

export const articleConnections = sqliteTable("article_connections", {
  id: text("id").primaryKey(),
  sourceArticleId: text("source_article_id").notNull().references(() => articles.id),
  targetArticleId: text("target_article_id").notNull().references(() => articles.id),
  relationshipType: text("relationship_type").notNull(), // related, follow-up, contradicts, caused-by
  reasoning: text("reasoning").notNull(),
  confidence: real("confidence").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const briefings = sqliteTable("briefings", {
  id: text("id").primaryKey(),
  personaId: text("persona_id").notNull().references(() => personas.id),
  markdownContent: text("markdown_content").notNull(),
  articleIds: text("article_ids", { mode: "json" }).$type<string[]>(),
  generatedAt: text("generated_at").notNull().$defaultFn(() => new Date().toISOString()),
  modelUsed: text("model_used").notNull(),
  tokenCount: integer("token_count"),
});

export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  config: text("config", { mode: "json" }).notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const watchlistCompanies = sqliteTable("watchlist_companies", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sector: text("sector").notNull(),
  description: text("description").notNull(),
  isMain: integer("is_main", { mode: "boolean" }).notNull().default(false),
  metadata: text("metadata", { mode: "json" }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const trends = sqliteTable("trends", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  date: text("date").notNull(),
  mentionCount: integer("mention_count").notNull().default(0),
  articleIds: text("article_ids", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const pipelineRuns = sqliteTable("pipeline_runs", {
  id: text("id").primaryKey(),
  pipeline: text("pipeline").notNull(), // fetch, enrich, connect, briefing, analysis
  trigger: text("trigger").notNull(), // cron, manual
  status: text("status").notNull(), // success, failed
  tokenCount: integer("token_count").default(0),
  itemsProcessed: integer("items_processed").default(0),
  errorMessage: text("error_message"),
  date: text("date").notNull(), // YYYY-MM-DD for daily grouping
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // competitive, trend, regulatory, threat
  markdownContent: text("markdown_content").notNull(),
  articleIds: text("article_ids", { mode: "json" }).$type<string[]>(),
  personaId: text("persona_id").references(() => personas.id),
  generatedAt: text("generated_at").notNull().$defaultFn(() => new Date().toISOString()),
  modelUsed: text("model_used").notNull(),
  tokenCount: integer("token_count"),
});
