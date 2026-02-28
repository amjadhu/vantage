import { NextResponse } from "next/server";
import { generateAnalysis } from "@/lib/pipeline/analysis";
import { getAnalyses } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const analyses = await getAnalyses();
  return NextResponse.json({ analyses });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, type } = body;

    if (!topic || !type) {
      return NextResponse.json(
        { error: "Missing required fields: topic, type" },
        { status: 400 }
      );
    }

    const validTypes = ["competitive", "trend", "regulatory", "threat"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await generateAnalysis({ topic, type });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API/Analysis] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
