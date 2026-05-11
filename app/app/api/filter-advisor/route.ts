import { NextResponse } from "next/server";
import { suggestFilters } from "@/lib/services/filterAdvisorService";
import type { FilterSuggestion } from "@/app/types";

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
  const { situation } = raw;

  if (
    typeof situation !== "string" ||
    situation.trim() === "" ||
    situation.length > 500
  ) {
    return NextResponse.json(
      {
        error:
          "situation must be a non-empty string with at most 500 characters",
      },
      { status: 400 }
    );
  }

  try {
    const suggestions: FilterSuggestion[] = await suggestFilters(
      situation.trim()
    );
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
