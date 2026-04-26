import { NextResponse } from "next/server";
import { createOrGetJob } from "@/lib/services/pipelineJobService";

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
  const { industry, location, radius } = raw;

  if (typeof industry !== "string" || industry.trim() === "") {
    return NextResponse.json(
      { error: "industry must be a non-empty string" },
      { status: 400 }
    );
  }

  if (typeof location !== "string" || location.trim() === "") {
    return NextResponse.json(
      { error: "location must be a non-empty string" },
      { status: 400 }
    );
  }

  if (typeof radius !== "number" || radius <= 0 || radius > 50000) {
    return NextResponse.json(
      { error: "radius must be a positive number no greater than 50000" },
      { status: 400 }
    );
  }

  try {
    const { job, created } = await createOrGetJob({
      industry: industry.trim(),
      location: location.trim(),
      radius: Math.round(radius),
    });

    return NextResponse.json(
      { jobId: job.id, status: job.status, queued: created },
      { status: created ? 202 : 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
