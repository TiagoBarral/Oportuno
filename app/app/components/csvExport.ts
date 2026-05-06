import type { Company } from "../types";

export const CSV_EXPORT_LIMIT  = 5000;
export const EXPORT_PAGE_SIZE  = 500;

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface CsvColumn {
  header: string;
  getValue: (c: Company) => string;
}

const CSV_COLUMNS: CsvColumn[] = [
  { header: "Nome",         getValue: (c) => c.name },
  { header: "Categoria",    getValue: (c) => c.category },
  { header: "Especialidade", getValue: (c) => c.specialty },
  { header: "Concelho",     getValue: (c) => c.municipality ?? "" },
  { header: "Website",      getValue: (c) => c.websiteUrl ?? "" },
  { header: "Email",        getValue: (c) => c.email ?? "" },
  { header: "Telefone",     getValue: (c) => c.phoneNumber ?? "" },
  { header: "Endereço",     getValue: (c) => c.address ?? "" },
];

// ---------------------------------------------------------------------------
// CSV utilities
// ---------------------------------------------------------------------------

function escapeCsvValue(value: string): string {
  // RFC 4180: wrap in double quotes, escape internal double quotes by doubling
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCsvString(companies: Company[]): string {
  const header = CSV_COLUMNS.map((col) => escapeCsvValue(col.header)).join(",");
  const rows = companies.map((company) =>
    CSV_COLUMNS.map((col) => escapeCsvValue(col.getValue(company))).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export function buildExportFilename(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
  return `oportuno-empresas-${yyyy}-${mm}-${dd}.csv`;
}

export function triggerCsvDownload(csv: string, filename: string): void {
  // UTF-8 BOM ensures Excel on Windows reads accented Portuguese characters correctly
  const BOM  = "﻿";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}
