import { NextResponse } from "next/server";
import { generateTemplate } from "@/lib/services/templateGenerator";
import type { BulkEmailTemplateBrief, AIContextFile } from "@/app/types";

const VALID_TONS = new Set(["profissional", "amigavel", "direto"]);

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.oferta !== "string" || raw.oferta.trim() === "") {
    return NextResponse.json(
      { error: "oferta must be a non-empty string" },
      { status: 400 },
    );
  }
  if (raw.oferta.length > 300) {
    return NextResponse.json(
      { error: "oferta must be 300 characters or fewer" },
      { status: 400 },
    );
  }

  if (typeof raw.tom !== "string" || !VALID_TONS.has(raw.tom)) {
    return NextResponse.json(
      { error: "tom must be one of: profissional, amigavel, direto" },
      { status: 400 },
    );
  }

  if (raw.instrucoesAdicionais !== undefined) {
    if (typeof raw.instrucoesAdicionais !== "string") {
      return NextResponse.json(
        { error: "instrucoesAdicionais must be a string" },
        { status: 400 },
      );
    }
    if (raw.instrucoesAdicionais.length > 150) {
      return NextResponse.json(
        { error: "instrucoesAdicionais must be 150 characters or fewer" },
        { status: 400 },
      );
    }
  }

  // Validate optional AI context file
  let context: AIContextFile | undefined;
  if (raw.context !== undefined) {
    const c = raw.context as Record<string, unknown>;
    if (c.type !== "txt" && c.type !== "pdf") {
      return NextResponse.json(
        { error: "context.type must be 'txt' or 'pdf'" },
        { status: 400 },
      );
    }
    if (typeof c.filename !== "string" || c.filename.trim() === "") {
      return NextResponse.json(
        { error: "context.filename must be a non-empty string" },
        { status: 400 },
      );
    }
    if (typeof c.content !== "string" || c.content.trim() === "") {
      return NextResponse.json(
        { error: "context.content must be a non-empty string" },
        { status: 400 },
      );
    }
    if (c.content.length > 6_900_000) {
      return NextResponse.json(
        { error: "context.content exceeds the 5 MB limit" },
        { status: 400 },
      );
    }
    context = {
      type:     c.type as "txt" | "pdf",
      filename: c.filename.trim(),
      content:  c.content,
    };
  }

  const brief: BulkEmailTemplateBrief = {
    oferta: raw.oferta.trim(),
    tom:    raw.tom as BulkEmailTemplateBrief["tom"],
    ...(raw.instrucoesAdicionais !== undefined
      ? { instrucoesAdicionais: (raw.instrucoesAdicionais as string).trim() }
      : {}),
  };

  try {
    const result = await generateTemplate(brief, context);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
