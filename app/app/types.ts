export type Opportunity = "NO_WEBSITE" | "WEAK_WEBSITE" | "NONE";

export interface Company {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  industry: string;
  location: string;
  websiteUrl: string | null;
  hasWebsite: boolean;
  opportunity: Opportunity;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string; // ISO string after JSON serialization
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface Filters {
  industry: string;
  location: string;
  opportunity: Opportunity | "";
  hasWebsite: "true" | "false" | "";
}
