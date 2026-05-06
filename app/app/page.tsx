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
        <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-10">

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="grid grid-cols-5 gap-6">

              <div className="col-span-3 flex flex-col justify-center gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                    Encontre novos clientes<br />
                    <span className="text-blue-600">em minutos</span>{" "}
                    <span>🚀</span>
                  </h1>
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-md">
                    Aceda à nossa base de empresas ou descubra novas empresas que ainda não estão na sua base.
                  </p>
                </div>

                <div className="flex gap-3">
                  {/* Explorar card */}
                  <Link href="/networking"
                    className="flex-1 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow relative overflow-hidden group">
                    {/* Decorative blob */}
                    <svg className="absolute bottom-0 left-0 text-blue-100 w-20 h-16" viewBox="0 0 80 60" fill="currentColor">
                      <ellipse cx="20" cy="60" rx="40" ry="30"/>
                    </svg>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <IconBuilding className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-700 leading-snug">Explorar base de empresas</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {statsLoading ? "A carregar..." : `Use a nossa base de ${(stats?.totalCompanies ?? 0).toLocaleString("pt-PT")} empresas para encontrar oportunidades.`}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                        <IconArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Link>

                  {/* Descobrir card */}
                  <Link href="/discover"
                    className="flex-1 bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow relative overflow-hidden group">
                    {/* Decorative blob */}
                    <svg className="absolute bottom-0 left-0 text-purple-100 w-20 h-16" viewBox="0 0 80 60" fill="currentColor">
                      <ellipse cx="20" cy="60" rx="40" ry="30"/>
                    </svg>
                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <IconSearch className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-purple-700 leading-snug">Descobrir novas empresas</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">Encontre empresas por nicho, localização ou palavra-chave.</p>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                        <IconArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Right — stats card */}
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <circle cx="32" cy="32" r="24" stroke="#2563EB" strokeWidth="4"/>
                    <rect x="20" y="26" width="24" height="16" rx="2" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2"/>
                    <rect x="24" y="30" width="4" height="8" rx="1" fill="#2563EB"/>
                    <rect x="30" y="30" width="4" height="8" rx="1" fill="#2563EB"/>
                    <rect x="36" y="30" width="4" height="8" rx="1" fill="#2563EB"/>
                    <line x1="50" y1="50" x2="68" y2="68" stroke="#1D4ED8" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-700">A sua base de dados</p>
                  <p className="text-xs text-blue-500 mt-0.5">Empresas disponíveis na sua base</p>
                </div>

                <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 border border-blue-100 pointer-events-none select-none">
                  <IconSearch className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  <span className="text-xs text-gray-300">Ex.: clínicas dentárias em Lisboa</span>
                </div>

                <div className="flex flex-col divide-y divide-blue-100">
                  <div className="flex items-center gap-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconEnvelope className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600 flex-1">Com email</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {statsLoading || statsError ? "—" : (stats?.withEmail ?? 0).toLocaleString("pt-PT")}
                    </span>
                    <span className="text-xs text-gray-400">empresas</span>
                  </div>

                  <div className="flex items-center gap-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconGlobe className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600 flex-1">Com website</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {statsLoading || statsError ? "—" : (stats?.withWebsite ?? 0).toLocaleString("pt-PT")}
                    </span>
                    <span className="text-xs text-gray-400">empresas</span>
                  </div>

                  <div className="flex items-center gap-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <IconPhone className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600 flex-1">Com telefone</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {statsLoading || statsError ? "—" : (stats?.withPhone ?? 0).toLocaleString("pt-PT")}
                    </span>
                    <span className="text-xs text-gray-400">empresas</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-gray-900">Como funciona</h2>
            <div className="flex items-center">

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
              <div className="flex-shrink-0 px-2">
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
              <div className="flex-shrink-0 px-2">
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
