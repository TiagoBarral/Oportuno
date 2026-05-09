import { searchPlaces, getPlaceDetail } from "@/lib/services/placesService";
import { classifyOpportunity } from "@/lib/services/opportunityService";
import { classifyCategory } from "@/lib/services/categoryService";
import { classifySpecialty } from "@/lib/services/specialtyService";
import { fetchHtml, extractEmail } from "@/lib/services/scraperService";
import { persistCompany } from "@/lib/services/companyService";
import {
  claimNextJob,
  markJobDone,
  markJobFailed,
  seedPipelineCompanies,
  claimAllPendingCompanies,
  markCompanyDone,
  markCompanyFailed,
  getKnownCompanyMap,
} from "@/lib/services/pipelineJobService";
import { PORTUGUESE_CITIES, normaliseCityKey, computeGridPoints } from "@/lib/cities";
import type { PlaceBasic } from "@/lib/services/placesService";

const GRID_SPREAD_KM = 8;
const ENRICHMENT_CONCURRENCY = 15;

export async function runWorkerTick(targetJobId?: string): Promise<{
  jobId: string | null;
  processed: number;
  created: number;
  updated: number;
} | null> {
  const job = await claimNextJob(targetJobId);
  if (!job) return null;

  try {
    // --- Grid search ---
    const cityCoords = PORTUGUESE_CITIES[normaliseCityKey(job.location)];
    const merged = new Map<string, PlaceBasic>();

    if (cityCoords !== undefined) {
      const gridPoints = computeGridPoints(cityCoords.lat, cityCoords.lng, GRID_SPREAD_KM);
      const gridResults = await Promise.all(
        gridPoints.map((point) => searchPlaces(job.industry, job.location, GRID_SPREAD_KM * 1000, point))
      );
      for (const results of gridResults) {
        for (const p of results) {
          if (!merged.has(p.placeId)) merged.set(p.placeId, p);
        }
      }
      console.log(`[worker] grid search: ${merged.size} unique places from ${gridPoints.length} grid points`);
    } else {
      const results = await searchPlaces(job.industry, job.location, job.radius);
      for (const p of results) merged.set(p.placeId, p);
      console.log(`[worker] single search (no city coords): ${merged.size} places`);
    }

    const places = Array.from(merged.values());

    await seedPipelineCompanies(
      job.id,
      places.map((p) => ({ placeId: p.placeId, name: p.name }))
    );

    // --- Skip-known enrichment ---
    const allPlaceIds = places.map((p) => p.placeId);
    const knownCompanyMap = await getKnownCompanyMap(allPlaceIds);
    console.log(`[worker] skip-known: ${knownCompanyMap.size} already enriched, ${allPlaceIds.length - knownCompanyMap.size} new`);

    const jobLocation = job.location;
    const jobIndustry = job.industry;

    const { category, companySize } = await classifyCategory(jobIndustry);
    const specialty = await classifySpecialty(jobIndustry, category);
    console.log(`[worker] category: ${category} / specialty: ${specialty} / size: ${companySize}`);

    let processed = 0;
    let created = 0;
    let updated = 0;

    const pendingRows = await claimAllPendingCompanies(job.id);
    console.log(`[worker] enriching ${pendingRows.length} companies with concurrency=${ENRICHMENT_CONCURRENCY}`);

    const queue = [...pendingRows];

    async function processOne(companyRow: (typeof pendingRows)[0]) {
      try {
        const existingCompanyId = knownCompanyMap.get(companyRow.placeId);

        if (existingCompanyId !== undefined) {
          await markCompanyDone(companyRow.id, existingCompanyId);
          updated += 1;
          processed += 1;
          console.log(`[worker] skip (known): ${companyRow.name}`);
        } else {
          const detail = await getPlaceDetail(companyRow.placeId);
          const html = detail.website !== null ? await fetchHtml(detail.website) : null;
          const opportunity = classifyOpportunity(detail.website, html);
          const email = html !== null ? extractEmail(html) : null;

          const company = await persistCompany({
            placeId: detail.placeId,
            name: detail.name,
            address: detail.address ?? null,
            location: jobLocation,
            industry: jobIndustry,
            category,
            specialty,
            companySize,
            municipality: detail.municipality,
            rawMunicipality: detail.rawMunicipality,
            websiteUrl: detail.website ?? null,
            hasWebsite: detail.website !== null,
            opportunity,
            email,
            phoneNumber: detail.phone ?? null,
          });

          await markCompanyDone(companyRow.id, company.id);
          const wasCreated = company.createdAt.getTime() === company.updatedAt.getTime();
          if (wasCreated) created += 1;
          else updated += 1;
          processed += 1;
          console.log(`[worker] done: ${companyRow.name} (${processed}/${pendingRows.length})`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[worker] failed: ${companyRow.name} — ${message}`);
        await markCompanyFailed(companyRow.id, message);
      }
    }

    const workerCount = Math.min(ENRICHMENT_CONCURRENCY, pendingRows.length);
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        let row: (typeof pendingRows)[0] | undefined;
        while ((row = queue.shift()) !== undefined) {
          await processOne(row);
        }
      })
    );

    console.log(`[worker] markJobDone processed=${processed}`);
    await markJobDone(job.id);
    return { jobId: job.id, processed, created, updated };
  } catch (err) {
    console.error(`[pipelineService] Job ${job.id} failed:`, err);
    await markJobFailed(job.id);
    throw err;
  }
}
