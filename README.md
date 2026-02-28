# Vantage

AI-powered intelligence dashboard that curates industry news, technology trends, and cybersecurity developments. Uses Claude for deep enrichment, cross-article connections, and daily briefing generation.

## Features

- **Daily Briefing** — AI-generated summary of the day's most important stories
- **Intel Feed** — All enriched articles with relevance scores, filterable by category/source/date
- **Cybersecurity** — Breaches, CVEs, CISA advisories, and threat intelligence with severity heatmap
- **Technology** — R&D breakthroughs, emerging tech, and industry news with topic breakdown
- **Trends** — Topic frequency tracking and AI-generated trend synthesis
- **Deep Analysis** — On-demand AI analyses (competitive, trend, threat, regulatory)
- **On-demand Pipeline** — Manual refresh with cost controls (2 runs/day limit)
- **Dark/Light Theme** — Toggleable from the top bar

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Drizzle ORM (Turso for production)
- **AI:** Anthropic Claude API (Sonnet for enrichment, Opus for briefing/analysis)
- **Deployment:** Vercel

## Data Sources

RSS feeds (TechCrunch, Ars Technica, The Verge, KrebsOnSecurity, BleepingComputer, Dark Reading, SecurityWeek, The Record, CrowdStrike Blog), Hacker News (Algolia API), Reddit (r/cybersecurity, r/netsec, r/technology), CISA KEV catalog, and NIST NVD CVE feed.

## Pipeline

```
Sources → Fetch → Normalize/Dedup → Store → AI Enrich → Connect → Briefing
```

All steps are on-demand only (no cron jobs). Triggered via the refresh button in the top bar or the Settings page.

## Setup

### Prerequisites

- Node.js 18+
- Anthropic API key
- Turso database (for production) or local SQLite

### Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=file:local.db          # Local SQLite, or libsql:// URL for Turso
DATABASE_AUTH_TOKEN=                 # Required for Turso only
ANTHROPIC_API_KEY=                  # Anthropic API key
CRON_SECRET=                        # Secret for cron API endpoints
```

### Install & Run

```bash
npm install
npm run dev
```

### Database

For local development, `DATABASE_URL=file:local.db` creates a SQLite file automatically. For production, use [Turso](https://turso.tech):

```bash
turso db create vantage
turso db show vantage --url     # Set as DATABASE_URL
turso db tokens create vantage  # Set as DATABASE_AUTH_TOKEN
npx drizzle-kit push            # Push schema to database
```

### Deploy to Vercel

```bash
vercel
vercel env add DATABASE_URL
vercel env add DATABASE_AUTH_TOKEN
vercel env add ANTHROPIC_API_KEY
vercel env add CRON_SECRET
vercel --prod
```

## Cost Controls

- All AI pipelines are on-demand only — no automatic cron runs
- Each pipeline step limited to 2 manual runs per day
- Refresh button shows a confirmation with remaining daily runs before executing
- Enrichment optimized to ~13K tokens per batch (~$0.13)
- Daily usage tracked and visible on the Settings page

## Project Structure

```
src/
  app/                    # Next.js pages + API routes + server actions
  components/             # React components (layout, ui, briefing, feed, cyber, etc.)
  lib/
    ai/                   # Anthropic client, prompts, response parsing
    db/                   # Drizzle schema, queries, client, seed data
    pipeline/             # Fetch, enrich, connect, briefing, analysis, usage tracking
      sources/            # Source connectors (RSS, HN, Reddit, CISA, NIST NVD)
```
