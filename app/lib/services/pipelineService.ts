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
  claimPendingCompany,
  markCompanyDone,
  markCompanyFailed,
  getKnownCompanyMap,
} from "@/lib/services/pipelineJobService";
import { PORTUGUESE_CITIES, normaliseCityKey, computeGridPoints } from "@/lib/cities";
import type { PlaceBasic } from "@/lib/services/placesService";

const GRID_SPREAD_KM = 8;

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
        gridPoints.map((point) => searchPlaces(job.industry, job.location, job.radius, point))
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

    const category = await classifyCategory(job.industry);
    const specialty = await classifySpecialty(job.industry, category);
    console.log(`[worker] category: ${category} / specialty: ${specialty}`);

    let processed = 0;
    let created = 0;
    let updated = 0;

    let companyRow = await claimPendingCompany(job.id);
    console.log(`[worker] first: ${companyRow?.name ?? "null"}`);
    while (companyRow !== null) {
      try {
        const existingCompanyId = knownCompanyMap.get(companyRow.placeId);

        if (existingCompanyId !== undefined) {
          // Company already enriched — skip API calls, just mark done
          await markCompanyDone(companyRow.id, existingCompanyId);
          updated += 1;
          processed += 1;
          console.log(`[worker] skip (known): ${companyRow.name}`);
        } else {
          // New company — run full enrichment
          const detail = await getPlaceDetail(companyRow.placeId);

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
            category,
            specialty,
            municipality: detail.municipality,
            rawMunicipality: detail.rawMunicipality,
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
          console.log(`[worker] done: ${companyRow.name} (${processed})`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[worker] failed: ${companyRow.name} — ${message}`);
        await markCompanyFailed(companyRow.id, message);
      }

      companyRow = await claimPendingCompany(job.id);
    }

    console.log(`[worker] markJobDone processed=${processed}`);
    await markJobDone(job.id);
    return { jobId: job.id, processed, created, updated };
  } catch (err) {
    console.error(`[pipelineService] Job ${job.id} failed:`, err);
    await markJobFailed(job.id);
    throw err;
  }
}
