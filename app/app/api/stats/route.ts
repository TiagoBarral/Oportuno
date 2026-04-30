import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StatsResponse } from "@/app/types";

export async function GET(): Promise<NextResponse> {
  try {
    const [totalCompanies, recentJobs] = await Promise.all([
      prisma.company.count(),
      prisma.pipelineJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          companies: {
            where: { companyId: { not: null } },
            select: { id: true },
          },
        },
      }),
    ]);

    const response: StatsResponse = {
      totalCompanies,
      recentSearches: recentJobs.map((job) => ({
        id: job.id,
        industry: job.industry,
        location: job.location,
        status: job.status,
        companyCount: job.companies.length,
        createdAt: job.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
