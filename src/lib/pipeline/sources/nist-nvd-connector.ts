import type { SourceConnector, SourceConfig, RawArticle } from "@/types";

interface NvdCve {
  id: string;
  sourceIdentifier: string;
  published: string;
  lastModified: string;
  descriptions: Array<{ lang: string; value: string }>;
  metrics?: {
    cvssMetricV31?: Array<{
      cvssData: {
        baseScore: number;
        baseSeverity: string;
        vectorString: string;
      };
    }>;
  };
  references?: Array<{ url: string; source: string }>;
}

export class NistNvdConnector implements SourceConnector {
  type = "nist_nvd";

  async fetch(config: SourceConfig): Promise<RawArticle[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const params = new URLSearchParams({
        pubStartDate: startDate.toISOString().replace(/\.\d{3}Z$/, ".000"),
        pubEndDate: new Date().toISOString().replace(/\.\d{3}Z$/, ".000"),
        resultsPerPage: "20",
        cvssV3Severity: "HIGH",
      });

      const response = await fetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`,
        {
          headers: {
            "User-Agent": "Vantage Intelligence Dashboard/1.0",
          },
        }
      );

      if (!response.ok) {
        console.error(`[NistNvdConnector] API returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      const cves: NvdCve[] = (data.vulnerabilities || []).map(
        (v: { cve: NvdCve }) => v.cve
      );

      return cves.map((cve) => {
        const description =
          cve.descriptions.find((d) => d.lang === "en")?.value || "No description available";
        const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
        const severity = cvss?.baseSeverity || "UNKNOWN";
        const score = cvss?.baseScore || 0;

        return {
          sourceId: config.id,
          externalId: `nvd-${cve.id}`,
          title: `[CVE] ${cve.id} (${severity} ${score})`,
          url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
          content: `${description}\n\nCVSS Score: ${score} (${severity})\nVector: ${cvss?.vectorString || "N/A"}\nPublished: ${cve.published}\nSource: ${cve.sourceIdentifier}`,
          publishedAt: new Date(cve.published),
          categories: ["cve", severity.toLowerCase(), "vulnerability"],
        };
      });
    } catch (error) {
      console.error("[NistNvdConnector] Error:", error);
      return [];
    }
  }
}
