import { NextResponse } from "next/server";
import { getWatchlistCompanies } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const companies = await getWatchlistCompanies();
  return NextResponse.json({ companies });
}
