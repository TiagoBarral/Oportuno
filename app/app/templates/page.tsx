"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import { IconSparkle, IconDocument } from "../components/shared";
import type { EmailTemplate } from "../types";

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const TOM_LABELS: Record<string, string> = {
  profissional: "Profissional",
  amigavel: "Amigável",
  direto: "Direto",
};

const TOM_COLORS: Record<string, string> = {
  profissional: "bg-blue-50 text-blue-700",
  amigavel: "bg-green-50 text-green-700",
  direto: "bg-orange-50 text-orange-700",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.ok ? r.json() as Promise<EmailTemplate[]> : Promise.reject())
      .then((data) => setTemplates(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (expandedId === id) setExpandedId(null);
      } else {
        setDeleteError("Não foi possível eliminar o template.");
      }
    } catch {
      setDeleteError("Erro de rede. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-6">

          <header>
            <h1 className="text-xl font-bold text-gray-900">Modelos de email</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Templates guardados para reutilizar nas suas campanhas. Clique numa linha para ver o conteúdo.
            </p>
          </header>

          {deleteError !== null && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              A carregar...
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-10 text-center text-sm text-red-500">
              Não foi possível carregar os templates.
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                <IconSparkle className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Ainda não tem templates guardados</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
                  Crie o primeiro a partir do fluxo de envio — gere um email com IA, edite-o ao seu gosto e clique em "Guardar template".
                </p>
              </div>
              <Link
                href="/networking"
                className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Ir para Networking
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {templates.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

                  {/* Row header */}
                  <div
                    onClick={() => setExpandedId((prev) => prev === t.id ? null : t.id)}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {/* Chevron */}
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedId === t.id ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{t.subject}</p>
                    </div>

                    {/* Tom badge */}
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${TOM_COLORS[t.tom] ?? "bg-gray-100 text-gray-600"}`}>
                      {TOM_LABELS[t.tom] ?? t.tom}
                    </span>

                    {/* Date */}
                    <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      {dateFormatter.format(new Date(t.createdAt))}
                    </span>

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={deletingId === t.id}
                      onClick={(e) => { e.stopPropagation(); void handleDelete(t.id); }}
                      className="flex-shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === t.id ? "A eliminar..." : "Eliminar"}
                    </button>
                  </div>

                  {/* Expanded content */}
                  {expandedId === t.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                      <div className="grid grid-cols-2 gap-6">

                        {/* Left: brief metadata */}
                        <div className="flex flex-col gap-4">

                          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Briefing</p>

                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-0.5">O que ofereço</p>
                              <p className="text-sm text-gray-800">{t.oferta}</p>
                            </div>

                            {t.instrucoesAdicionais && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-0.5">Instruções adicionais</p>
                                <p className="text-sm text-gray-800">{t.instrucoesAdicionais}</p>
                              </div>
                            )}

                            {t.contextFileName && (
                              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                                <IconDocument className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-blue-700 truncate">{t.contextFileName}</p>
                                  <p className="text-xs text-blue-400">Ficheiro de contexto usado na geração</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs font-medium text-gray-500 mb-0.5">Assunto</p>
                            <p className="text-sm font-medium text-gray-800">{t.subject}</p>
                          </div>

                        </div>

                        {/* Right: email body */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Corpo do email</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{t.body}</p>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
