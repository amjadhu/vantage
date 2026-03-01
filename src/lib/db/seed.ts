import { db, schema } from "./client";
import { v4 as uuid } from "uuid";
import type { PersonaConfig } from "@/types";

export async function seedSources() {
  const existingSources = await db.select().from(schema.sources);
  const existingNames = new Set(existingSources.map((s) => s.name));

  const sources = [
    // ── Cybersecurity ──────────────────────────────────────────────
    { id: uuid(), name: "KrebsOnSecurity", type: "rss", url: "https://krebsonsecurity.com/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "BleepingComputer", type: "rss", url: "https://www.bleepingcomputer.com/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Dark Reading", type: "rss", url: "https://www.darkreading.com/rss.xml", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "SecurityWeek", type: "rss", url: "https://www.securityweek.com/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "The Record", type: "rss", url: "https://therecord.media/feed/", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Schneier on Security", type: "rss", url: "https://www.schneier.com/feed/", category: "cyber", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "The Hacker News", type: "rss", url: "https://thehackernews.com/feeds/posts/default", category: "cyber", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "CISA Alerts", type: "rss", url: "https://www.cisa.gov/news.xml", category: "cyber", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Microsoft Security Blog", type: "rss", url: "https://www.microsoft.com/en-us/security/blog/feed/", category: "cyber", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "CISA KEV", type: "cisa", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", category: "cyber", fetchIntervalMinutes: 360 },
    { id: uuid(), name: "NIST NVD", type: "nist_nvd", url: "https://services.nvd.nist.gov/rest/json/cves/2.0", category: "cyber", fetchIntervalMinutes: 360 },
    // ── General Tech ───────────────────────────────────────────────
    { id: uuid(), name: "TechCrunch", type: "rss", url: "https://techcrunch.com/feed/", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Ars Technica", type: "rss", url: "https://feeds.arstechnica.com/arstechnica/index", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "The Verge", type: "rss", url: "https://www.theverge.com/rss/index.xml", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Wired", type: "rss", url: "https://www.wired.com/feed/rss", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "The Register", type: "rss", url: "https://www.theregister.com/headlines.atom", category: "tech", fetchIntervalMinutes: 120 },
    // ── AI/ML ──────────────────────────────────────────────────────
    { id: uuid(), name: "MIT Technology Review", type: "rss", url: "https://www.technologyreview.com/feed/", category: "tech", fetchIntervalMinutes: 180 },
    { id: uuid(), name: "OpenAI Blog", type: "rss", url: "https://openai.com/blog/rss.xml", category: "tech", fetchIntervalMinutes: 360 },
    { id: uuid(), name: "Google AI Blog", type: "rss", url: "https://blog.google/technology/ai/rss/", category: "tech", fetchIntervalMinutes: 360 },
    { id: uuid(), name: "Hugging Face Blog", type: "rss", url: "https://huggingface.co/blog/feed.xml", category: "tech", fetchIntervalMinutes: 360 },
    { id: uuid(), name: "Simon Willison", type: "rss", url: "https://simonwillison.net/atom/everything/", category: "tech", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Lilian Weng", type: "rss", url: "https://lilianweng.github.io/index.xml", category: "tech", fetchIntervalMinutes: 360 },
    // ── Cloud / Infrastructure ─────────────────────────────────────
    { id: uuid(), name: "InfoQ", type: "rss", url: "https://feed.infoq.com/", category: "tech", fetchIntervalMinutes: 180 },
    { id: uuid(), name: "AWS News Blog", type: "rss", url: "https://aws.amazon.com/blogs/aws/feed/", category: "tech", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Azure Blog", type: "rss", url: "https://azure.microsoft.com/en-us/blog/feed/", category: "tech", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Google Cloud Blog", type: "rss", url: "https://cloud.google.com/blog/rss", category: "tech", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Cloudflare Blog", type: "rss", url: "https://blog.cloudflare.com/rss/", category: "tech", fetchIntervalMinutes: 240 },
    // ── Watchlist Company Blogs ────────────────────────────────────
    { id: uuid(), name: "CrowdStrike Blog", type: "rss", url: "https://www.crowdstrike.com/blog/feed/", category: "company", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Palo Alto Networks Blog", type: "rss", url: "https://www.paloaltonetworks.com/blog/rss", category: "company", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "SentinelOne Blog", type: "rss", url: "https://www.sentinelone.com/blog/feed/", category: "company", fetchIntervalMinutes: 240 },
    { id: uuid(), name: "Fortinet Blog", type: "rss", url: "https://feeds.fortinet.com/fortinet/blog/threat-research", category: "company", fetchIntervalMinutes: 240 },
    // ── Community ──────────────────────────────────────────────────
    { id: uuid(), name: "Hacker News", type: "hackernews", url: "https://hn.algolia.com/api/v1/search", category: "tech", fetchIntervalMinutes: 120 },
    { id: uuid(), name: "Reddit", type: "reddit", url: "https://www.reddit.com", category: "tech", fetchIntervalMinutes: 180 },
  ];

  const newSources = sources.filter((s) => !existingNames.has(s.name));

  if (newSources.length === 0) {
    return;
  }

  await db.insert(schema.sources).values(
    newSources.map((s) => ({
      ...s,
      enabled: true,
      createdAt: new Date().toISOString(),
    }))
  );

  console.log(`Seeded ${newSources.length} new sources (${existingSources.length} already existed)`);
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
