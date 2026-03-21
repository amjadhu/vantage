import { createHash } from "crypto";
import { v4 as uuid } from "uuid";
import type { RawArticle } from "@/types";
import { db, schema } from "@/lib/db/client";
import { inArray } from "drizzle-orm";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function generateContentHash(article: RawArticle): string {
  const normalized = `${article.title.toLowerCase().trim()}|${article.url.toLowerCase().trim()}`;
  return createHash("sha256").update(normalized).digest("hex");
}

function truncateContent(content: string, maxLength = 10000): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

export async function normalizeAndStore(rawArticles: RawArticle[]): Promise<{ inserted: number; skipped: number }> {
  if (rawArticles.length === 0) return { inserted: 0, skipped: 0 };

  // Compute hashes for all articles
  const articleHashes = rawArticles.map((raw) => ({
    raw,
    contentHash: generateContentHash(raw),
  }));

  // Batch check which hashes already exist
  const allHashes = articleHashes.map((a) => a.contentHash);
  const existingHashes = new Set<string>();

  // Query in chunks of 100 to avoid SQLite variable limits
  for (let i = 0; i < allHashes.length; i += 100) {
    const chunk = allHashes.slice(i, i + 100);
    const existing = await db
      .select({ contentHash: schema.articles.contentHash })
      .from(schema.articles)
      .where(inArray(schema.articles.contentHash, chunk));
    for (const row of existing) {
      existingHashes.add(row.contentHash);
    }
  }

  // Prepare new articles
  const newArticles = articleHashes
    .filter((a) => !existingHashes.has(a.contentHash))
    .map(({ raw, contentHash }) => {
      const cleanContent = stripHtml(raw.content);
      const cleanSummary = raw.summary ? stripHtml(raw.summary) : undefined;
      return {
        id: uuid(),
        sourceId: raw.sourceId,
        externalId: raw.externalId,
        title: raw.title.trim(),
        url: raw.url,
        content: truncateContent(cleanContent),
        summary: cleanSummary ? truncateContent(cleanSummary, 2000) : null,
        author: raw.author || null,
        publishedAt: raw.publishedAt.toISOString(),
        categories: raw.categories || [],
        metadata: raw.metadata || null,
        contentHash,
        fetchedAt: new Date().toISOString(),
      };
    });

  // Batch insert in groups of 50
  for (let i = 0; i < newArticles.length; i += 50) {
    const batch = newArticles.slice(i, i + 50);
    await db.insert(schema.articles).values(batch);
  }

  return {
    inserted: newArticles.length,
    skipped: rawArticles.length - newArticles.length,
  };
}
