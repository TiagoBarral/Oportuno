import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FRESHNESS_DAYS = 7;

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim() ?? "";
  const locationsParam = searchParams.get("locations")?.trim() ?? "";

  const locations = locationsParam
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!industry || locations.length === 0) {
    return NextResponse.json({ fresh: [] }, { status: 200 });
  }

  const cutoff = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000);

  try {
    const rows = await prisma.company.groupBy({
      by: ["location"],
      where: {
        industry: { equals: industry, mode: "insensitive" },
        location: { in: locations, mode: "insensitive" },
        lastEnrichedAt: { gte: cutoff },
      },
      _count: { id: true },
    });

    const fresh = rows.map((r) => r.location);
    return NextResponse.json({ fresh }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
