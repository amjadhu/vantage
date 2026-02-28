import { NextResponse } from "next/server";
import { getArticlesWithEnrichments } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await getArticlesWithEnrichments({
    search: query,
    limit: 20,
  });

  return NextResponse.json({ results, query });
}
