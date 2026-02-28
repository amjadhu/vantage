"use client";

import { useState, useMemo } from "react";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { FeedFilters } from "@/components/feed/FeedFilters";

type FeedItem = {
  article: {
    id: string;
    title: string;
    url: string;
    summary: string | null;
    author: string | null;
    publishedAt: string;
    categories: string[] | null;
    sourceId: string;
    externalId: string;
    content: string;
    metadata: unknown;
    fetchedAt: string;
    contentHash: string;
  };
  enrichment: {
    id: string;
    articleId: string;
    personaId: string;
    executiveSummary: string;
    relevanceScore: number;
    impactLevel: string;
    sentiment: string;
    entities: Array<{ name: string; type: string }> | null;
    categoryTags: string[] | null;
    keyFacts: string[] | null;
    connectionHints: string[] | null;
    enrichedAt: string;
    modelUsed: string;
    tokenCount: number | null;
  } | null;
  source: {
    id: string;
    name: string;
    type: string;
    url: string;
    category: string;
    enabled: boolean;
    fetchIntervalMinutes: number;
    lastFetchedAt: string | null;
    metadata: unknown;
    createdAt: string;
  } | null;
};

interface FeedClientProps {
  items: FeedItem[];
}

export function FeedClient({ items }: FeedClientProps) {
  const [filters, setFilters] = useState<{
    impact?: string;
    category?: string;
    minRelevance?: number;
  }>({});

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filters.impact && item.enrichment?.impactLevel !== filters.impact) {
        return false;
      }
      if (filters.category) {
        const tags = item.enrichment?.categoryTags || item.article.categories || [];
        if (!tags.some((t) => t.toLowerCase().includes(filters.category!.toLowerCase()))) {
          return false;
        }
      }
      if (filters.minRelevance && filters.minRelevance > 0) {
        if (!item.enrichment || item.enrichment.relevanceScore < filters.minRelevance) {
          return false;
        }
      }
      return true;
    });
  }, [items, filters]);

  return (
    <>
      <FeedFilters activeFilters={filters} onFilterChange={setFilters} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">
          Showing {filtered.length} of {items.length} articles
        </span>
      </div>
      <div className="space-y-3">
        {filtered.map(({ article, enrichment, source }) => (
          <ArticleCard
            key={article.id}
            article={article}
            enrichment={enrichment}
            sourceName={source?.name}
          />
        ))}
      </div>
    </>
  );
}
