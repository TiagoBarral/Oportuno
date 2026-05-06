"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import { triggerCsvDownload } from "../components/csvExport";
import type { EmailLogEntry, HistoricoResponse, HistoricoMeta } from "../types";

const dateFormatter = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "agora";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 28) return `há ${days} dias`;
  return formatDate(iso);
}

function escapeCsv(val: string): string {
  return `"${val.replace(/"/g, '""')}"`;
}

function buildHistoryCsvString(entries: EmailLogEntry[]): string {
  const header = ["Empresa", "Email", "Assunto", "Estado", "Data"].map(escapeCsv).join(",");
  const rows = entries.map((e) =>
    [e.companyName, e.email, e.subject, e.status === "SENT" ? "Enviado" : "Falhou", formatDate(e.createdAt)]
      .map(escapeCsv)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export default function HistoricoPage() {
  const [items, setItems] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<HistoricoMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SENT" | "FAILED">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const router = useRouter();
  const pageSize = 20;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/historico?page=${page}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as HistoricoResponse;
        setItems(data.items);
        setTotal(data.total);
        setMeta(data.meta);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filteredItems = statusFilter === "ALL" ? items : items.filter((i) => i.status === statusFilter);

  function handleRetry(item: EmailLogEntry) {
    const company = {
      id: item.companyId,
      placeId: "",
      name: item.companyName,
      address: null,
      industry: "",
      location: "",
      category: item.category,
      specialty: "",
      municipality: item.municipality,
      websiteUrl: null,
      hasWebsite: false,
      opportunity: "NONE" as const,
      email: item.email,
      phoneNumber: null,
      createdAt: item.createdAt,
    };
    sessionStorage.setItem("oportuno_bulk_selection", JSON.stringify([company]));
    router.push("/networking/send");
  }

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      const collected: EmailLogEntry[] = [];
      const firstRes = await fetch(`/api/historico?page=1&pageSize=500`);
      if (!firstRes.ok) throw new Error();
      const firstData = (await firstRes.json()) as HistoricoResponse;
      collected.push(...firstData.items);
      const serverTotal = firstData.total;
      const pages = Math.ceil(serverTotal / 500);
      for (let p = 2; p <= pages; p++) {
        const res = await fetch(`/api/historico?page=${p}&pageSize=500`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as HistoricoResponse;
        collected.push(...data.items);
      }
      const today = new Date().toISOString().slice(0, 10);
      triggerCsvDownload(buildHistoryCsvString(collected), `oportuno-historico-${today}.csv`);
    } catch {
      alert("Não foi possível exportar o histórico.");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-6">

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Histórico de Emails</h1>
              <p className="text-sm text-gray-500 mt-0.5">Todos os emails enviados pela plataforma</p>
            </div>
            <button
              type="button"
              onClick={() => void handleExportCsv()}
              disabled={exportLoading || total === 0}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exportLoading ? "A exportar..." : "Exportar histórico completo"}
            </button>
          </div>

          {meta !== null && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-blue-600">{meta.totalSent.toLocaleString("pt-PT")}</p>
                <p className="text-xs text-gray-500 mt-1">Total enviados</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-red-500">{meta.totalFailed.toLocaleString("pt-PT")}</p>
                <p className="text-xs text-gray-500 mt-1">Falhados</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-gray-700">{meta.sentThisMonth.toLocaleString("pt-PT")}</p>
                <p className="text-xs text-gray-500 mt-1">Este mês</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {(["ALL", "SENT", "FAILED"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f === "ALL" ? "Todos" : f === "SENT" ? "Enviados" : "Falhados"}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {statusFilter === "ALL" ? `${total} registos` : `${filteredItems.length} nesta página`}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Empresa</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Assunto</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Estado</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Data</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">A carregar...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-red-500">Não foi possível carregar o histórico.</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">Nenhum email encontrado.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{item.companyName}</td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{item.email}</td>
                        <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{item.subject}</td>
                        <td className="px-5 py-3">
                          {item.status === "SENT" ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Enviado</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">Falhou</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap" title={formatDate(item.createdAt)}>
                          {formatRelative(item.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          {item.status === "FAILED" && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRetry(item); }}
                              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
                            >
                              Reenviar
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={6} className="px-5 py-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Conteúdo do email</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.body}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && !loading && !error && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Página {page} de {totalPages} · {total} emails</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
