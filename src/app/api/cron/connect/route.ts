import { NextResponse } from "next/server";
import { runConnectionPipeline } from "@/lib/pipeline/connect";
import { checkDailyLimit, recordPipelineRun } from "@/lib/pipeline/usage";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trigger = request.headers.get("x-trigger") === "manual" ? "manual" : "cron" as const;

  const limit = await checkDailyLimit("connect", trigger);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message, used: limit.used, limit: limit.limit }, { status: 429 });
  }

  try {
    const result = await runConnectionPipeline();

    await recordPipelineRun({
      pipeline: "connect",
      trigger,
      status: "success",
      tokenCount: result.totalTokens,
      itemsProcessed: result.connectionsFound,
    });

    return NextResponse.json({
      success: true,
      ...result,
      usage: { used: limit.used + 1, limit: limit.limit },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await recordPipelineRun({
      pipeline: "connect",
      trigger,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    console.error("[Cron/Connect] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
