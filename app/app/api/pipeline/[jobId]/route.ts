import { NextResponse } from "next/server";
import { getJobProgress } from "@/lib/services/pipelineJobService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const { jobId } = await params;

  const progress = await getJobProgress(jobId);

  if (!progress) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(progress, { status: 200 });
}
