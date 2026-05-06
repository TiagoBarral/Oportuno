import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TOMS = new Set(["profissional", "amigavel", "direto"]);

export async function GET(): Promise<NextResponse> {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(templates, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
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

  if (typeof raw.name !== "string" || raw.name.trim() === "") {
    return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
  }
  if (raw.name.trim().length > 80) {
    return NextResponse.json({ error: "name must be 80 characters or fewer" }, { status: 400 });
  }

  if (typeof raw.subject !== "string" || raw.subject.trim() === "") {
    return NextResponse.json({ error: "subject must be a non-empty string" }, { status: 400 });
  }

  if (typeof raw.body !== "string" || raw.body.trim() === "") {
    return NextResponse.json({ error: "body must be a non-empty string" }, { status: 400 });
  }

  if (typeof raw.oferta !== "string" || raw.oferta.trim() === "") {
    return NextResponse.json({ error: "oferta must be a non-empty string" }, { status: 400 });
  }

  if (typeof raw.tom !== "string" || !VALID_TOMS.has(raw.tom)) {
    return NextResponse.json(
      { error: "tom must be one of: profissional, amigavel, direto" },
      { status: 400 },
    );
  }

  if (raw.instrucoesAdicionais !== undefined && raw.instrucoesAdicionais !== null) {
    if (typeof raw.instrucoesAdicionais !== "string") {
      return NextResponse.json({ error: "instrucoesAdicionais must be a string" }, { status: 400 });
    }
    if (raw.instrucoesAdicionais.length > 150) {
      return NextResponse.json(
        { error: "instrucoesAdicionais must be 150 characters or fewer" },
        { status: 400 },
      );
    }
  }

  try {
    const template = await prisma.emailTemplate.create({
      data: {
        name: raw.name.trim(),
        subject: raw.subject.trim(),
        body: raw.body.trim(),
        oferta: raw.oferta.trim(),
        tom: raw.tom,
        instrucoesAdicionais:
          typeof raw.instrucoesAdicionais === "string" && raw.instrucoesAdicionais.trim() !== ""
            ? raw.instrucoesAdicionais.trim()
            : null,
        contextFileName:
          typeof raw.contextFileName === "string" && raw.contextFileName.trim() !== ""
            ? raw.contextFileName.trim()
            : null,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
