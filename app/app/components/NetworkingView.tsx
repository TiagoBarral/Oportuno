"use client";

import { useState, useEffect } from "react";
import type { Company, NetworkingFilters, PaginatedResponse } from "../types";
import { opportunityLabel, opportunityColor } from "./shared";
import { CITY_NAMES } from "@/lib/cities";
import { CATEGORIES } from "@/lib/categories";
import { SPECIALTIES } from "@/lib/specialties";
import { buildCsvString, buildExportFilename, triggerCsvDownload, CSV_EXPORT_LIMIT, EXPORT_PAGE_SIZE } from "./csvExport";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NetworkingViewProps {
  selectedCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  initialFilters?: Partial<NetworkingFilters>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  opportunity: "",
  hasWebsite: "",
  hasEmail: "",
};

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Pagination helper — returns page numbers with "..." gaps
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NetworkingView({
  selectedCompany,
  onSelectCompany,
  initialFilters,
}: NetworkingViewProps) {
  const [filters, setFilters] = useState<NetworkingFilters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Map<string, Company>>(new Map());
  const [exportLoading, setExportLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  async function fetchCompanies(
    currentFilters: NetworkingFilters,
    currentPage: number,
  ) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));
      if (currentFilters.municipality) params.set("municipality", currentFilters.municipality);
      if (currentFilters.category)    params.set("category", currentFilters.category);
      if (currentFilters.specialty)   params.set("specialty", currentFilters.specialty);
      if (currentFilters.opportunity) params.set("opportunity", currentFilters.opportunity);
      if (currentFilters.hasWebsite)  params.set("hasWebsite", currentFilters.hasWebsite);
      if (currentFilters.hasEmail)    params.set("hasEmail", currentFilters.hasEmail);

      const res = await fetch(`/api/companies?${params.toString()}`);
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
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      // reset specialty when category changes
      ...(name === "category" ? { specialty: "" } : {}),
    }));
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setSelectedCompanies(new Map());
    void fetchCompanies(filters, 1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setSelectedCompanies(new Map());
    void fetchCompanies(EMPTY_FILTERS, 1);
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

  async function handleExport() {
    // If companies are selected, export only those (tracked across pages)
    if (selectedCompanies.size > 0) {
      triggerCsvDownload(
        buildCsvString(Array.from(selectedCompanies.values())),
        buildExportFilename(),
      );
      return;
    }

    // Otherwise export all companies matching current filters
    setExportLoading(true);
    try {
      const collected: Company[] = [];

      const buildParams = (page: number) => {
        const params = new URLSearchParams();
        params.set("page",     String(page));
        params.set("pageSize", String(EXPORT_PAGE_SIZE));
        if (filters.municipality) params.set("municipality", filters.municipality);
        if (filters.category)     params.set("category",     filters.category);
        if (filters.specialty)    params.set("specialty",    filters.specialty);
        if (filters.opportunity)  params.set("opportunity",  filters.opportunity);
        if (filters.hasWebsite)   params.set("hasWebsite",   filters.hasWebsite);
        if (filters.hasEmail)     params.set("hasEmail",     filters.hasEmail);
        return params;
      };

      // Fetch page 1 first to get the authoritative server total
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

  // -------------------------------------------------------------------------
  // Auto-load on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    void fetchCompanies(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Pagination calculations
  // -------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageWindow = buildPageWindow(page, totalPages);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 p-4 gap-4">

        {/* Section label */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Ações em Massa
        </p>

        {/* Selected count */}
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{selectedCompanies.size}</span>{" "}
          selecionadas
        </p>

        {/* Bulk action buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            Gerar Emails
          </button>
          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            Enviar Emails
          </button>
        </div>

        {/* Tip */}
        <p className="mt-auto text-xs text-gray-400 leading-relaxed">
          Selecione empresas na tabela para ações em massa.
        </p>
      </aside>

      {/* ── Center column ── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">

        {/* Filter bar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
          <form onSubmit={handleFilter}>
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="municipality"
                value={filters.municipality}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Município: todos</option>
                {CITY_NAMES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Categoria: todas</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                name="specialty"
                value={filters.specialty}
                onChange={handleFilterChange}
                disabled={!filters.category}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Especialidade: todas</option>
                {(SPECIALTIES[filters.category] ?? []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                name="opportunity"
                value={filters.opportunity}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Todas</option>
                <option value="NO_WEBSITE">Sem website</option>
                <option value="WEAK_WEBSITE">Site fraco</option>
                <option value="NONE">Sem oportunidade</option>
              </select>
              <select
                name="hasWebsite"
                value={filters.hasWebsite}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Website: todos</option>
                <option value="true">Com website</option>
                <option value="false">Sem website</option>
              </select>
              <select
                name="hasEmail"
                value={filters.hasEmail}
                onChange={handleFilterChange}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Email: todos</option>
                <option value="true">Com email</option>
                <option value="false">Sem email</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 active:bg-gray-800 transition-colors"
              >
                Aplicar filtros
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Limpar
              </button>
            </div>
          </form>
        </div>

        {/* Results header */}
        <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Empresas encontradas
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {total}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exportLoading || (selectedCompanies.size === 0 && total === 0)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exportLoading
              ? "A exportar..."
              : selectedCompanies.size > 0
                ? `Exportar (${selectedCompanies.size} selecionadas)`
                : `Exportar (${Math.min(total, CSV_EXPORT_LIMIT)})`}
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="w-10 px-4 py-2.5" />
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Empresa
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Categoria
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Município
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Oportunidade
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Website
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Email
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                  Telefone
                </th>
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
                  <tr
                    key={company.id}
                    onClick={() => handleRowClick(company)}
                    className={`cursor-pointer hover:bg-blue-50 border-b border-gray-100 transition-colors ${
                      selectedCompany?.id === company.id
                        ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                        : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${company.name}`}
                        checked={selectedCompanies.has(company.id)}
                        onChange={() => handleCheckboxChange(company)}
                        className="rounded border-gray-300"
                      />
                    </td>

                    {/* Company name with avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-500">
                            {companyInitials(company.name)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">
                          {company.name}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                      {company.category}
                    </td>

                    {/* Municipality */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {company.municipality ?? "—"}
                    </td>

                    {/* Opportunity badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${opportunityColor(company.opportunity)}`}
                      >
                        {opportunityLabel(company.opportunity)}
                      </span>
                    </td>

                    {/* Has website */}
                    <td className="px-4 py-3">
                      {company.hasWebsite ? (
                        <span className="text-green-600 font-semibold" aria-label="Tem website">
                          ✓
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold" aria-label="Sem website">
                          ✗
                        </span>
                      )}
                    </td>

                    {/* Has email */}
                    <td className="px-4 py-3">
                      {company.email !== null ? (
                        <span className="text-green-600 font-semibold" aria-label="Tem email">
                          ✓
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold" aria-label="Sem email">
                          ✗
                        </span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {company.phoneNumber ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between gap-4">
          {/* Range label */}
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {total === 0
              ? "Nenhuma empresa"
              : `Mostrando ${start} a ${end} de ${total} empresas`}
          </span>

          {/* Page buttons */}
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
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1.5 text-sm text-gray-400 select-none"
                >
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
        </div>
      </main>
    </div>
  );
}
