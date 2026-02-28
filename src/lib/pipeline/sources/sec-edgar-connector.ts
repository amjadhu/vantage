import type { SourceConnector, SourceConfig, RawArticle } from "@/types";

interface EdgarFiling {
  accessionNo: string;
  filingDate: string;
  reportDate: string;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
}

export class SecEdgarConnector implements SourceConnector {
  type = "sec_edgar";

  async fetch(config: SourceConfig): Promise<RawArticle[]> {
    try {
      const metadata = config.metadata as { cik?: string; tickers?: string[] } | undefined;
      const tickers = metadata?.tickers || [];

      const articles: RawArticle[] = [];

      for (const ticker of tickers) {
        const url = `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=${this.getDateDaysAgo(7)}&enddt=${this.getToday()}&forms=10-K,10-Q,8-K,DEF%2014A`;

        const response = await fetch(
          `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K,10-Q,8-K&dateRange=custom&startdt=${this.getDateDaysAgo(30)}&enddt=${this.getToday()}`,
          {
            headers: {
              "User-Agent": "Vantage Intelligence amjad@example.com",
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          // Fallback to the EDGAR company filings API
          const filings = await this.fetchCompanyFilings(ticker);
          articles.push(...filings.map((f) => this.filingToArticle(f, ticker, config.id)));
          continue;
        }

        const data = await response.json();
        if (data.hits?.hits) {
          for (const hit of data.hits.hits.slice(0, 5)) {
            const source = hit._source;
            articles.push({
              sourceId: config.id,
              externalId: `sec-${source.file_num}-${source.file_date}`,
              title: `${ticker}: ${source.form_type} Filing - ${source.display_names?.[0] || ticker}`,
              url: `https://www.sec.gov/Archives/edgar/data/${source.entity_id}/${source.file_num}`,
              content: `SEC ${source.form_type} filing by ${source.display_names?.[0] || ticker} on ${source.file_date}. ${source.display_description || ""}`,
              publishedAt: new Date(source.file_date),
              categories: ["sec-filing", source.form_type],
            });
          }
        }
      }

      return articles;
    } catch (error) {
      console.error(`[SecEdgarConnector] Error:`, error);
      return [];
    }
  }

  private async fetchCompanyFilings(ticker: string): Promise<EdgarFiling[]> {
    try {
      const response = await fetch(
        `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K,10-Q,8-K`,
        {
          headers: {
            "User-Agent": "Vantage Intelligence amjad@example.com",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.filings?.recent || [];
    } catch {
      return [];
    }
  }

  private filingToArticle(filing: EdgarFiling, ticker: string, sourceId: string): RawArticle {
    return {
      sourceId,
      externalId: `sec-${filing.accessionNo}`,
      title: `${ticker}: ${filing.form} Filing (${filing.filingDate})`,
      url: `https://www.sec.gov/Archives/edgar/data/${filing.accessionNo.replace(/-/g, "")}/${filing.primaryDocument}`,
      content: `SEC ${filing.form} filing for ${ticker}. Filed: ${filing.filingDate}. Report date: ${filing.reportDate}. ${filing.primaryDocDescription || ""}`,
      publishedAt: new Date(filing.filingDate),
      categories: ["sec-filing", filing.form],
    };
  }

  private getDateDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  }

  private getToday(): string {
    return new Date().toISOString().split("T")[0];
  }
}
