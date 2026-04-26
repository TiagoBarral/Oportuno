import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/services/emailService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { companyId, to, subject, body: emailBody } = raw;

  if (typeof companyId !== "string" || companyId.trim() === "") {
    return NextResponse.json(
      { error: "companyId must be a non-empty string" },
      { status: 400 },
    );
  }

  if (
    typeof to !== "string" ||
    to.trim() === "" ||
    !EMAIL_PATTERN.test(to)
  ) {
    return NextResponse.json(
      { error: "to must be a valid email address" },
      { status: 400 },
    );
  }

  if (typeof subject !== "string" || subject.trim() === "") {
    return NextResponse.json(
      { error: "subject must be a non-empty string" },
      { status: 400 },
    );
  }

  if (typeof emailBody !== "string" || emailBody.trim() === "") {
    return NextResponse.json(
      { error: "body must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (company === null) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const result = await sendEmail({ companyId, to, subject, body: emailBody });
    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
