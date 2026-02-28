// ============ Source & Pipeline Types ============

export interface SourceConfig {
  id: string;
  name: string;
  type: "rss" | "hackernews" | "reddit" | "cisa" | "nist_nvd" | "sec_edgar";
  url: string;
  category: "tech" | "cyber" | "company" | "regulatory";
  enabled: boolean;
  fetchIntervalMinutes: number;
  metadata?: Record<string, unknown>;
}

export interface RawArticle {
  sourceId: string;
  externalId: string;
  title: string;
  url: string;
  content: string;
  summary?: string;
  author?: string;
  publishedAt: Date;
  categories?: string[];
  metadata?: Record<string, unknown>;
}

export interface SourceConnector {
  type: string;
  fetch(config: SourceConfig): Promise<RawArticle[]>;
}

// ============ Enrichment Types ============

export interface EnrichmentResult {
  executiveSummary: string;
  relevanceScore: number;
  impactLevel: "critical" | "high" | "medium" | "low" | "informational";
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  entities: Entity[];
  categoryTags: string[];
  keyFacts: string[];
  connectionHints: string[];
}

export interface Entity {
  name: string;
  type: "company" | "person" | "technology" | "vulnerability" | "regulation" | "product";
}

export interface ArticleConnection {
  sourceArticleId: string;
  targetArticleId: string;
  relationshipType: "related" | "follow-up" | "contradicts" | "caused-by";
  reasoning: string;
  confidence: number;
}

// ============ Briefing Types ============

export interface BriefingSection {
  title: string;
  content: string;
}

export interface Briefing {
  id: string;
  personaId: string;
  generatedAt: Date;
  markdownContent: string;
  articleIds: string[];
  sections: BriefingSection[];
}

// ============ Persona Types ============

export interface PersonaConfig {
  interestAreas: Array<{ topic: string; weight: number }>;
  depthLevel: "executive" | "managerial" | "technical" | "analyst";
  companyWatchlist: string[];
  sourcePrioritization: Record<string, number>;
  briefingFormat: {
    maxItems: number;
    includeActionItems: boolean;
    includeTrendAnalysis: boolean;
  };
  relevanceThreshold: number;
}

// ============ Company Types ============

export interface WatchlistCompany {
  ticker: string;
  name: string;
  slug: string;
  sector: string;
  description: string;
  isMain: boolean;
}

// ============ Trend Types ============

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendTopic {
  topic: string;
  points: TrendPoint[];
  totalMentions: number;
  trend: "rising" | "falling" | "stable";
}

// ============ UI Types ============

export interface FilterState {
  categories: string[];
  impactLevels: string[];
  sources: string[];
  dateRange: { from?: Date; to?: Date };
  minRelevance: number;
  searchQuery: string;
}
