import { prisma } from "@/lib/prisma";
import { searchPlaces, getPlaceDetail } from "@/lib/services/placesService";
import { classifyOpportunity } from "@/lib/services/opportunityService";
import { fetchHtml, extractEmail } from "@/lib/services/scraperService";

export interface PipelineInput {
  industry: string;
  location: string;
  radius: number; // meters
}

export interface PipelineResult {
  processed: number;
  created: number;
  updated: number;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { industry, location, radius } = input;

  const places = await searchPlaces(industry, location, radius);

  let processed = 0;
  let created = 0;
  let updated = 0;

  for (const place of places) {
    try {
      const detail = await getPlaceDetail(place.placeId);

      // Non-HTML responses (PDFs, redirects to binary content) cause fetchHtml to
      // return null. classifyOpportunity treats a null html value as WEAK_WEBSITE
      // by design for MVP — we cannot inspect the site but it does exist.
      const html = detail.website !== null ? await fetchHtml(detail.website) : null;

      const opportunity = classifyOpportunity(detail.website, html);

      const email = html !== null ? extractEmail(html) : null;

      const result = await prisma.company.upsert({
        where: { placeId: detail.placeId },
        create: {
          placeId: detail.placeId,
          name: detail.name,
          address: detail.address,
          industry,
          location,
          website: detail.website,
          hasWebsite: detail.website !== null,
          opportunity,
          email,
          phone: detail.phone,
        },
        update: {
          name: detail.name,
          address: detail.address,
          website: detail.website,
          hasWebsite: detail.website !== null,
          opportunity,
          email,
          phone: detail.phone,
        },
      });

      const wasCreated = result.createdAt.getTime() === result.updatedAt.getTime();
      if (wasCreated) {
        created += 1;
      } else {
        updated += 1;
      }

      processed += 1;
    } catch (err) {
      console.error(
        `[pipelineService] Failed to process place ${place.placeId} (${place.name}):`,
        err
      );
    }
  }

  return { processed, created, updated };
}
