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
  companySize: string;
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
  municipality: string;
  category: string;
  specialty: string;
  companySize: string;
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
  withEmail: number;
  withWebsite: number;
  withPhone: number;
  recentSearches?: RecentSearch[];
}

export interface EmailLogEntry {
  id: string;
  companyId: string;
  companyName: string;
  municipality: string | null;
  category: string;
  email: string;
  subject: string;
  body: string;
  status: "SENT" | "FAILED";
  createdAt: string;
}

export interface HistoricoMeta {
  totalSent: number;
  totalFailed: number;
  sentThisMonth: number;
}

export interface HistoricoResponse extends PaginatedResponse<EmailLogEntry> {
  meta: HistoricoMeta;
}

export interface UserSettings {
  senderName: string | null;
  senderEmail: string | null;
  senderProfile: string | null;
  attachmentFilename: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  oferta: string;
  tom: "profissional" | "amigavel" | "direto";
  instrucoesAdicionais: string | null;
  contextFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded file content
}

export interface AIContextFile {
  type: "txt" | "pdf";
  filename: string;
  content: string; // plain text for TXT, base64 for PDF
}

export interface BulkEmailTemplateBrief {
  oferta: string;
  tom: "profissional" | "amigavel" | "direto";
  instrucoesAdicionais?: string;
}

export interface BulkSendRecipient {
  companyId: string;
  name: string;
  municipality: string | null;
  category: string;
  email: string;
}

export interface BulkSendResult {
  companyId: string;
  name: string;
  email: string;
  success: boolean;
  emailLogId?: string;
  error?: string;
}
