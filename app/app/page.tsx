"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StatsResponse } from "./types";
import AppShell from "./components/AppShell";
import {
  IconBuilding,
  IconSearch,
  IconEnvelope,
  IconGlobe,
  IconPhone,
  IconUsers,
  IconSparkle,
  IconArrowRight,
  IconSliders,
  IconClock,
} from "./components/shared";

export default function Home() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

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

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-10">

          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="grid grid-cols-5 gap-8">

              {/* Left */}
              <div className="col-span-3 flex flex-col justify-center gap-6">

                {/* Headline */}
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                    Encontre novos clientes<br />
                    <span className="text-blue-600 italic">em minutos</span>{" "}
                    <span>🚀</span>
                  </h1>
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-md">
                    Aceda à nossa base de empresas ou descubra novas empresas que ainda não estão na sua base.
                  </p>
                </div>

                {/* Action cards */}
                <div className="flex gap-3">
                  <Link href="/networking"
                    className="flex-1 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <svg className="absolute bottom-0 left-0 text-blue-100 w-20 h-16" viewBox="0 0 80 60" fill="currentColor">
                      <ellipse cx="20" cy="60" rx="40" ry="30"/>
                    </svg>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <IconBuilding className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-blue-600 leading-snug">Explorar base<br />de empresas</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Use a nossa base de{" "}
                        <span className="text-blue-600 font-semibold">
                          {statsLoading ? "…" : (stats?.totalCompanies ?? 0).toLocaleString("pt-PT")}
                        </span>{" "}
                        empresas para encontrar oportunidades.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                        <IconArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Link>

                  <Link href="/discover"
                    className="flex-1 bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <svg className="absolute bottom-0 left-0 text-purple-100 w-20 h-16" viewBox="0 0 80 60" fill="currentColor">
                      <ellipse cx="20" cy="60" rx="40" ry="30"/>
                    </svg>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <IconSearch className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-purple-600 leading-snug">Descobrir novas<br />empresas</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Encontre empresas por nicho, localização ou palavra-chave.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                        <IconArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Right — stats card */}
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">

                {/* Magnifying glass illustration */}
                <div className="absolute top-2 right-2">
                  <svg width="130" height="118" viewBox="0 0 130 118" fill="none">
                    {/* Document/chart page (sits behind and to the right of the lens) */}
                    <rect x="50" y="4" width="66" height="76" rx="6" fill="white" stroke="#BAE6FD" strokeWidth="1.5"/>
                    <rect x="59" y="14" width="38" height="3" rx="1.5" fill="#DBEAFE"/>
                    <rect x="59" y="21" width="28" height="3" rx="1.5" fill="#DBEAFE"/>
                    <rect x="60" y="44" width="9" height="26" rx="2" fill="#93C5FD"/>
                    <rect x="72" y="35" width="9" height="35" rx="2" fill="#60A5FA"/>
                    <rect x="84" y="26" width="9" height="44" rx="2" fill="#1D4ED8"/>
                    {/* Lens outer glow */}
                    <circle cx="43" cy="57" r="40" fill="#DBEAFE" opacity="0.3"/>
                    {/* Lens ring + semi-transparent glass */}
                    <circle cx="43" cy="57" r="33" fill="#EFF6FF" fillOpacity="0.75" stroke="#3B82F6" strokeWidth="4.5"/>
                    {/* Handle */}
                    <line x1="69" y1="83" x2="96" y2="113" stroke="#1E3A8A" strokeWidth="11" strokeLinecap="round"/>
                    <circle cx="68" cy="82" r="8" fill="#2563EB"/>
                    <circle cx="68" cy="82" r="4" fill="#60A5FA"/>
                  </svg>
                </div>

                <p className="text-sm font-semibold text-blue-700">A sua base de dados</p>

                {/* Hero number */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-6xl font-black text-blue-900 leading-none tabular-nums">
                    {statsLoading ? "—" : (stats?.totalCompanies ?? 0).toLocaleString("pt-PT")}
                  </span>
                  <span className="text-sm font-semibold text-blue-600 mt-1">empresas</span>
                  {!statsLoading && !statsError && (stats?.newThisMonth ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                      +{(stats?.newThisMonth ?? 0).toLocaleString("pt-PT")} este mês
                    </span>
                  )}
                </div>


                {/* Stat rows */}
                <div className="flex flex-col divide-y divide-blue-100">
                  <div className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconEnvelope className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">Com email</span>
                    <span className="text-sm font-bold text-gray-900">
                      {statsLoading || statsError ? "—" : (stats?.withEmail ?? 0).toLocaleString("pt-PT")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconGlobe className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">Com website</span>
                    <span className="text-sm font-bold text-gray-900">
                      {statsLoading || statsError ? "—" : (stats?.withWebsite ?? 0).toLocaleString("pt-PT")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconPhone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">Com telefone</span>
                    <span className="text-sm font-bold text-gray-900">
                      {statsLoading || statsError ? "—" : (stats?.withPhone ?? 0).toLocaleString("pt-PT")}
                    </span>
                  </div>
                </div>

                {/* Footer note */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                  </svg>
                  Dados verificados e constantemente atualizados
                </div>

              </div>

            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-gray-900">Como funciona</h2>
            <div className="flex items-stretch">

              {/* Step 1 */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <IconSliders className="w-9 h-9 text-blue-700" />
                  </div>
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center shadow-sm">1</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Filtre empresas</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">Use os filtros no Networking para encontrar as melhores oportunidades.</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 px-2 flex items-center">
                <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                  <line x1="0" y1="8" x2="32" y2="8" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 3"/>
                  <path d="M32 4L38 8L32 12" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>

              {/* Step 2 */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <IconUsers className="w-9 h-9 text-blue-700" />
                  </div>
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center shadow-sm">2</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Selecione oportunidades</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">Escolha as empresas mais relevantes para o seu serviço.</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 px-2 flex items-center">
                <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                  <line x1="0" y1="8" x2="32" y2="8" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 3"/>
                  <path d="M32 4L38 8L32 12" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>

              {/* Step 3 */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <IconEnvelope className="w-9 h-9 text-blue-700" />
                  </div>
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center shadow-sm">3</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Contacte em massa</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">Gere e envie emails personalizados com um só clique.</p>
                </div>
              </div>

            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-gray-900">Ferramentas</h2>
            <div className="grid grid-cols-2 gap-4">

              <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <IconSparkle className="w-9 h-9 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Criar template de email</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Crie emails personalizados em português europeu para a sua base de empresas.</p>
                  </div>
                </div>
                <Link href="/networking" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Criar template <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <IconClock className="w-9 h-9 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Ver histórico de emails</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Consulte todos os emails enviados pela plataforma e o seu estado.</p>
                  </div>
                </div>
                <Link href="/historico" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Ver histórico <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
