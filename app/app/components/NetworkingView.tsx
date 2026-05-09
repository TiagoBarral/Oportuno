"use client";

import { useState, useEffect, useRef } from "react";
import type { Company, NetworkingFilters, PaginatedResponse } from "../types";
import { IconPaperPlane } from "./shared";
import {
  DISTRICT_OPTIONS,
  findDistrictForMunicipality,
  getMunicipalitiesForDistrict,
  getParishesForMunicipality,
} from "@/lib/cities";
import { CATEGORIES } from "@/lib/categories";
import { SPECIALTIES } from "@/lib/specialties";
import { buildCsvString, buildExportFilename, triggerCsvDownload, CSV_EXPORT_LIMIT, EXPORT_PAGE_SIZE } from "./csvExport";

interface NetworkingViewProps {
  selectedCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  onContactar: (companies: Company[]) => void;
  initialFilters?: Partial<NetworkingFilters>;
}

interface LocationSelection {
  district: string;
  municipality: string;
  parish: string;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function avatarColor(name: string): string {
  const code = name.trim().charCodeAt(0) ?? 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length] ?? "bg-blue-500";
}

const FILTER_LABELS: Partial<Record<keyof NetworkingFilters, (v: string) => string>> = {
  municipality: (v) => `Concelho: ${v}`,
  category: (v) => `Categoria: ${v}`,
  specialty: (v) => `Especialidade: ${v}`,
  companySize: (v) => `Dimensão: ${v}`,
  hasWebsite: (v) => v === "true" ? "Com website" : "Sem website",
  hasEmail: (v) => v === "true" ? "Com email" : "Sem email",
};

const SIZE_BADGE: Record<string, string> = {
  Pequena: "bg-emerald-50 text-emerald-700",
  Média: "bg-blue-50 text-blue-700",
  Grande: "bg-violet-50 text-violet-700",
};

function SizeBadge({ size }: { size: string }) {
  const cls = SIZE_BADGE[size] ?? "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {size}
    </span>
  );
}

function companyInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const EMPTY_FILTERS: NetworkingFilters = {
  municipality: "",
  category: "",
  specialty: "",
  companySize: "",
  opportunity: "",
  hasWebsite: "",
  hasEmail: "",
};

const EMPTY_LOCATION_SELECTION: LocationSelection = {
  district: "",
  municipality: "",
  parish: "",
};

function initialLocationSelection(municipality?: string): LocationSelection {
  if (!municipality) return EMPTY_LOCATION_SELECTION;
  return {
    district: findDistrictForMunicipality(municipality),
    municipality,
    parish: "",
  };
}

function municipalityScopeFor(selection: LocationSelection): string[] {
  if (selection.municipality) return [selection.municipality];
  if (selection.district) return getMunicipalitiesForDistrict(selection.district);
  return [];
}

function addCompanyFilterParams(
  params: URLSearchParams,
  currentFilters: NetworkingFilters,
  locationSelection: LocationSelection,
) {
  const municipalities = municipalityScopeFor(locationSelection);
  if (municipalities.length === 1) params.set("municipality", municipalities[0]);
  if (municipalities.length > 1) params.set("municipalities", municipalities.join(","));
  if (currentFilters.category)    params.set("category", currentFilters.category);
  if (currentFilters.specialty)   params.set("specialty", currentFilters.specialty);
  if (currentFilters.companySize) params.set("companySize", currentFilters.companySize);
  if (currentFilters.hasWebsite)  params.set("hasWebsite", currentFilters.hasWebsite);
  if (currentFilters.hasEmail)    params.set("hasEmail", currentFilters.hasEmail);
}

function buildPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  const low = Math.max(2, current - 2);
  const high = Math.min(total - 1, current + 2);
  if (low > 2) pages.push("...");
  for (let p = low; p <= high; p++) pages.push(p);
  if (high < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export default function NetworkingView({
  selectedCompany,
  onSelectCompany,
  onContactar,
  initialFilters,
}: NetworkingViewProps) {
  const [filters, setFilters] = useState<NetworkingFilters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });
  const [locationSelection, setLocationSelection] = useState<LocationSelection>(() =>
    initialLocationSelection(initialFilters?.municipality),
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Map<string, Company>>(new Map());
  const [exportLoading, setExportLoading] = useState(false);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  async function fetchCompanies(
    currentFilters: NetworkingFilters,
    currentPage: number,
    size?: number,
    currentLocationSelection = locationSelection,
  ) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const effectiveSize = size ?? pageSize;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("pageSize", String(effectiveSize));
      addCompanyFilterParams(params, currentFilters, currentLocationSelection);

      const res = await fetch(`/api/companies?${params.toString()}`, { signal: controller.signal });
      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Erro ao carregar empresas.";
        throw new Error(message);
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "items" in data &&
        Array.isArray((data as Record<string, unknown>).items)
      ) {
        const p = data as PaginatedResponse<Company>;
        setCompanies(p.items);
        setTotal(p.total);
        setPage(p.page);
      } else {
        throw new Error("Resposta inesperada do servidor.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  function handleInstantFilterChange(key: keyof NetworkingFilters, value: string) {
    const newFilters: NetworkingFilters = {
      ...filters,
      [key]: value,
      ...(key === "category" ? { specialty: "" } : {}),
    };
    setFilters(newFilters);
    setSelectedCompanies(new Map());
    void fetchCompanies(newFilters, 1);
  }

  function handleDistrictChange(district: string) {
    const newFilters: NetworkingFilters = { ...filters, municipality: "" };
    const newLocationSelection: LocationSelection = {
      district,
      municipality: "",
      parish: "",
    };
    setFilters(newFilters);
    setLocationSelection(newLocationSelection);
    setSelectedCompanies(new Map());
    void fetchCompanies(newFilters, 1, undefined, newLocationSelection);
  }

  function handleMunicipalityChange(municipality: string) {
    const newFilters: NetworkingFilters = { ...filters, municipality };
    const newLocationSelection: LocationSelection = {
      district: locationSelection.district || findDistrictForMunicipality(municipality),
      municipality,
      parish: "",
    };
    setFilters(newFilters);
    setLocationSelection(newLocationSelection);
    setSelectedCompanies(new Map());
    void fetchCompanies(newFilters, 1, undefined, newLocationSelection);
  }

  function handleParishChange(parish: string) {
    setLocationSelection((prev) => ({ ...prev, parish }));
  }

  function handleClearLocationFilter() {
    const newFilters: NetworkingFilters = { ...filters, municipality: "" };
    setFilters(newFilters);
    setLocationSelection(EMPTY_LOCATION_SELECTION);
    setSelectedCompanies(new Map());
    void fetchCompanies(newFilters, 1, undefined, EMPTY_LOCATION_SELECTION);
  }

  function handleRemoveChip(key: keyof NetworkingFilters) {
    if (key === "municipality") {
      handleClearLocationFilter();
      return;
    }
    const newFilters: NetworkingFilters = {
      ...filters,
      [key]: "",
      ...(key === "category" ? { specialty: "" } : {}),
    };
    setFilters(newFilters);
    setSelectedCompanies(new Map());
    void fetchCompanies(newFilters, 1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setLocationSelection(EMPTY_LOCATION_SELECTION);
    setSelectedCompanies(new Map());
    void fetchCompanies(EMPTY_FILTERS, 1, undefined, EMPTY_LOCATION_SELECTION);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    void fetchCompanies(filters, 1, newSize);
  }

  function handlePageChange(newPage: number) {
    void fetchCompanies(filters, newPage);
  }

  function handleRowClick(company: Company) {
    onSelectCompany(company);
  }

  function handleCheckboxChange(company: Company) {
    setSelectedCompanies((prev) => {
      const next = new Map(prev);
      if (next.has(company.id)) {
        next.delete(company.id);
      } else {
        next.set(company.id, company);
      }
      return next;
    });
  }

  const allCurrentPageSelected =
    companies.length > 0 && companies.every((c) => selectedCompanies.has(c.id));

  const allResultsSelected = total > 0 && selectedCompanies.size >= total;

  async function handleSelectAllResults() {
    if (allResultsSelected || allCurrentPageSelected) {
      setSelectedCompanies(new Map());
      return;
    }

    setSelectAllLoading(true);
    try {
      const collected: Company[] = [];
      const currentFilters = filters;
      const currentLocationSelection = locationSelection;

      const buildParams = (p: number) => {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("pageSize", String(EXPORT_PAGE_SIZE));
        addCompanyFilterParams(params, currentFilters, currentLocationSelection);
        return params;
      };

      const firstRes = await fetch(`/api/companies?${buildParams(1).toString()}`);
      if (!firstRes.ok) throw new Error("Erro ao carregar empresas");
      const firstData = (await firstRes.json()) as PaginatedResponse<Company>;
      collected.push(...firstData.items);

      const fetchPages = Math.ceil(firstData.total / EXPORT_PAGE_SIZE);
      for (let p = 2; p <= fetchPages; p++) {
        const res = await fetch(`/api/companies?${buildParams(p).toString()}`);
        if (!res.ok) throw new Error(`Erro ao obter página ${p}`);
        const data = (await res.json()) as PaginatedResponse<Company>;
        collected.push(...data.items);
      }

      setSelectedCompanies(new Map(collected.map((c) => [c.id, c])));
    } catch {
      setSelectedCompanies((prev) => {
        const next = new Map(prev);
        companies.forEach((c) => next.set(c.id, c));
        return next;
      });
    } finally {
      setSelectAllLoading(false);
    }
  }

  async function handleExport() {
    if (selectedCompanies.size > 0) {
      triggerCsvDownload(
        buildCsvString(Array.from(selectedCompanies.values())),
        buildExportFilename(),
      );
      return;
    }

    setExportLoading(true);
    try {
      const collected: Company[] = [];
      const currentFilters = filters;
      const currentLocationSelection = locationSelection;

      const buildParams = (p: number) => {
        const params = new URLSearchParams();
        params.set("page",     String(p));
        params.set("pageSize", String(EXPORT_PAGE_SIZE));
        addCompanyFilterParams(params, currentFilters, currentLocationSelection);
        return params;
      };

      const firstRes = await fetch(`/api/companies?${buildParams(1).toString()}`);
      if (!firstRes.ok) throw new Error("Erro ao obter página 1");
      const firstData = (await firstRes.json()) as PaginatedResponse<Company>;
      collected.push(...firstData.items);

      const serverTotal = Math.min(firstData.total, CSV_EXPORT_LIMIT);
      const totalPages  = Math.ceil(serverTotal / EXPORT_PAGE_SIZE);

      for (let p = 2; p <= totalPages; p++) {
        const res = await fetch(`/api/companies?${buildParams(p).toString()}`);
        if (!res.ok) throw new Error(`Erro ao obter página ${p}`);
        const data = (await res.json()) as PaginatedResponse<Company>;
        collected.push(...data.items);
      }

      triggerCsvDownload(buildCsvString(collected), buildExportFilename());
    } catch {
      alert("Não foi possível exportar as empresas. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  }

  useEffect(() => {
    void fetchCompanies(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/contacted")
      .then((r) => r.ok ? r.json() as Promise<{ companyIds: string[] }> : Promise.reject())
      .then((data) => setContactedIds(new Set(data.companyIds)))
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageWindow = buildPageWindow(page, totalPages);
  const municipalityOptions = locationSelection.district
    ? getMunicipalitiesForDistrict(locationSelection.district)
    : [];
  const parishOptions = locationSelection.municipality
    ? getParishesForMunicipality(locationSelection.municipality)
    : [];
  const locationChipText = locationSelection.parish
    ? `${locationSelection.parish} → ${locationSelection.municipality}`
    : locationSelection.municipality
      ? `Concelho: ${locationSelection.municipality}`
      : locationSelection.district
        ? `Distrito: ${locationSelection.district}`
        : "";

  const hasActiveFilters =
    Object.entries(filters).some(([key, value]) => key !== "municipality" && value !== "") ||
    locationSelection.district !== "";

  const selectedList = Array.from(selectedCompanies.values());
  const emailCount = selectedList.filter(c => c.email !== null).length;
  const noEmailCount = selectedList.length - emailCount;
  const websiteCount = selectedList.filter(c => c.hasWebsite).length;
  const noWebsiteCount = selectedList.length - websiteCount;
  const hasNoEmailSelected = noEmailCount > 0 && selectedCompanies.size > 0;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      <aside className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 p-4 gap-4 overflow-y-auto">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Seleção</span>
            {selectedCompanies.size > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {selectedCompanies.size}
              </span>
            )}
          </div>
          {selectedCompanies.size > 0 && (
            <button type="button" onClick={() => setSelectedCompanies(new Map())}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Limpar
            </button>
          )}
        </div>

        <button type="button" disabled={companies.length === 0 || loading || selectAllLoading} onClick={() => void handleSelectAllResults()}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {selectAllLoading ? "A selecionar..." : (allResultsSelected || allCurrentPageSelected) ? "Desselecionar" : `Selecionar todas (${total})`}
        </button>

        <button type="button" disabled={emailCount === 0}
          onClick={() => onContactar(Array.from(selectedCompanies.values()))}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          <IconPaperPlane className="w-4 h-4" />
          Contactar ({emailCount})
        </button>

        {selectedCompanies.size > 0 && (
          <>
            <hr className="border-gray-100" />
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Resumo da seleção</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Com email</span>
                <span className="font-medium text-green-600">{emailCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Sem email</span>
                <span className={`font-medium ${noEmailCount > 0 ? "text-red-500" : "text-gray-400"}`}>{noEmailCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Com website</span>
                <span className="font-medium text-gray-700">{websiteCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Sem website</span>
                <span className="font-medium text-gray-700">{noWebsiteCount}</span>
              </div>
            </div>
            {hasNoEmailSelected && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-700 leading-relaxed">
                Só serão contactadas empresas com email válido.
              </div>
            )}
          </>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">

        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Networking</h1>
            <p className="text-sm text-gray-500 mt-0.5">Encontre e contacte empresas relevantes para o seu negócio.</p>
          </div>
          <button type="button" onClick={() => void handleExport()}
            disabled={exportLoading || (total === 0 && selectedCompanies.size === 0)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exportLoading ? "A exportar..." : selectedCompanies.size > 0
              ? `Exportar (${selectedCompanies.size})`
              : `Exportar (${Math.min(total, CSV_EXPORT_LIMIT)})`}
          </button>
        </div>

        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">

            <select
              value={locationSelection.district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
              <option value="">Distrito</option>
              {DISTRICT_OPTIONS.map((district) => (
                <option key={district.name} value={district.name}>{district.name}</option>
              ))}
            </select>

            <select
              value={locationSelection.municipality}
              disabled={!locationSelection.district}
              onChange={(e) => handleMunicipalityChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <option value="">Concelho</option>
              {municipalityOptions.map((municipality) => (
                <option key={municipality} value={municipality}>{municipality}</option>
              ))}
            </select>

            <select
              value={locationSelection.parish}
              disabled={!locationSelection.municipality || parishOptions.length === 0}
              onChange={(e) => handleParishChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <option value="">Freguesia</option>
              {parishOptions.map((parish) => (
                <option key={parish} value={parish}>{parish}</option>
              ))}
            </select>

            <select name="category" value={filters.category}
              onChange={(e) => handleInstantFilterChange("category", e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
              <option value="">Categoria</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select name="specialty" value={filters.specialty}
              disabled={!filters.category}
              onChange={(e) => handleInstantFilterChange("specialty", e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <option value="">Especialidade</option>
              {(SPECIALTIES[filters.category] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select name="companySize" value={filters.companySize}
              onChange={(e) => handleInstantFilterChange("companySize", e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
              <option value="">Dimensão</option>
              {["Pequena", "Média", "Grande", "Desconhecida"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Website</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                {(["", "true", "false"] as const).map((val, i) => (
                  <button key={val} type="button"
                    onClick={() => handleInstantFilterChange("hasWebsite", val)}
                    className={`px-2.5 py-1.5 font-medium transition-colors ${i < 2 ? "border-r border-gray-200" : ""} ${
                      filters.hasWebsite === val ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}>
                    {val === "" ? "Todos" : val === "true" ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Email</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                {(["", "true", "false"] as const).map((val, i) => (
                  <button key={val} type="button"
                    onClick={() => handleInstantFilterChange("hasEmail", val)}
                    className={`px-2.5 py-1.5 font-medium transition-colors ${i < 2 ? "border-r border-gray-200" : ""} ${
                      filters.hasEmail === val ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}>
                    {val === "" ? "Todos" : val === "true" ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 flex-wrap">
            {locationChipText && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {locationChipText}
                <button type="button" onClick={handleClearLocationFilter}
                  className="ml-0.5 hover:text-blue-900 transition-colors">×</button>
              </span>
            )}
            {(Object.entries(filters) as [keyof NetworkingFilters, string][])
              .filter(([key, value]) => key !== "municipality" && value !== "")
              .map(([key, value]) => {
                const labelFn = FILTER_LABELS[key];
                if (!labelFn) return null;
                return (
                  <span key={key} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {labelFn(value)}
                    <button type="button" onClick={() => handleRemoveChip(key)}
                      className="ml-0.5 hover:text-blue-900 transition-colors">×</button>
                  </span>
                );
              })}
            <button type="button" onClick={handleClearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </button>
            <span className="ml-auto text-xs text-gray-500">{total} empresas encontradas</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox"
                    checked={allResultsSelected}
                    disabled={companies.length === 0 || selectAllLoading}
                    onChange={() => void handleSelectAllResults()}
                    className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Empresa</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Categoria</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Dimensão</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Concelho</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Website</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Telefone</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    A carregar...
                  </td>
                </tr>
              ) : error !== null ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    Nenhuma empresa encontrada. Ajuste os filtros.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                    <tr key={company.id} onClick={() => handleRowClick(company)}
                      className={`cursor-pointer hover:bg-blue-50 border-b border-gray-100 transition-colors ${
                        selectedCompany?.id === company.id ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : ""
                      }`}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Selecionar ${company.name}`}
                          checked={selectedCompanies.has(company.id)}
                          onChange={() => handleCheckboxChange(company)}
                          className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor(company.name)} flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{companyInitials(company.name)}</span>
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[140px]">{company.name}</span>
                          {contactedIds.has(company.id) && (
                            <span className="flex-shrink-0 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                              Contactado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{company.category}</td>
                      <td className="px-4 py-3">
                        <SizeBadge size={company.companySize} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{company.municipality ?? "—"}</td>
                      <td className="px-4 py-3">
                        {company.hasWebsite
                          ? <span className="text-green-600 font-semibold">✓</span>
                          : <span className="text-red-400 font-semibold">✗</span>}
                      </td>
                      <td className="px-4 py-3">
                        {company.email !== null
                          ? <span className="text-green-600 font-semibold">✓</span>
                          : <span className="text-red-400 font-semibold">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{company.phoneNumber ?? "—"}</td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {total === 0 ? "Nenhuma empresa" : `Mostrando ${start} a ${end} de ${total} empresas`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              aria-label="Página anterior"
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {pageWindow.map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400 select-none">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePageChange(item)}
                  disabled={loading}
                  aria-label={`Página ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                    item === page
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              aria-label="Página seguinte"
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
          <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>

      </main>
    </div>
  );
}
