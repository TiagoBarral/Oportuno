import { prisma } from "@/lib/prisma";
import { Opportunity, Company } from "@prisma/client";

export interface CompanyData {
  placeId:     string;
  name:        string;
  address:     string | null;
  location:    string;
  industry:    string;
  websiteUrl:  string | null;
  hasWebsite:  boolean;
  opportunity: Opportunity;
  email:       string | null;
  phoneNumber: string | null;
}

export async function persistCompany(data: CompanyData): Promise<Company> {
  return prisma.company.upsert({
    where: { placeId: data.placeId },

    create: {
      placeId:        data.placeId,
      name:           data.name,
      address:        data.address ?? undefined,
      location:       data.location,
      industry:       data.industry,
      websiteUrl:     data.websiteUrl,
      hasWebsite:     data.hasWebsite,
      opportunity:    data.opportunity,
      email:          data.email,
      phoneNumber:    data.phoneNumber,
      lastEnrichedAt: new Date(),
    },

    update: {
      // always update — classification improves over time
      opportunity:    data.opportunity,
      hasWebsite:     data.hasWebsite,
      lastEnrichedAt: new Date(),

      // non-identifying fields from Places API — safe to refresh
      address:  data.address ?? undefined,
      industry: data.industry,

      // null-guarded — never overwrite an existing value with null/empty
      websiteUrl:  data.websiteUrl  || undefined,
      email:       data.email       || undefined,
      phoneNumber: data.phoneNumber || undefined,

      // never updated: name, location, placeId
    },
  });
}
