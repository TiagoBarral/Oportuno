"use client";

import { useState, useRef, useEffect } from "react";
import type { Company } from "../types";
import { CITY_NAMES } from "@/lib/cities";
import {
  opportunityLabel,
  opportunityColor,
  IconSearch,
  IconPin,
} from "./shared";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DiscoverViewProps {
  selectedCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  onDiscoveryCompaniesChange: (companies: Company[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiscoverView({
  selectedCompany,
  onSelectCompany,
  onDiscoveryCompaniesChange,
}: DiscoverViewProps) {
  const [discoveryIndustry, setDiscoveryIndustry] = useState("");
  const [discoveryLocation, setDiscoveryLocation] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState<{ pipeline: boolean; companies: boolean }>({
    pipeline: false,
    companies: false,
  });

  const [pipelineNote, setPipelineNote] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [pipelineProgress, setPipelineProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const [companiesError, setCompaniesError] = useState<string | null>(null);

  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  async function fetchCompanies(jobId: string) {
    setLoading((l) => ({ ...l, companies: true }));
    setCompaniesError(null);
    try {
      const res = await fetch(`/api/companies?jobId=${jobId}`);
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Erro ao carregar empresas.";
        throw new Error(message);
      }
      if (!Array.isArray(data)) throw new Error("Resposta inesperada do servidor.");
      const validOpportunities = new Set(["NO_WEBSITE", "WEAK_WEBSITE", "NONE"]);
      const result = (data as unknown[]).filter(
        (item): item is Company =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          typeof (item as Record<string, unknown>).id === "string" &&
          "name" in item &&
          typeof (item as Record<string, unknown>).name === "string" &&
          "opportunity" in item &&
          validOpportunities.has(
            (item as Record<string, unknown>).opportunity as string,
          ),
      );
      setCompanies(result);
      onDiscoveryCompaniesChange(result);
    } catch {
      setCompaniesError("Erro ao carregar empresas.");
    } finally {
      setLoading((l) => ({ ...l, companies: false }));
    }
  }

  async function handleDiscover() {
    if (!discoveryIndustry || !discoveryLocation) {
      setPipelineNote({
        message: "Preencha o setor e a localização antes de descobrir empresas.",
        type: "error",
      });
      return;
    }
    setPipelineNote(null);
    setPipelineProgress(null);
    setLoading((l) => ({ ...l, pipeline: true }));
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: discoveryIndustry,
          location: discoveryLocation,
          radius: 20000,
        }),
      });
      if (!res.ok) {
        const data: unknown = await res.json();
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Erro na descoberta.";
        setPipelineNote({ message, type: "error" });
        return;
      }
      const jobData = (await res.json()) as {
        jobId: string;
        status: string;
        queued: boolean;
      };

      if (jobData.queued) {
        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const pollRes = await fetch(`/api/pipeline/${jobData.jobId}`);
              if (!pollRes.ok) {
                clearInterval(interval);
                const errBody: unknown = await pollRes.json().catch(() => null);
                const detail =
                  typeof errBody === "object" && errBody !== null && "error" in errBody
                    ? (errBody as Record<string, string>).error
                    : `HTTP ${pollRes.status}`;
                reject(new Error(`Polling falhou: ${detail}`));
                return;
              }
              const poll = (await pollRes.json()) as {
                status: string;
                progress: { done: number; total: number };
              };
              if (!isMounted.current) { clearInterval(interval); resolve(); return; }
              setPipelineProgress({
                done: poll.progress.done,
                total: poll.progress.total,
              });
              if (poll.status === "DONE") {
                clearInterval(interval);
                resolve();
              } else if (poll.status === "FAILED") {
                clearInterval(interval);
                reject(new Error("Descoberta falhou."));
              }
            } catch (err) {
              clearInterval(interval);
              reject(err);
            }
          }, 2000);
        });
      }

      await fetchCompanies(jobData.jobId);
      setPipelineNote({ message: "Descoberta concluída.", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro na descoberta.";
      setPipelineNote({ message, type: "error" });
    } finally {
      setLoading((l) => ({ ...l, pipeline: false }));
      setPipelineProgress(null);
    }
  }

  function handleLocationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDiscoveryLocation(value);
    if (value.trim() === "") {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }
    const lower = value.toLowerCase();
    const matches = CITY_NAMES.filter((city) => city.toLowerCase().includes(lower));
    setLocationSuggestions(matches);
    setShowLocationDropdown(matches.length > 0);
  }

  function handleSelectSuggestion(city: string) {
    setDiscoveryLocation(city);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isLoading = loading.pipeline || loading.companies;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left sidebar — inputs only ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Descoberta
          </p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Procura novas empresas no Google Places e guarda-as na base de dados.
          </p>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-3">
          {/* Industry input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              name="industry"
              type="text"
              autoComplete="off"
              placeholder="Setor (ex: restaurante)"
              value={discoveryIndustry}
              onChange={(e) => setDiscoveryIndustry(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Location input with autocomplete */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconPin className="w-4 h-4" />
            </span>
            <input
              name="location"
              type="text"
              autoComplete="off"
              placeholder="Localização (ex: Lisboa)"
              value={discoveryLocation}
              onChange={handleLocationChange}
              onFocus={() => {
                if (locationSuggestions.length > 0) setShowLocationDropdown(true);
              }}
              onBlur={() => setShowLocationDropdown(false)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {showLocationDropdown && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                {locationSuggestions.map((city) => (
                  <li key={city}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(city)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {city}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Discover button */}
          <button
            type="button"
            onClick={handleDiscover}
            disabled={loading.pipeline}
            className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading.pipeline ? (
              pipelineProgress !== null && pipelineProgress.total > 0
                ? `A processar: ${pipelineProgress.done}/${pipelineProgress.total}`
                : "A descobrir..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                <IconSearch className="w-4 h-4" />
                Descobrir Empresas
              </span>
            )}
          </button>

          {/* Pipeline note */}
          {pipelineNote !== null && (
            <p className={pipelineNote.type === "success" ? "text-xs text-green-600" : "text-xs text-red-500"}>
              {pipelineNote.message}
            </p>
          )}
        </div>
      </aside>

      {/* ── Center — results table ── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">

        {/* Results header */}
        {companies.length > 0 && (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Empresas encontradas</span>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {companies.length}
            </span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">A carregar...</p>
            </div>
          )}

          {/* Error */}
          {!isLoading && companiesError !== null && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-500">{companiesError}</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && companiesError === null && companies.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-4 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                <IconSearch className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Sem resultados</p>
              <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                Introduza um setor e localização e clique em Descobrir Empresas
              </p>
            </div>
          )}

          {/* Results table */}
          {!isLoading && companiesError === null && companies.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Empresa</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Setor</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Localização</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Oportunidade</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Website</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Email</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => {
                  const isSelected = selectedCompany?.id === company.id;
                  const initials = company.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0] ?? "")
                    .join("")
                    .toUpperCase();
                  return (
                    <tr
                      key={company.id}
                      onClick={() => onSelectCompany(company)}
                      className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                        isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-500">{initials}</span>
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{company.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{company.industry || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{company.location || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${opportunityColor(company.opportunity)}`}>
                          {opportunityLabel(company.opportunity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {company.hasWebsite
                          ? <span className="text-green-500 font-bold">✓</span>
                          : <span className="text-red-400 font-bold">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {company.email !== null
                          ? <span className="text-green-500 font-bold">✓</span>
                          : <span className="text-red-400 font-bold">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{company.phoneNumber ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

        </div>
      </main>

    </div>
  );
}
