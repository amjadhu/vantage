import { db, schema } from "./client";
import { v4 as uuid } from "uuid";
import type { PersonaConfig } from "@/types";

export async function seedSources() {
  const existingSources = await db.select().from(schema.sources);
  if (existingSources.length > 0) return;

  const sources = [
    { id: uuid(), name: "KrebsOnSecurity", type: "rss", url: "https://krebsonsecurity.com/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "BleepingComputer", type: "rss", url: "https://www.bleepingcomputer.com/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Dark Reading", type: "rss", url: "https://www.darkreading.com/rss.xml", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "TechCrunch", type: "rss", url: "https://techcrunch.com/feed/", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Ars Technica", type: "rss", url: "https://feeds.arstechnica.com/arstechnica/index", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "The Verge", type: "rss", url: "https://www.theverge.com/rss/index.xml", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "SecurityWeek", type: "rss", url: "https://www.securityweek.com/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "The Record", type: "rss", url: "https://therecord.media/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "CrowdStrike Blog", type: "rss", url: "https://www.crowdstrike.com/blog/feed/", category: "company", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "CISA KEV", type: "cisa", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", category: "cyber", fetchIntervalMinutes: 360 },
    { id: uuid(), name: "NIST NVD", type: "nist_nvd", url: "https://services.nvd.nist.gov/rest/json/cves/2.0", category: "cyber", fetchIntervalMinutes: 360 },
    { id: uuid(), name: "Hacker News", type: "hackernews", url: "https://hn.algolia.com/api/v1/search", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Reddit", type: "reddit", url: "https://www.reddit.com", category: "tech", fetchIntervalMinutes: 180 },
  ];

  await db.insert(schema.sources).values(
    sources.map((s) => ({
      ...s,
      enabled: true,
      createdAt: new Date().toISOString(),
    }))
  );

  console.log(`Seeded ${sources.length} sources`);
}

export async function seedPersona() {
  const existing = await db.select().from(schema.personas);
  if (existing.length > 0) return;

  const config: PersonaConfig = {
    interestAreas: [
      { topic: "cybersecurity", weight: 1.0 },
      { topic: "AI/ML", weight: 0.8 },
      { topic: "cloud infrastructure", weight: 0.7 },
      { topic: "enterprise technology", weight: 0.6 },
    ],
    depthLevel: "executive",
    companyWatchlist: ["CRWD", "PANW", "S", "FTNT", "ZS"],
    sourcePrioritization: {},
    briefingFormat: {
      maxItems: 15,
      includeActionItems: true,
      includeTrendAnalysis: true,
    },
    relevanceThreshold: 0.3,
  };

  await db.insert(schema.personas).values({
    id: uuid(),
    name: "Technology Executive — Cybersecurity Focus",
    description: "Default persona for a technology executive focused on cybersecurity, AI/ML, and enterprise tech",
    config: config,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log("Seeded default persona");
}

export async function seedWatchlistCompanies() {
  const existing = await db.select().from(schema.watchlistCompanies);
  if (existing.length > 0) return;

  const companies = [
    { ticker: "CRWD", name: "CrowdStrike", slug: "crowdstrike", sector: "Cybersecurity", description: "Endpoint security and threat intelligence platform", isMain: true },
    { ticker: "PANW", name: "Palo Alto Networks", slug: "palo-alto-networks", sector: "Cybersecurity", description: "Network security and cloud security platform", isMain: false },
    { ticker: "S", name: "SentinelOne", slug: "sentinelone", sector: "Cybersecurity", description: "Autonomous endpoint security platform", isMain: false },
    { ticker: "FTNT", name: "Fortinet", slug: "fortinet", sector: "Cybersecurity", description: "Network security appliances and services", isMain: false },
    { ticker: "ZS", name: "Zscaler", slug: "zscaler", sector: "Cybersecurity", description: "Cloud security and zero trust platform", isMain: false },
  ];

  await db.insert(schema.watchlistCompanies).values(
    companies.map((c) => ({
      id: uuid(),
      ...c,
      createdAt: new Date().toISOString(),
    }))
  );

  console.log(`Seeded ${companies.length} watchlist companies`);
}

export async function seedAll() {
  await seedSources();
  await seedPersona();
  await seedWatchlistCompanies();
}
