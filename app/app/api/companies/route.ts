import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Opportunity } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { CATEGORIES } from "@/lib/categories";
import { SPECIALTIES } from "@/lib/specialties";

const VALID_OPPORTUNITIES = new Set<string>(
  Object.values(Opportunity) as string[],
);
const VALID_CATEGORIES = new Set<string>(CATEGORIES);
const ALL_SPECIALTIES = new Set<string>(Object.values(SPECIALTIES).flat());

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const jobIdParam        = searchParams.get("jobId");
  const industryParam     = searchParams.get("industry");
  const locationParam     = searchParams.get("location");
  const municipalityParam = searchParams.get("municipality");
  const categoryParam     = searchParams.get("category");
  const specialtyParam    = searchParams.get("specialty");
  const opportunityParam  = searchParams.get("opportunity");
  const hasWebsiteParam   = searchParams.get("hasWebsite");
  const hasEmailParam     = searchParams.get("hasEmail");
  const pageParam         = searchParams.get("page");
  const pageSizeParam     = searchParams.get("pageSize");

  // Validate enum-like params before touching the DB.
  if (opportunityParam !== null && opportunityParam !== "") {
    if (!VALID_OPPORTUNITIES.has(opportunityParam)) {
      return NextResponse.json(
        { error: `opportunity must be one of: ${[...VALID_OPPORTUNITIES].join(", ")}` },
        { status: 400 },
      );
    }
  }

  if (categoryParam !== null && categoryParam !== "") {
    if (!VALID_CATEGORIES.has(categoryParam)) {
      return NextResponse.json(
        { error: `category must be one of: ${CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }
  }

  if (specialtyParam !== null && specialtyParam !== "") {
    if (!ALL_SPECIALTIES.has(specialtyParam)) {
      return NextResponse.json(
        { error: "specialty is not a recognised value" },
        { status: 400 },
      );
    }
  }

  try {
    // Job-scoped fetch: return companies linked to a specific pipeline run.
    if (jobIdParam !== null && jobIdParam !== "") {
      const companies = await prisma.company.findMany({
        where: {
          pipelineEntries: { some: { jobId: jobIdParam, status: "DONE" } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(companies, { status: 200 });
    }

    // Global search: filter the full Company directory (case-insensitive).
    const where: Prisma.CompanyWhereInput = {};

    if (industryParam !== null && industryParam !== "") {
      where.industry = { equals: industryParam, mode: "insensitive" };
    }

    if (locationParam !== null && locationParam !== "") {
      where.location = { equals: locationParam, mode: "insensitive" };
    }

    if (municipalityParam !== null && municipalityParam !== "") {
      where.municipality = { equals: municipalityParam, mode: "insensitive" };
    }

    if (categoryParam !== null && categoryParam !== "") {
      where.category = { equals: categoryParam, mode: "insensitive" };
    }

    if (specialtyParam !== null && specialtyParam !== "") {
      where.specialty = { equals: specialtyParam, mode: "insensitive" };
    }

    if (opportunityParam !== null && opportunityParam !== "") {
      where.opportunity = opportunityParam as Opportunity;
    }

    if (hasWebsiteParam === "true") {
      where.hasWebsite = true;
    } else if (hasWebsiteParam === "false") {
      where.hasWebsite = false;
    }

    if (hasEmailParam === "true") {
      where.email = { not: null };
    } else if (hasEmailParam === "false") {
      where.email = null;
    }

    const rawPage     = parseInt(pageParam     ?? "1",  10);
    const rawPageSize = parseInt(pageSizeParam ?? "20", 10);
    const page     = Math.max(1, isNaN(rawPage)     ? 1  : rawPage);
    const pageSize = Math.min(100, Math.max(1, isNaN(rawPageSize) ? 20 : rawPageSize));
    const skip = (page - 1) * pageSize;

    const orderBy = { createdAt: "desc" } as const;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({ where, orderBy, skip, take: pageSize }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({ items: companies, total, page, pageSize }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
