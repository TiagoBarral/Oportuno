"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { CITY_NAMES, canonicaliseMunicipality } from "@/lib/cities";
import type { StatsResponse, RecentSearch } from "./types";
import AppShell from "./components/AppShell";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HomeFilters {
  category: string;
  municipality: string;
  opportunity: string;
  hasWebsite: string;
  hasEmail: string;
}

const EMPTY_FILTERS: HomeFilters = {
  category: "",
  municipality: "",
  opportunity: "",
  hasWebsite: "",
  hasEmail: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSameDay(date, today)) return "Hoje";
  if (isSameDay(date, yesterday)) return "Ontem";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function categoryInitial(industry: string): string {
  return (industry.trim()[0] ?? "?").toUpperCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const router = useRouter();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [filters, setFilters] = useState<HomeFilters>(EMPTY_FILTERS);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = (await res.json()) as StatsResponse;
          setStats(data);
        } else {
          setStatsError(true);
        }
      } catch {
        setStatsError(true);
      } finally {
        setStatsLoading(false);
      }
    }
    void loadStats();
  }, []);

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function handleApplyFilters() {
    const params = new URLSearchParams();
    if (filters.category)     params.set("category", filters.category);
    if (filters.municipality) params.set("municipality", filters.municipality);
    if (filters.opportunity)  params.set("opportunity", filters.opportunity);
    if (filters.hasWebsite)   params.set("hasWebsite", filters.hasWebsite);
    if (filters.hasEmail)     params.set("hasEmail", filters.hasEmail);
    const query = params.toString();
    router.push(query ? `/networking?${query}` : "/networking");
  }

  function handleRecentSearchClick(job: RecentSearch) {
    const params = new URLSearchParams();
    const muni = canonicaliseMunicipality(job.location);
    if (muni) params.set("municipality", muni);
    params.set("industry", job.industry);
    const query = params.toString();
    router.push(query ? `/networking?${query}` : "/networking");
  }

  return (
    <AppShell>
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 p-4 gap-4 overflow-y-auto">

          {/* Header */}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Filtros</p>

          {/* Filter rows */}
          <div className="flex flex-col gap-3">

            {/* Categoria */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-purple-600">#</span>
                </span>
                <span className="text-sm font-medium text-gray-700">Categoria</span>
              </div>
              <select name="category" value={filters.category} onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Todas as categorias</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Localização */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-700">Localização (município)</span>
              </div>
              <select name="municipality" value={filters.municipality} onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Todos os municípios</option>
                {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Oportunidade */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-700">Oportunidade</span>
              </div>
              <select name="opportunity" value={filters.opportunity} onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Todas</option>
                <option value="NO_WEBSITE">Sem website</option>
                <option value="WEAK_WEBSITE">Site fraco</option>
                <option value="NONE">Sem oportunidade</option>
              </select>
            </div>

            {/* Tem website */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-700">Tem website</span>
              </div>
              <select name="hasWebsite" value={filters.hasWebsite} onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Todos</option>
                <option value="true">Com website</option>
                <option value="false">Sem website</option>
              </select>
            </div>

            {/* Tem email */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-700">Tem email</span>
              </div>
              <select name="hasEmail" value={filters.hasEmail} onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Todas</option>
                <option value="true">Com email</option>
                <option value="false">Sem email</option>
              </select>
            </div>

          </div>

          {/* Buttons */}
          <button type="button" onClick={handleApplyFilters}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            Aplicar filtros
          </button>
          <button type="button" onClick={handleClearFilters}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Limpar filtros
          </button>

          {/* Tip */}
          <div className="mt-auto rounded-xl bg-blue-50 border border-blue-100 p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <span className="text-xs font-semibold text-blue-700">Dica rápida</span>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">
              Use os filtros para segmentar as melhores oportunidades e gere emails personalizados em massa para poupar tempo.
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto w-full px-8 py-8 flex flex-col gap-8">

            {/* ── Hero ── */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">

                {/* Illustration */}
                <div className="flex-shrink-0 w-44 h-48 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-36 h-36" fill="none">
                    <rect x="33" y="38" width="34" height="30" rx="4" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
                    <rect x="41" y="50" width="7" height="9" rx="1.5" fill="#3B82F6"/>
                    <rect x="52" y="50" width="7" height="9" rx="1.5" fill="#3B82F6"/>
                    <rect x="43" y="38" width="14" height="3" rx="1" fill="#93C5FD"/>
                    <circle cx="16" cy="50" r="9" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
                    <circle cx="16" cy="48" r="3.5" fill="#3B82F6"/>
                    <path d="M10 58c1-3 3-4 6-4s5 1 6 4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="84" cy="50" r="9" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
                    <circle cx="84" cy="48" r="3.5" fill="#3B82F6"/>
                    <path d="M78 58c1-3 3-4 6-4s5 1 6 4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="50" cy="16" r="9" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
                    <circle cx="50" cy="14" r="3.5" fill="#3B82F6"/>
                    <path d="M44 24c1-3 3-4 6-4s5 1 6 4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="25" y1="50" x2="33" y2="52" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 2"/>
                    <line x1="67" y1="52" x2="75" y2="50" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 2"/>
                    <line x1="50" y1="25" x2="50" y2="38" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 2"/>
                  </svg>
                </div>

                {/* Center: title + steps */}
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">
                      A sua base de oportunidades está pronta
                    </h1>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                      Explore empresas da nossa base de dados e encontre potenciais clientes para os seus serviços. Use os filtros à esquerda para encontrar as melhores oportunidades e entre em contacto com facilidade.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
                        </svg>
                        <span className="text-xs font-semibold text-gray-700">1. Filtre e encontre</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">Use os filtros à esquerda para encontrar as melhores oportunidades.</p>
                    </div>
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span className="text-xs font-semibold text-gray-700">2. Selecione empresas</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">Selecione as empresas que fazem sentido para o seu negócio.</p>
                    </div>
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                        </svg>
                        <span className="text-xs font-semibold text-gray-700">3. Contacte em massa</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">Gere emails personalizados e envie em massa com um só clique.</p>
                    </div>
                  </div>
                </div>

                {/* Right: count + CTA */}
                <div className="flex-shrink-0 flex flex-col gap-3 w-52">
                  <div>
                    <p className="text-4xl font-bold text-blue-600 tabular-nums leading-none">
                      {statsLoading ? "—" : (stats?.totalCompanies?.toLocaleString("pt-PT") ?? "—")}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {statsError ? "Erro ao carregar" : "empresas disponíveis"}
                    </p>
                  </div>
                  <Link href="/networking"
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-between gap-2">
                    <span>Ver todas as empresas</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </Link>
                  <p className="text-xs text-gray-400 leading-relaxed">Aceda à lista completa com mais ações e gestão.</p>
                </div>
              </div>
            </section>

            {/* ── Ações rápidas ── */}
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-gray-900">Ações rápidas</h2>
              <div className="grid grid-cols-3 gap-4">

                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Gerar emails</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Crie emails personalizados para várias empresas.</p>
                    </div>
                  </div>
                  <Link href="/networking"
                    className="self-start rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors">
                    Gerar
                  </Link>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Enviar em massa</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Envie emails em massa para as empresas selecionadas.</p>
                    </div>
                  </div>
                  <Link href="/networking"
                    className="self-start rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                    Enviar
                  </Link>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Exportar</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Exportar empresas filtradas para CSV.</p>
                    </div>
                  </div>
                  <Link href="/networking"
                    className="self-start rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                    Exportar
                  </Link>
                </div>

              </div>
            </section>

            {/* ── Pesquisas recentes ── */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Pesquisas recentes</h2>
                <Link href="/networking" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {!statsLoading && statsError ? (
                  <p className="px-5 py-8 text-sm text-center text-gray-400">
                    Não foi possível carregar as pesquisas recentes
                  </p>
                ) : !statsLoading && (stats?.recentSearches ?? []).length === 0 ? (
                  <p className="px-5 py-8 text-sm text-center text-gray-400">
                    Nenhuma pesquisa recente
                  </p>
                ) : (
                  <ul>
                    {(stats?.recentSearches ?? []).map((job, idx) => (
                      <li key={job.id}>
                        <button type="button" onClick={() => handleRecentSearchClick(job)}
                          className={`w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-blue-50 transition-colors ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{categoryInitial(job.industry)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{job.industry} · {job.location}</p>
                            <p className="text-xs text-gray-400">{formatTimestamp(job.createdAt)} · {job.companyCount} resultados</p>
                          </div>
                          <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            job.status === "DONE"    ? "bg-green-50 text-green-700" :
                            job.status === "RUNNING" ? "bg-yellow-50 text-yellow-700" :
                            job.status === "FAILED"  ? "bg-red-50 text-red-600" :
                                                       "bg-gray-100 text-gray-500"
                          }`}>
                            {job.status === "DONE" ? "Concluída" : job.status === "RUNNING" ? "Em curso" : job.status === "FAILED" ? "Falhada" : "Pendente"}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="flex-shrink-0 w-4 h-4 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* ── Bottom CTA ── */}
            <section className="rounded-2xl bg-white border border-gray-200 px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Não encontrou o que procura?</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Use a funcionalidade{" "}
                    <Link href="/discover" className="font-medium text-blue-600 hover:underline">Descobrir</Link>
                    {" "}para adicionar novas empresas à sua base.
                  </p>
                </div>
              </div>
              <Link href="/discover"
                className="flex-shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                </svg>
                Descobrir novas empresas
              </Link>
            </section>

          </div>
        </main>

      </div>
    </AppShell>
  );
}
