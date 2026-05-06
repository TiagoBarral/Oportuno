import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SINGLETON_ID = "singleton";

export async function GET(): Promise<NextResponse> {
  try {
    const row = await prisma.userSettings.findFirst();
    if (row === null) {
      return NextResponse.json({ senderName: null, senderEmail: null }, { status: 200 });
    }
    return NextResponse.json({ senderName: row.senderName, senderEmail: row.senderEmail }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.senderName !== "string" || raw.senderName.trim() === "") {
    return NextResponse.json({ error: "senderName must be a non-empty string" }, { status: 400 });
  }
  if (raw.senderName.trim().length > 100) {
    return NextResponse.json({ error: "senderName must be 100 characters or fewer" }, { status: 400 });
  }

  if (typeof raw.senderEmail !== "string" || !EMAIL_PATTERN.test(raw.senderEmail.trim())) {
    return NextResponse.json({ error: "senderEmail must be a valid email address" }, { status: 400 });
  }

  const senderName = raw.senderName.trim();
  const senderEmail = raw.senderEmail.trim();

  try {
    const row = await prisma.userSettings.upsert({
      where: { id: SINGLETON_ID },
      update: { senderName, senderEmail },
      create: { id: SINGLETON_ID, senderName, senderEmail },
    });
    return NextResponse.json({ senderName: row.senderName, senderEmail: row.senderEmail }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
