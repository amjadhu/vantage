import type { SourceConnector, SourceConfig, RawArticle } from "@/types";

interface HNHit {
  objectID: string;
  title: string;
  url: string;
  author: string;
  created_at: string;
  story_text?: string;
  comment_text?: string;
  points: number;
  num_comments: number;
}

const KEYWORDS = [
  "cybersecurity",
  "data breach",
  "ransomware",
  "zero-day",
  "CrowdStrike",
  "vulnerability",
  "CISO",
  "threat intelligence",
  "AI security",
  "cloud security",
];

export class HackerNewsConnector implements SourceConnector {
  type = "hackernews";

  async fetch(config: SourceConfig): Promise<RawArticle[]> {
    const articles: RawArticle[] = [];

    try {
      for (const keyword of KEYWORDS.slice(0, 5)) {
        const response = await fetch(
          `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=5`,
          { headers: { "User-Agent": "Vantage Intelligence Dashboard/1.0" } }
        );

        if (!response.ok) continue;

        const data = await response.json();
        for (const hit of (data.hits || []) as HNHit[]) {
          if (!hit.url && !hit.story_text) continue;

          articles.push({
            sourceId: config.id,
            externalId: `hn-${hit.objectID}`,
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            content: hit.story_text || `${hit.title}. Points: ${hit.points}, Comments: ${hit.num_comments}`,
            author: hit.author,
            publishedAt: new Date(hit.created_at),
            categories: ["hackernews", keyword.toLowerCase().replace(/\s+/g, "-")],
            metadata: { points: hit.points, numComments: hit.num_comments },
          });
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (error) {
      console.error("[HackerNewsConnector] Error:", error);
    }

    return articles;
  }
}
