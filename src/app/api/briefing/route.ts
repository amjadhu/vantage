import { NextResponse } from "next/server";
import { getLatestBriefing, getBriefings } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latest = searchParams.get("latest") === "true";

  if (latest) {
    const briefing = await getLatestBriefing();
    return NextResponse.json({ briefing });
  }

  const briefings = await getBriefings();
  return NextResponse.json({ briefings });
}
