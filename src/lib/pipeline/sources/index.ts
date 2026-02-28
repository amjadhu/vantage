import type { SourceConnector } from "@/types";
import { RssConnector } from "./rss-connector";
import { SecEdgarConnector } from "./sec-edgar-connector";
import { CisaConnector } from "./cisa-connector";
import { NistNvdConnector } from "./nist-nvd-connector";
import { HackerNewsConnector } from "./hackernews-connector";
import { RedditConnector } from "./reddit-connector";

const connectors: Record<string, SourceConnector> = {
  rss: new RssConnector(),
  sec_edgar: new SecEdgarConnector(),
  cisa: new CisaConnector(),
  nist_nvd: new NistNvdConnector(),
  hackernews: new HackerNewsConnector(),
  reddit: new RedditConnector(),
};

export function getConnector(type: string): SourceConnector | null {
  return connectors[type] || null;
}

export function registerConnector(type: string, connector: SourceConnector) {
  connectors[type] = connector;
}
