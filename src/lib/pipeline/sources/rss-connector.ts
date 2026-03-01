import Parser from "rss-parser";
import type { SourceConnector, SourceConfig, RawArticle } from "@/types";

const MAX_ARTICLES_PER_SOURCE = 15;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Vantage Intelligence Dashboard/1.0",
  },
});

export class RssConnector implements SourceConnector {
  type = "rss";

  async fetch(config: SourceConfig): Promise<RawArticle[]> {
    try {
      const feed = await parser.parseURL(config.url);

      const articles = (feed.items || []).map((item) => ({
        sourceId: config.id,
        externalId: item.guid || item.link || item.title || "",
        title: (item.title || "Untitled").trim(),
        url: item.link || "",
        content: item["content:encoded"] || item.content || item.contentSnippet || item.summary || "",
        summary: item.contentSnippet || item.summary || "",
        author: item.creator || item.author || undefined,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        categories: item.categories || [],
      }));

      // Cap per-source to prevent any single feed from dominating
      return articles.slice(0, MAX_ARTICLES_PER_SOURCE);
    } catch (error) {
      console.error(`[RssConnector] Failed to fetch ${config.name} (${config.url}):`, error);
      return [];
    }
  }
}
