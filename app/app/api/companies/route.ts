import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Opportunity } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const VALID_OPPORTUNITIES = new Set<string>(
  Object.values(Opportunity) as string[],
);

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const industryParam = searchParams.get("industry");
  const locationParam = searchParams.get("location");
  const opportunityParam = searchParams.get("opportunity");
  const hasWebsiteParam = searchParams.get("hasWebsite");

  // Validate opportunity before touching the DB.
  if (opportunityParam !== null && opportunityParam !== "") {
    if (!VALID_OPPORTUNITIES.has(opportunityParam)) {
      return NextResponse.json(
        {
          error: `opportunity must be one of: ${[...VALID_OPPORTUNITIES].join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  const where: Prisma.CompanyWhereInput = {};

  if (industryParam !== null && industryParam !== "") {
    where.industry = industryParam;
  }

  if (locationParam !== null && locationParam !== "") {
    where.location = locationParam;
  }

  if (opportunityParam !== null && opportunityParam !== "") {
    where.opportunity = opportunityParam as Opportunity;
  }

  if (hasWebsiteParam === "true") {
    where.hasWebsite = true;
  } else if (hasWebsiteParam === "false") {
    where.hasWebsite = false;
  }

  try {
    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(companies, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
