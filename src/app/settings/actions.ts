"use server";

import { runFetchPipeline } from "@/lib/pipeline/orchestrator";
import { runEnrichmentPipeline } from "@/lib/pipeline/enrich";
import { runConnectionPipeline } from "@/lib/pipeline/connect";
import { runBriefingPipeline } from "@/lib/pipeline/briefing";
import { seedAll } from "@/lib/db/seed";
import { checkDailyLimit, recordPipelineRun, getDailyUsageSummary } from "@/lib/pipeline/usage";

export async function getRefreshStatus(): Promise<{
  runsUsed: number;
  runsLimit: number;
}> {
  const usage = await getDailyUsageSummary();
  // The limiting factor is the step with the most usage
  const enrichUsage = usage.enrich;
  return {
    runsUsed: enrichUsage.manualUsed + enrichUsage.cronUsed,
    runsLimit: enrichUsage.manualLimit,
  };
}

type PipelineResult = {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
};

export async function runPipelineStep(
  step: "fetch" | "enrich" | "connect" | "briefing"
): Promise<PipelineResult> {
  const limit = await checkDailyLimit(step, "manual");
  if (!limit.allowed) {
    return {
      success: false,
      message: `Daily limit reached (${limit.used}/${limit.limit}). Try again tomorrow.`,
    };
  }

  try {
    let details: Record<string, unknown> = {};

    switch (step) {
      case "fetch": {
        await seedAll();
        const result = await runFetchPipeline();
        details = { articlesInserted: result.totalInserted, totalFetched: result.totalFetched };
        await recordPipelineRun({ pipeline: "fetch", trigger: "manual", status: "success", itemsProcessed: result.totalInserted });
        break;
      }
      case "enrich": {
        const result = await runEnrichmentPipeline({ limit: 20 });
        details = { enriched: result.enriched, tokens: result.totalTokens };
        await recordPipelineRun({ pipeline: "enrich", trigger: "manual", status: "success", tokenCount: result.totalTokens, itemsProcessed: result.enriched });
        break;
      }
      case "connect": {
        const result = await runConnectionPipeline();
        details = { connectionsFound: result.connectionsFound, tokens: result.totalTokens };
        await recordPipelineRun({ pipeline: "connect", trigger: "manual", status: "success", tokenCount: result.totalTokens, itemsProcessed: result.connectionsFound });
        break;
      }
      case "briefing": {
        const result = await runBriefingPipeline();
        details = { articleCount: result.articleCount, tokens: result.totalTokens };
        await recordPipelineRun({ pipeline: "briefing", trigger: "manual", status: "success", tokenCount: result.totalTokens, itemsProcessed: result.articleCount });
        break;
      }
    }

    return { success: true, message: `${step} completed successfully`, details };
  } catch (error) {
    await recordPipelineRun({
      pipeline: step,
      trigger: "manual",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
