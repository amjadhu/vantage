import { getEnabledSources, updateSourceLastFetched } from "@/lib/db/queries";
import { getConnector } from "./sources";
import { normalizeAndStore } from "./normalize";

export async function runFetchPipeline(): Promise<{
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  errors: string[];
}> {
  const sources = await getEnabledSources();
  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const source of sources) {
    const connector = getConnector(source.type);
    if (!connector) {
      errors.push(`No connector for source type: ${source.type}`);
      continue;
    }

    try {
      console.log(`[Pipeline] Fetching ${source.name}...`);
      const rawArticles = await connector.fetch({
        id: source.id,
        name: source.name,
        type: source.type as "rss",
        url: source.url,
        category: source.category as "tech",
        enabled: true,
        fetchIntervalMinutes: source.fetchIntervalMinutes,
      });

      totalFetched += rawArticles.length;

      const { inserted, skipped } = await normalizeAndStore(rawArticles);
      totalInserted += inserted;
      totalSkipped += skipped;

      await updateSourceLastFetched(source.id);
      console.log(`[Pipeline] ${source.name}: ${rawArticles.length} fetched, ${inserted} new, ${skipped} dupes`);
    } catch (error) {
      const msg = `Failed to process ${source.name}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[Pipeline] ${msg}`);
      errors.push(msg);
    }
  }

  return { totalFetched, totalInserted, totalSkipped, errors };
}
