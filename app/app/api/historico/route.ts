import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { EmailLogEntry, HistoricoResponse } from "@/app/types";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawPageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Math.min(500, Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : 20);
  const skip = (page - 1) * pageSize;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [total, logs, totalSent, totalFailed, sentThisMonth] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { name: true, municipality: true, category: true } },
        },
      }),
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.emailLog.count({ where: { status: "FAILED" } }),
      prisma.emailLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const items: EmailLogEntry[] = logs.map((log) => ({
      id: log.id,
      companyId: log.companyId,
      companyName: log.company.name,
      municipality: log.company.municipality,
      category: log.company.category,
      email: log.email,
      subject: log.subject,
      body: log.body,
      status: log.status,
      createdAt: log.createdAt.toISOString(),
    }));

    const response: HistoricoResponse = {
      items,
      total,
      page,
      pageSize,
      meta: {
        totalSent,
        totalFailed,
        sentThisMonth,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
