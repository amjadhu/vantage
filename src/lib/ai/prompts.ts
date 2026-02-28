import type { PersonaConfig } from "@/types";

export function buildEnrichmentPrompt(article: {
  title: string;
  content: string;
  source: string;
  publishedAt: string;
}, persona: PersonaConfig): string {
  const interestContext = persona.interestAreas
    .map((ia) => `${ia.topic} (weight: ${ia.weight})`)
    .join(", ");

  return `You are an intelligence analyst preparing a briefing for a technology executive.

Analyze the following article and produce a structured enrichment.

**Persona context:**
- Depth level: ${persona.depthLevel}
- Interest areas: ${interestContext}
- Company watchlist: ${persona.companyWatchlist.join(", ")}

**Article:**
- Title: ${article.title}
- Source: ${article.source}
- Published: ${article.publishedAt}
- Content: ${article.content.substring(0, 6000)}

**Instructions:**
Produce a JSON object with exactly these fields:
- "executiveSummary": A 2-3 sentence executive-level summary. Be concise and highlight what matters.
- "relevanceScore": A number 0-1 indicating relevance to this persona's interests. 1.0 = directly about their top interest area, 0 = completely irrelevant.
- "impactLevel": One of "critical", "high", "medium", "low", "informational"
- "sentiment": One of "positive", "negative", "neutral", "mixed"
- "entities": Array of { "name": string, "type": "company"|"person"|"technology"|"vulnerability"|"regulation"|"product" }
- "categoryTags": Array of short category tags (e.g. "ransomware", "AI", "cloud-security")
- "keyFacts": Array of 2-4 key facts or data points from the article
- "connectionHints": Array of 1-2 hints about what other topics/events this might connect to

Return ONLY valid JSON. No markdown, no explanation, no code fences.`;
}

export function buildBriefingPrompt(articles: Array<{
  title: string;
  summary: string;
  relevanceScore: number;
  impactLevel: string;
  source: string;
  url: string;
  categoryTags: string[];
}>, persona: PersonaConfig): string {
  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.impactLevel.toUpperCase()}] ${a.title} (${a.source})\n   Summary: ${a.summary}\n   Tags: ${a.categoryTags.join(", ")}\n   Relevance: ${a.relevanceScore}\n   URL: ${a.url}`)
    .join("\n\n");

  return `You are a senior intelligence analyst preparing a daily executive briefing.

**Persona:** Technology Executive — Cybersecurity Focus
**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

**Today's Intelligence (${articles.length} articles):**

${articleList}

**Instructions:**
Generate a structured daily briefing in markdown format. Use these sections:

## Key Takeaways
3-5 bullet points summarizing the most important developments.

## Critical Alerts
Any critical/high impact items requiring immediate attention. If none, say so.

## Top Stories
The 5-8 most significant stories with brief analysis of why they matter.

## Cyber Landscape
Overview of cybersecurity developments, threats, and trends.

## Company Watchlist
Updates relevant to: ${persona.companyWatchlist.join(", ")}. Note any competitive developments.

## Emerging Trends
Patterns or trends emerging from today's intelligence.

## Action Items
Specific recommendations or items requiring follow-up.

Write in a crisp, executive style. Be analytical, not just summarizing. Connect dots between stories where relevant. Include relevant URLs as markdown links.`;
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

  return `You are an intelligence analyst identifying connections between articles.

**Articles:**
${articleList}

**Instructions:**
Identify meaningful connections between these articles. For each connection, provide:
- "sourceArticleId": ID of the first article
- "targetArticleId": ID of the second article
- "relationshipType": One of "related", "follow-up", "contradicts", "caused-by"
- "reasoning": Brief explanation of the connection
- "confidence": Number 0-1

Return a JSON array of connections. Only include connections with confidence >= 0.5.
Return ONLY valid JSON. No markdown, no explanation.`;
}

export function buildAnalysisPrompt(topic: string, articles: Array<{
  title: string;
  summary: string;
  source: string;
}>, type: string): string {
  const articleList = articles
    .map((a) => `- ${a.title} (${a.source}): ${a.summary}`)
    .join("\n");

  return `You are a senior intelligence analyst producing a deep analysis report.

**Analysis type:** ${type}
**Topic:** ${topic}

**Supporting intelligence:**
${articleList}

**Instructions:**
Write a comprehensive analysis report in markdown format. Include:
1. Executive Summary
2. Detailed Analysis
3. Key Findings
4. Implications
5. Recommendations

Write in a professional, analytical style appropriate for a technology executive audience.
Be specific, cite sources where relevant, and provide actionable insights.`;
}
