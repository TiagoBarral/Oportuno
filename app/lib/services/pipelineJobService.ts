import { prisma } from "@/lib/prisma";
import { CompanyStatus, PipelineJob } from "@prisma/client";

export interface CreateJobInput {
  industry: string;
  location: string;
  radius: number;
}

export async function createOrGetJob(
  input: CreateJobInput
): Promise<{ job: PipelineJob; created: boolean }> {
  const { industry, location, radius } = input;

  try {
    const job = await prisma.pipelineJob.create({
      data: { industry, location, radius, status: "PENDING" },
    });
    return { job, created: true };
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code !== "P2002") throw err;

    const job = await prisma.pipelineJob.findUniqueOrThrow({
      where: { industry_location: { industry, location } },
    });
    return { job, created: false };
  }
}

export async function resetJobToPending(jobId: string): Promise<void> {
  await prisma.pipelineCompany.deleteMany({ where: { jobId } });
  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: { status: "PENDING", startedAt: null, finishedAt: null },
  });
}

export async function claimNextJob(targetJobId?: string): Promise<PipelineJob | null> {
  // Recover any job stuck in RUNNING for more than 10 minutes
  await prisma.pipelineJob.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
    },
    data: { status: "PENDING", startedAt: null },
  });

  const job = await prisma.pipelineJob.findFirst({
    where: targetJobId
      ? { id: targetJobId, status: "PENDING" }
      : { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return null;

  await prisma.pipelineJob.update({
    where: { id: job.id },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  return job;
}

export async function markJobDone(jobId: string): Promise<void> {
  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: { status: "DONE", finishedAt: new Date() },
  });
}

export async function markJobFailed(jobId: string): Promise<void> {
  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: { status: "FAILED", finishedAt: new Date() },
  });
}

export async function seedPipelineCompanies(
  jobId: string,
  places: Array<{ placeId: string; name: string }>
): Promise<void> {
  await prisma.pipelineCompany.createMany({
    data: places.map((p) => ({
      jobId,
      placeId: p.placeId,
      name: p.name,
      status: "PENDING",
    })),
    skipDuplicates: true,
  });
}

export async function claimAllPendingCompanies(jobId: string) {
  const rows = await prisma.pipelineCompany.findMany({
    where: { jobId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length === 0) return [];

  await prisma.pipelineCompany.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { status: "PROCESSING" },
  });

  return rows;
}

export async function markCompanyDone(id: string, companyId: string): Promise<void> {
  await prisma.pipelineCompany.update({
    where: { id },
    data: { status: "DONE", companyId },
  });
}

export async function markCompanyFailed(
  id: string,
  error: string
): Promise<void> {
  await prisma.pipelineCompany.update({
    where: { id },
    data: { status: "FAILED", error },
  });
}

export async function getKnownCompanyMap(placeIds: string[]): Promise<Map<string, string>> {
  if (placeIds.length === 0) return new Map();
  const rows = await prisma.company.findMany({
    where: { placeId: { in: placeIds } },
    select: { placeId: true, id: true },
  });
  return new Map(rows.map((r) => [r.placeId, r.id]));
}

export async function getJobProgress(jobId: string) {
  const job = await prisma.pipelineJob.findUnique({ where: { id: jobId } });
  if (!job) return null;

  const counts = await prisma.pipelineCompany.groupBy({
    by: ["status"],
    where: { jobId },
    _count: true,
  });

  const byStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count])
  ) as Partial<Record<CompanyStatus, number>>;

  const total =
    (byStatus.PENDING ?? 0) +
    (byStatus.PROCESSING ?? 0) +
    (byStatus.DONE ?? 0) +
    (byStatus.FAILED ?? 0);

  return {
    id: job.id,
    status: job.status,
    industry: job.industry,
    location: job.location,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    progress: {
      total,
      pending: byStatus.PENDING ?? 0,
      processing: byStatus.PROCESSING ?? 0,
      done: byStatus.DONE ?? 0,
      failed: byStatus.FAILED ?? 0,
    },
  };
}
