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
- "executiveSummary": 1-2 sentence summary of what matters
- "relevanceScore": 0-1 relevance to tech/cybersecurity/AI/cloud
- "impactLevel": "critical"|"high"|"medium"|"low"|"informational"
- "sentiment": "positive"|"negative"|"neutral"|"mixed"
- "entities": [{"name":"...","type":"company"|"person"|"technology"|"vulnerability"|"regulation"|"product"}] (max 5)
- "categoryTags": short tags, max 4 (e.g. "ransomware","AI","cloud")
- "keyFacts": 2-3 key facts

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
For each of the 5-8 most significant stories, write a **bold title** followed by 1-2 sentences of analysis on a new line. Separate stories with a blank line.

## Tech & Engineering Landscape
Key developments across software engineering, infrastructure, AI/ML, cloud, open source, and developer tools. What should builders and technical leaders pay attention to?

## Cybersecurity Update
Threat landscape, vulnerabilities, breaches, and security tooling updates.

## Emerging Trends
Patterns emerging across today's intelligence. What's gaining momentum?

## Action Items
A numbered list of specific, actionable items. Each on its own line:
1. First action item
2. Second action item
3. Third action item

Write in a crisp, analytical style. Connect dots between stories. Include URLs as markdown links where relevant. Focus on technical depth and engineering implications, not just business summaries.`;
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
