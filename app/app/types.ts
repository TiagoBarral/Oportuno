export type Opportunity = "NO_WEBSITE" | "WEAK_WEBSITE" | "NONE";

export interface Company {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  industry: string;
  location: string;
  category: string;
  specialty: string;
  municipality: string | null;
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

export interface NetworkingFilters {
  industry: string;
  municipality: string;
  category: string;
  specialty: string;
  opportunity: Opportunity | "";
  hasWebsite: "true" | "false" | "";
  hasEmail: "true" | "false" | "";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecentSearch {
  id: string;
  industry: string;
  location: string;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  companyCount: number;
  createdAt: string;
}

export interface StatsResponse {
  totalCompanies: number;
  recentSearches: RecentSearch[];
}
