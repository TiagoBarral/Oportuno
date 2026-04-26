import { searchPlaces, getPlaceDetail } from "@/lib/services/placesService";
import { classifyOpportunity } from "@/lib/services/opportunityService";
import { fetchHtml, extractEmail } from "@/lib/services/scraperService";
import { persistCompany } from "@/lib/services/companyService";
import {
  claimNextJob,
  markJobDone,
  markJobFailed,
  seedPipelineCompanies,
  claimPendingCompany,
  markCompanyDone,
  markCompanyFailed,
} from "@/lib/services/pipelineJobService";

export async function runWorkerTick(): Promise<{
  jobId: string | null;
  processed: number;
  created: number;
  updated: number;
} | null> {
  const job = await claimNextJob();
  if (!job) return null;

  try {
    const places = await searchPlaces(job.industry, job.location, job.radius);
    await seedPipelineCompanies(
      job.id,
      places.map((p) => ({ placeId: p.placeId, name: p.name }))
    );

    let processed = 0;
    let created = 0;
    let updated = 0;

    let companyRow = await claimPendingCompany(job.id);
    while (companyRow !== null) {
      try {
        const detail = await getPlaceDetail(companyRow.placeId);

        // Non-HTML responses return null; classifyOpportunity treats null html as WEAK_WEBSITE
        const html =
          detail.website !== null ? await fetchHtml(detail.website) : null;

        const opportunity = classifyOpportunity(detail.website, html);
        const email = html !== null ? extractEmail(html) : null;

        const company = await persistCompany({
          placeId: detail.placeId,
          name: detail.name,
          address: detail.address ?? null,
          location: job.location,
          industry: job.industry,
          websiteUrl: detail.website ?? null,
          hasWebsite: detail.website !== null,
          opportunity,
          email,
          phoneNumber: detail.phone ?? null,
        });

        await markCompanyDone(companyRow.id, company.id);

        const wasCreated =
          company.createdAt.getTime() === company.updatedAt.getTime();
        if (wasCreated) created += 1;
        else updated += 1;

        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[pipelineService] Failed to process place ${companyRow.placeId} (${companyRow.name}):`,
          err
        );
        await markCompanyFailed(companyRow.id, message);
      }

      companyRow = await claimPendingCompany(job.id);
    }

    await markJobDone(job.id);
    return { jobId: job.id, processed, created, updated };
  } catch (err) {
    console.error(`[pipelineService] Job ${job.id} failed:`, err);
    await markJobFailed(job.id);
    throw err;
  }
}
