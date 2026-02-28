import { v4 as uuid } from "uuid";
import { db, schema } from "@/lib/db/client";
import { eq, and, sql } from "drizzle-orm";

const DAILY_LIMITS: Record<string, { cron: number; manual: number }> = {
  fetch: { cron: 1, manual: 2 },
  enrich: { cron: 1, manual: 2 },
  connect: { cron: 1, manual: 2 },
  briefing: { cron: 1, manual: 2 },
  analysis: { cron: 0, manual: 2 },
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export async function checkDailyLimit(
  pipeline: string,
  trigger: "cron" | "manual"
): Promise<{ allowed: boolean; used: number; limit: number; message?: string }> {
  const today = getToday();
  const limits = DAILY_LIMITS[pipeline];
  if (!limits) {
    return { allowed: false, used: 0, limit: 0, message: `Unknown pipeline: ${pipeline}` };
  }

  const maxForTrigger = limits[trigger];

  // Count today's successful runs for this pipeline+trigger combo
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.pipelineRuns)
    .where(
      and(
        eq(schema.pipelineRuns.pipeline, pipeline),
        eq(schema.pipelineRuns.trigger, trigger),
        eq(schema.pipelineRuns.date, today),
        eq(schema.pipelineRuns.status, "success")
      )
    );

  const used = result[0]?.count || 0;

  if (used >= maxForTrigger) {
    return {
      allowed: false,
      used,
      limit: maxForTrigger,
      message: `Daily ${trigger} limit reached for ${pipeline}: ${used}/${maxForTrigger}`,
    };
  }

  return { allowed: true, used, limit: maxForTrigger };
}

export async function recordPipelineRun(opts: {
  pipeline: string;
  trigger: "cron" | "manual";
  status: "success" | "failed";
  tokenCount?: number;
  itemsProcessed?: number;
  errorMessage?: string;
}) {
  await db.insert(schema.pipelineRuns).values({
    id: uuid(),
    pipeline: opts.pipeline,
    trigger: opts.trigger,
    status: opts.status,
    tokenCount: opts.tokenCount || 0,
    itemsProcessed: opts.itemsProcessed || 0,
    errorMessage: opts.errorMessage || null,
    date: getToday(),
    createdAt: new Date().toISOString(),
  });
}

export async function getDailyUsageSummary() {
  const today = getToday();

  const runs = await db
    .select()
    .from(schema.pipelineRuns)
    .where(eq(schema.pipelineRuns.date, today));

  const summary: Record<string, { cronUsed: number; manualUsed: number; cronLimit: number; manualLimit: number; totalTokens: number }> = {};

  for (const [pipeline, limits] of Object.entries(DAILY_LIMITS)) {
    const pipelineRuns = runs.filter((r) => r.pipeline === pipeline && r.status === "success");
    summary[pipeline] = {
      cronUsed: pipelineRuns.filter((r) => r.trigger === "cron").length,
      manualUsed: pipelineRuns.filter((r) => r.trigger === "manual").length,
      cronLimit: limits.cron,
      manualLimit: limits.manual,
      totalTokens: pipelineRuns.reduce((sum, r) => sum + (r.tokenCount || 0), 0),
    };
  }

  return summary;
}
