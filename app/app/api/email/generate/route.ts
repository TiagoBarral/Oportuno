import { NextResponse } from "next/server";
import { generateEmail } from "@/lib/services/emailGenerator";

const VALID_OPPORTUNITY_TYPES = new Set(["NO_WEBSITE", "WEAK_WEBSITE"]);

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  const { companyName, industry, opportunityType, templateId } = raw;

  if (typeof companyName !== "string" || companyName.trim() === "") {
    return NextResponse.json(
      { error: "companyName must be a non-empty string" },
      { status: 400 },
    );
  }

  if (typeof industry !== "string" || industry.trim() === "") {
    return NextResponse.json(
      { error: "industry must be a non-empty string" },
      { status: 400 },
    );
  }

  if (
    typeof opportunityType !== "string" ||
    !VALID_OPPORTUNITY_TYPES.has(opportunityType)
  ) {
    return NextResponse.json(
      { error: "opportunityType must be one of: NO_WEBSITE, WEAK_WEBSITE" },
      { status: 400 },
    );
  }

  if (templateId !== undefined && typeof templateId !== "string") {
    return NextResponse.json(
      { error: "templateId must be a string" },
      { status: 400 },
    );
  }

  try {
    const result = await generateEmail({
      companyName,
      industry,
      opportunityType: opportunityType as "NO_WEBSITE" | "WEAK_WEBSITE",
      ...(templateId !== undefined ? { templateId } : {}),
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
