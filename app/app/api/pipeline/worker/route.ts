import { NextResponse } from "next/server";
import { runWorkerTick } from "@/lib/services/pipelineService";

// Called by Vercel Cron or any external scheduler. Authorization is enforced
// via the CRON_SECRET header to prevent unauthenticated triggers.
export async function GET(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetJobId = searchParams.get("jobId") ?? undefined;
    const result = await runWorkerTick(targetJobId);

    if (result === null) {
      return NextResponse.json({ message: "No pending jobs" }, { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
