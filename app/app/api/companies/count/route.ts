import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";

  if (!industry || !location) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  try {
    const count = await prisma.company.count({
      where: {
        industry: { equals: industry, mode: "insensitive" },
        location: { equals: location, mode: "insensitive" },
      },
    });
    return NextResponse.json({ count }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
