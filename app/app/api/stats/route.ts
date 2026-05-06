import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StatsResponse } from "@/app/types";

export async function GET(): Promise<NextResponse> {
  try {
    const [totalCompanies, withEmail, withWebsite, withPhone] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { email: { not: null } } }),
      prisma.company.count({ where: { hasWebsite: true } }),
      prisma.company.count({ where: { phoneNumber: { not: null } } }),
    ]);

    const response: StatsResponse = {
      totalCompanies,
      withEmail,
      withWebsite,
      withPhone,
      recentSearches: [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
