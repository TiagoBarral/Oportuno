import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StatsResponse } from "@/app/types";

export async function GET(): Promise<NextResponse> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalCompanies, withEmail, withWebsite, withPhone, newThisMonth] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { email: { not: null } } }),
      prisma.company.count({ where: { hasWebsite: true } }),
      prisma.company.count({ where: { phoneNumber: { not: null } } }),
      prisma.company.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const response: StatsResponse = {
      totalCompanies,
      withEmail,
      withWebsite,
      withPhone,
      newThisMonth,
      recentSearches: [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
