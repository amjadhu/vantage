"use server";

import { generateAnalysis } from "@/lib/pipeline/analysis";
import { checkDailyLimit, recordPipelineRun } from "@/lib/pipeline/usage";

type AnalysisResult = {
  success: boolean;
  message: string;
  analysisId?: string;
};

export async function requestAnalysis(
  topic: string,
  type: "competitive" | "trend" | "regulatory" | "threat"
): Promise<AnalysisResult> {
  if (!topic.trim()) {
    return { success: false, message: "Topic is required" };
  }

  const limit = await checkDailyLimit("analysis", "manual");
  if (!limit.allowed) {
    return {
      success: false,
      message: `Daily limit reached (${limit.used}/${limit.limit}). Try again tomorrow.`,
    };
  }

  try {
    const result = await generateAnalysis({ topic: topic.trim(), type });

    await recordPipelineRun({
      pipeline: "analysis",
      trigger: "manual",
      status: "success",
      tokenCount: result.totalTokens,
      itemsProcessed: 1,
    });

    return {
      success: true,
      message: "Analysis generated successfully",
      analysisId: result.analysisId,
    };
  } catch (error) {
    await recordPipelineRun({
      pipeline: "analysis",
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
