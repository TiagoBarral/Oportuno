import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await prisma.emailLog.findMany({
      where: { status: "SENT" },
      distinct: ["companyId"],
      select: { companyId: true },
      take: 10000,
    });
    return NextResponse.json({ companyIds: rows.map((r) => r.companyId) }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
