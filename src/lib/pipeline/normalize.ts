import { createHash } from "crypto";
import { v4 as uuid } from "uuid";
import type { RawArticle } from "@/types";
import { db, schema } from "@/lib/db/client";
import { articleExistsByHash } from "@/lib/db/queries";

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
  let inserted = 0;
  let skipped = 0;

  for (const raw of rawArticles) {
    const contentHash = generateContentHash(raw);

    const exists = await articleExistsByHash(contentHash);
    if (exists) {
      skipped++;
      continue;
    }

    const cleanContent = stripHtml(raw.content);
    const cleanSummary = raw.summary ? stripHtml(raw.summary) : undefined;

    await db.insert(schema.articles).values({
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
    });

    inserted++;
  }

  return { inserted, skipped };
}
