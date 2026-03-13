import type { PersonaConfig } from "@/types";

export function buildEnrichmentPrompt(article: {
  title: string;
  content: string;
  source: string;
  publishedAt: string;
}): string {
  return `Analyze this article and return a JSON enrichment.

Title: ${article.title}
Source: ${article.source}
Published: ${article.publishedAt}
Content: ${article.content.substring(0, 3000)}

Return JSON with these fields:
- "executiveSummary": 1-2 sentence summary of what matters and why a tech/security leader should care
- "relevanceScore": 0-1 composite score based on:
    * Actionability (0.3 weight): Does this require action or awareness? Breaking vulns, new regulations, major launches score high.
    * Timeliness (0.25 weight): How time-sensitive? Active exploits and breaking news score highest. Evergreen content scores lower.
    * Impact breadth (0.25 weight): How many orgs/people affected? Industry-wide > niche.
    * Strategic value (0.2 weight): Long-term importance for tech strategy, security posture, or competitive landscape.
  Score conservatively: reserve 0.9+ for truly critical/breaking items. Most solid news = 0.5-0.7. Routine updates = 0.2-0.4.
- "impactLevel": "critical"|"high"|"medium"|"low"|"informational"
    * critical: Active exploitation, major breach, urgent patch needed
    * high: Significant vulnerability, major product launch, important policy change
    * medium: Notable development, meaningful update
    * low: Incremental update, routine announcement
    * informational: Background/context, opinion, general interest
- "sentiment": "positive"|"negative"|"neutral"|"mixed"
- "entities": [{"name":"...","type":"company"|"person"|"technology"|"vulnerability"|"regulation"|"product"}] (max 5)
- "categoryTags": short tags, max 4 (e.g. "ransomware","AI","cloud","zero-day")
- "keyFacts": 2-3 key facts — specific and concrete (numbers, names, dates), not vague summaries

Return ONLY valid JSON. No markdown, no explanation.`;
}

export function buildBriefingPrompt(articles: Array<{
  title: string;
  summary: string;
  relevanceScore: number;
  impactLevel: string;
  source: string;
  url: string;
  categoryTags: string[];
}>): string {
  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.impactLevel.toUpperCase()}] ${a.title} (${a.source})\n   ${a.summary}\n   Tags: ${a.categoryTags.join(", ")}\n   ${a.url}`)
    .join("\n\n");

  return `You are a senior technology analyst writing a daily intelligence briefing for engineers and tech leaders.

**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

**Today's Intelligence (${articles.length} articles):**

${articleList}

**Instructions:**
Generate a daily tech intelligence briefing in markdown. Use these exact sections:

## Key Takeaways
- 3-5 bullet points on the most important tech developments today. Each on its own line starting with "- ".

## Critical Alerts
- Any critical/high impact security or infrastructure items. Each on its own line starting with "- ". If none, write "No critical alerts today."

## Top Stories
For each of the 5-8 most significant stories, write a **bold title** followed by 1-2 sentences of analysis on a new line. Include a "Source:" line with a markdown link to the original article. Separate stories with a blank line.

Example format:
**Story Title**
Analysis of the story and its implications.
Source: [Article Title](https://example.com/article)

## Tech & Engineering Landscape
Key developments across software engineering, infrastructure, AI/ML, cloud, open source, and developer tools. What should builders and technical leaders pay attention to? Cite sources inline as markdown links.

## Cybersecurity Update
Threat landscape, vulnerabilities, breaches, and security tooling updates. Cite sources inline as markdown links.

## Emerging Trends
Patterns emerging across today's intelligence. What's gaining momentum? Cite sources inline as markdown links.

## Action Items
A numbered list of specific, actionable items. Each on its own line:
1. First action item
2. Second action item
3. Third action item

## Sources
List all articles referenced in this briefing as markdown links, grouped by section. Format each as "- [Article Title](URL) — Source Name".

**IMPORTANT:** You MUST include source references throughout the briefing. Every claim, story, or insight should be traceable to its source article via a markdown link. The reader should be able to click through to verify any point. Use the URLs provided in the article list above.

Write in a crisp, analytical style. Connect dots between stories. Focus on technical depth and engineering implications, not just business summaries.`;
}

export function buildGlobalNewsBriefingPrompt(articles: Array<{
  title: string;
  summary: string;
  source: string;
  url: string;
}>): string {
  const articleList = articles
    .map((a, i) => `${i + 1}. ${a.title} (${a.source})\n   ${a.summary}\n   ${a.url}`)
    .join("\n\n");

  return `You are an impartial planetary observer — think of yourself as an alien species studying Earth. Your job is to synthesize a global intelligence briefing that is non-US-centric, geographically diverse, and analytically opinionated. Cover all regions and topics without over-weighting any single source or nation.

**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

**Raw Intelligence (${articles.length} articles from diverse global sources):**

${articleList}

**Instructions:**
Generate a concise global intelligence briefing in markdown (1-2 pages max). Use these exact sections:

## Key Global Developments
- 3-5 bullet points on the most consequential developments worldwide. Prioritize by global impact, not media volume.

## Regional Spotlight
Pick 2-3 regions with the most significant developments today. For each, write a short paragraph with context and source links.

## Geopolitics & Conflict
Active conflicts, diplomatic shifts, alliance dynamics, sanctions. Skip if nothing notable. Cite sources inline.

## Economy & Trade
Global economic signals, trade policy, supply chains, commodity shifts. Cite sources inline.

## Science & Environment
Climate, health, scientific breakthroughs with global implications. Skip if nothing notable. Cite sources inline.

## Emerging Signals
Weak signals or under-covered stories that could become significant. 2-3 bullets max.

## Sources
List all articles referenced as markdown links: "- [Article Title](URL) — Source Name"

**IMPORTANT:** Every claim must have an inline source link. The reader should be able to verify any point. Be analytically opinionated — don't just summarize, connect dots and highlight what matters. Keep it concise: 1-2 pages maximum.`;
}

export function buildResearchBriefingPrompt(articles: Array<{
  title: string;
  summary: string;
  keyFacts: string[];
  tags: string[];
  source: string;
  url: string;
}>): string {
  const articleList = articles
    .map((a, i) => `${i + 1}. ${a.title} (${a.source})\n   Summary: ${a.summary}\n   Key facts: ${a.keyFacts.join("; ")}\n   Tags: ${a.tags.join(", ")}\n   ${a.url}`)
    .join("\n\n");

  return `You are a senior R&D analyst synthesizing a cross-domain research intelligence briefing for technology leaders and strategists. Your coverage spans AI/ML, semiconductors, quantum computing, biotechnology, materials science, energy, robotics, space, networking, and general science.

**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

**Research Intelligence (${articles.length} papers/articles from diverse R&D sources):**

${articleList}

**Instructions:**
Generate a research intelligence briefing in markdown. Use these exact sections:

## Key Breakthroughs
- 3-5 genuinely novel developments that represent meaningful advances. Not incremental updates — things that shift what's possible. Each on its own line starting with "- ". Cite sources inline.

## Cross-Domain Connections
Identify 2-3 patterns spanning fields. For example: ML techniques applied to materials discovery, quantum approaches to biotech problems, semiconductor advances enabling new AI architectures. These are the insights a domain specialist would miss. Cite sources inline.

## Deep Dives
4-6 of the most impactful papers/developments with real analysis. For each:
- **Bold title**
- Why it matters (not just what it says)
- Technical significance and limitations
- Source: [Article Title](URL)

Separate each with a blank line.

## Strategic Implications
What do these developments mean for tech strategy and R&D investment? Connect the dots between research and commercial impact. 3-5 bullet points. Cite sources inline.

## Emerging Research Signals
2-3 weak signals worth monitoring — early-stage work that could become significant in 6-18 months. Cite sources inline.

## Sources
List all articles referenced as markdown links: "- [Article Title](URL) — Source Name"

**IMPORTANT:** Every claim must have an inline source link. Be analytically opinionated — don't just summarize, synthesize across domains and highlight what matters. Focus on technical depth, not hype.`;
}

export function buildCrowdStrikeBriefingPrompt(articles: Array<{
  title: string;
  summary: string;
  source: string;
  url: string;
  impactLevel?: string;
  tags?: string[];
}>): string {
  const articleList = articles
    .map((a, i) => `${i + 1}. ${a.impactLevel ? `[${a.impactLevel.toUpperCase()}] ` : ""}${a.title} (${a.source})\n   ${a.summary}${a.tags?.length ? `\n   Tags: ${a.tags.join(", ")}` : ""}\n   ${a.url}`)
    .join("\n\n");

  return `You are a senior equity analyst and cybersecurity strategist tracking CrowdStrike (CRWD). Synthesize the latest intelligence into a concise daily briefing for an executive who follows this company closely.

**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

**CrowdStrike Intelligence (${articles.length} articles):**

${articleList}

**Instructions:**
Generate a focused CrowdStrike briefing in markdown. Use these exact sections:

## What Happened
- 3-5 bullets on the most material developments. Lead with the biggest deal. Each on its own line starting with "- ". Cite sources inline as markdown links.

## Market & Competitive Signal
Stock/earnings/analyst moves, competitive positioning vs. SentinelOne, Palo Alto, Microsoft. Skip if nothing notable. Cite sources inline.

## Product & Threat Intel
Product updates, new threat research from CrowdStrike or about threats relevant to their platform, technical developments. Skip if nothing notable. Cite sources inline.

## So What
- 2-3 bullets connecting the dots — what does this mean strategically for CrowdStrike's position, growth trajectory, or risk profile? Each on its own line starting with "- ".

## Sources
List all articles referenced as markdown links: "- [Article Title](URL) — Source Name"

**IMPORTANT:** Every claim must have an inline source link. Keep it tight — under 1 page. Every sentence should earn its place.`;
}

export function buildConnectionPrompt(articles: Array<{
  id: string;
  title: string;
  summary: string;
  categoryTags: string[];
}>): string {
  const articleList = articles
    .map((a) => `- ID: ${a.id}\n  Title: ${a.title}\n  Summary: ${a.summary}\n  Tags: ${a.categoryTags.join(", ")}`)
    .join("\n\n");

  return `Identify connections between these articles.

${articleList}

For each connection return:
- "sourceArticleId": ID of first article
- "targetArticleId": ID of second article
- "relationshipType": "related"|"follow-up"|"contradicts"|"caused-by"
- "reasoning": Brief explanation
- "confidence": 0-1

Return a JSON array. Only confidence >= 0.5. Return ONLY valid JSON.`;
}

export function buildAnalysisPrompt(topic: string, articles: Array<{
  title: string;
  summary: string;
  source: string;
}>, type: string): string {
  const articleList = articles
    .map((a) => `- ${a.title} (${a.source}): ${a.summary}`)
    .join("\n");

  return `Write a deep analysis report on the following topic.

**Analysis type:** ${type}
**Topic:** ${topic}

**Supporting intelligence:**
${articleList}

Write in markdown with these sections:
1. Executive Summary
2. Detailed Analysis
3. Key Findings
4. Implications
5. Recommendations

Focus on technical depth and engineering implications. Be specific and cite sources.`;
}
