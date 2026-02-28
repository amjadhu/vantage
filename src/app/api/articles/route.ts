import { NextResponse } from "next/server";
import { getArticlesWithEnrichments } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search") || undefined;

  const results = await getArticlesWithEnrichments({ limit, offset, search });

  return NextResponse.json({
    articles: results,
    count: results.length,
    offset,
    limit,
  });
}
