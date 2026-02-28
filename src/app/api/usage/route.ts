import { NextResponse } from "next/server";
import { getDailyUsageSummary } from "@/lib/pipeline/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await getDailyUsageSummary();
  return NextResponse.json({ date: new Date().toISOString().split("T")[0], usage: summary });
}
