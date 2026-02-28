import type { SourceConnector, SourceConfig, RawArticle } from "@/types";

interface CisaKevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
}

export class CisaConnector implements SourceConnector {
  type = "cisa";

  async fetch(config: SourceConfig): Promise<RawArticle[]> {
    const articles: RawArticle[] = [];

    try {
      // CISA Known Exploited Vulnerabilities (KEV) catalog
      const kevResponse = await fetch(
        "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
        {
          headers: { "User-Agent": "Vantage Intelligence Dashboard/1.0" },
        }
      );

      if (kevResponse.ok) {
        const data = await kevResponse.json();
        const recentCutoff = new Date();
        recentCutoff.setDate(recentCutoff.getDate() - 14);

        const recentEntries = (data.vulnerabilities || [])
          .filter((v: CisaKevEntry) => new Date(v.dateAdded) >= recentCutoff)
          .slice(0, 20);

        for (const entry of recentEntries) {
          articles.push({
            sourceId: config.id,
            externalId: `cisa-kev-${entry.cveID}`,
            title: `[CISA KEV] ${entry.cveID}: ${entry.vulnerabilityName}`,
            url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog`,
            content: `${entry.shortDescription}\n\nVendor/Project: ${entry.vendorProject}\nProduct: ${entry.product}\nRequired Action: ${entry.requiredAction}\nDue Date: ${entry.dueDate}\nRansomware Use: ${entry.knownRansomwareCampaignUse}`,
            publishedAt: new Date(entry.dateAdded),
            categories: ["cisa-kev", "vulnerability", entry.vendorProject.toLowerCase()],
          });
        }
      }
    } catch (error) {
      console.error("[CisaConnector] Error fetching KEV:", error);
    }

    return articles;
  }
}
