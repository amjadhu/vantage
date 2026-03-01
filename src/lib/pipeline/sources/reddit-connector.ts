import type { SourceConnector, SourceConfig, RawArticle } from "@/types";

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    selftext: string;
    author: string;
    created_utc: number;
    subreddit: string;
    score: number;
    num_comments: number;
    permalink: string;
    is_self: boolean;
  };
}

const SUBREDDITS = ["cybersecurity", "netsec", "technology", "MachineLearning", "artificial", "sysadmin"];

export class RedditConnector implements SourceConnector {
  type = "reddit";

  async fetch(config: SourceConfig): Promise<RawArticle[]> {
    const articles: RawArticle[] = [];

    try {
      for (const subreddit of SUBREDDITS) {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
          {
            headers: {
              "User-Agent": "Vantage:1.0 (by /u/vantage-intel)",
            },
          }
        );

        if (!response.ok) {
          console.error(`[RedditConnector] r/${subreddit} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        const posts: RedditPost[] = data.data?.children || [];

        for (const post of posts) {
          const p = post.data;
          if (!p.title) continue;

          articles.push({
            sourceId: config.id,
            externalId: `reddit-${p.id}`,
            title: `[r/${p.subreddit}] ${p.title}`,
            url: p.is_self
              ? `https://reddit.com${p.permalink}`
              : p.url,
            content: p.selftext || p.title,
            author: p.author,
            publishedAt: new Date(p.created_utc * 1000),
            categories: ["reddit", p.subreddit.toLowerCase()],
            metadata: { score: p.score, numComments: p.num_comments, subreddit: p.subreddit },
          });
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error("[RedditConnector] Error:", error);
    }

    return articles;
  }
}
