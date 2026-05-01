"use client";

import type { ReactElement } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { Company } from "../types";
import type { Opportunity } from "../types";
import {
  opportunityLabel,
  opportunityColor,
  IconBuilding,
  IconPin,
  IconGlobe,
  IconTag,
  IconEnvelope,
  IconUsers,
  IconStar,
  IconSparkle,
  IconDocument,
  IconPaperPlane,
  IconArrowRight,
  IconTrendUp,
  IconTrendDown,
} from "./shared";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface EmailDraft {
  subject: string;
  body: string;
}

interface SendResult {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompanyDetailPanelProps {
  company: Company;
  companies: Company[];
  emailDraft: EmailDraft | null;
  sendResult: SendResult | null;
  generateError: string | null;
  loading: { generating: boolean; sending: boolean };
  onEmailDraftChange: (draft: EmailDraft) => void;
  onGenerate: () => void;
  onSend: () => void;
}

// ---------------------------------------------------------------------------
// Sparkline mock data
// ---------------------------------------------------------------------------

const sparkData = {
  empresas: [{ v: 5 }, { v: 8 }, { v: 6 }, { v: 10 }, { v: 14 }, { v: 12 }, { v: 20 }],
  boas:     [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 },  { v: 8 },  { v: 10 }, { v: 14 }],
  fracos:   [{ v: 3 }, { v: 5 }, { v: 4 }, { v: 7 },  { v: 6 },  { v: 8 },  { v: 10 }],
  semOp:    [{ v: 8 }, { v: 7 }, { v: 9 }, { v: 6 },  { v: 5 },  { v: 4 },  { v: 4 }],
  emails:   [{ v: 0 }, { v: 1 }, { v: 1 }, { v: 3 },  { v: 5 },  { v: 8 },  { v: 12 }],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompanyDetailPanel({
  company,
  companies,
  emailDraft,
  sendResult,
  generateError,
  loading,
  onEmailDraftChange,
  onGenerate,
  onSend,
}: CompanyDetailPanelProps): ReactElement {
  // Stats bar computations
  const total = companies.length;
  const boas = companies.filter((c) => c.opportunity === "NO_WEBSITE").length;
  const fracos = companies.filter((c) => c.opportunity === "WEAK_WEBSITE").length;
  const semOp = companies.filter((c) => c.opportunity === "NONE").length;
  const boasPct = total > 0 ? Math.round((boas / total) * 100) : 0;
  const fracosPct = total > 0 ? Math.round((fracos / total) * 100) : 0;
  const semOpPct = total > 0 ? Math.round((semOp / total) * 100) : 0;

  const statsCards: Array<{
    label: string;
    value: number | string;
    trend: string;
    trendColor: string;
    data: { v: number }[];
    stroke: string;
    trendArrow: ({ className }: { className?: string }) => ReactElement;
    trendPct: string;
    trendPctColor: string;
  }> = [
    { label: "Empresas encontradas", value: total,  trend: total > 0 ? `+${total} nesta pesquisa` : "Sem dados", trendColor: "text-blue-500",   data: sparkData.empresas, stroke: "#3b82f6", trendArrow: IconTrendUp,   trendPct: "+12%", trendPctColor: "text-green-500"  },
    { label: "Boas oportunidades",   value: boas,   trend: total > 0 ? `${boasPct}% do total`       : "Sem dados", trendColor: "text-green-500", data: sparkData.boas,     stroke: "#22c55e", trendArrow: IconTrendUp,   trendPct: "+27%", trendPctColor: "text-green-500"  },
    { label: "Sites fracos",         value: fracos, trend: total > 0 ? `${fracosPct}% do total`     : "Sem dados", trendColor: "text-amber-500", data: sparkData.fracos,   stroke: "#f59e0b", trendArrow: IconTrendUp,   trendPct: "+33%", trendPctColor: "text-amber-500"  },
    { label: "Sem oportunidade",     value: semOp,  trend: total > 0 ? `${semOpPct}% do total`      : "Sem dados", trendColor: "text-gray-400",  data: sparkData.semOp,    stroke: "#9ca3af", trendArrow: IconTrendDown, trendPct: "-40%", trendPctColor: "text-red-400"    },
    { label: "Emails enviados",      value: 0,      trend: "Este mês",                               trendColor: "text-purple-500", data: sparkData.emails,   stroke: "#a855f7", trendArrow: IconTrendUp,   trendPct: "+20%", trendPctColor: "text-purple-500" },
  ];

  return (
    <div className="flex overflow-hidden">

      {/* Scrollable center section */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="flex flex-col gap-5 p-6 max-w-4xl mx-auto w-full">

          {/* 1. Header card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                <IconBuilding className="w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                  {company.name}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 truncate">
                  {company.address ?? "Endereço não disponível"}
                </p>
              </div>
              <span className={`flex-shrink-0 mt-0.5 rounded-full px-2 py-1 text-xs font-medium ${opportunityColor(company.opportunity)}`}>
                {opportunityLabel(company.opportunity)}
              </span>
            </div>
            {(company.websiteUrl !== null || company.phoneNumber !== null || company.email !== null) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {company.websiteUrl !== null && (
                  <a
                    href={
                      company.websiteUrl.startsWith("http://") || company.websiteUrl.startsWith("https://")
                        ? company.websiteUrl
                        : `https://${company.websiteUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline truncate max-w-xs"
                  >
                    <span className="text-xs select-none">🌐</span>
                    <span className="truncate">{company.websiteUrl}</span>
                  </a>
                )}
                {company.phoneNumber !== null && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="text-xs select-none">📞</span>
                    {company.phoneNumber}
                  </span>
                )}
                {company.email !== null && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="text-xs select-none">✉</span>
                    {company.email}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 2. Opportunity alert — only when NONE */}
          {company.opportunity === "NONE" && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 flex gap-3">
              <span className="text-blue-400 text-base select-none flex-shrink-0 mt-0.5">ℹ</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">Sem oportunidade identificada</p>
                <p className="mt-0.5 text-xs text-blue-600 leading-relaxed">
                  Esta empresa tem presença online adequada. Não é possível gerar email de outreach.
                </p>
              </div>
            </div>
          )}

          {/* 3. Info grid */}
          <div className="grid grid-cols-2 gap-4">

            {/* Visão Geral */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Visão Geral</p>
              <dl className="flex flex-col gap-3">
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconBuilding className="w-3.5 h-3.5" />
                      Categoria
                    </span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-800 mt-0.5">{company.industry || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconPin className="w-3.5 h-3.5" />
                      Localização
                    </span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-800 mt-0.5">{company.location || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconGlobe className="w-3.5 h-3.5" />
                      Website
                    </span>
                  </dt>
                  <dd className={`text-sm font-medium mt-0.5 ${company.websiteUrl ? "text-green-600" : "text-gray-300"}`}>
                    {company.websiteUrl ? "Tem website" : "Sem website"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconTag className="w-3.5 h-3.5" />
                      Oportunidade
                    </span>
                  </dt>
                  <dd className="mt-0.5">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${opportunityColor(company.opportunity)}`}>
                      {opportunityLabel(company.opportunity)}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Presença Online */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Presença Online</p>
              <dl className="flex flex-col gap-3">
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconGlobe className="w-3.5 h-3.5" />
                      Website
                    </span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-800 mt-0.5 truncate">
                    {company.websiteUrl ?? "Sem website"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconEnvelope className="w-3.5 h-3.5" />
                      Email de contacto
                    </span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-800 mt-0.5">
                    {company.email ?? "Não encontrado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconUsers className="w-3.5 h-3.5" />
                      Redes sociais
                    </span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-300 mt-0.5">Não disponível</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <IconStar className="w-3.5 h-3.5" />
                      Avaliação Google
                    </span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-300 mt-0.5">Não disponível</dd>
                </div>
              </dl>
            </div>

          </div>

          {/* 4. Email draft card — only when emailDraft !== null */}
          {emailDraft !== null && (
            <div id="email-draft" className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Rascunho de Email</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email-subject" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Assunto
                  </label>
                  <input
                    id="email-subject"
                    type="text"
                    value={emailDraft.subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onEmailDraftChange({ ...emailDraft, subject: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="email-body" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Mensagem
                  </label>
                  <textarea
                    id="email-body"
                    rows={10}
                    value={emailDraft.body}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      onEmailDraftChange({ ...emailDraft, body: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                </div>
              </div>
              {sendResult !== null && (
                <p className={`mt-3 text-sm ${sendResult.success ? "text-green-600" : "text-red-500"}`}>
                  {sendResult.success ? "Email enviado com sucesso." : `Erro ao enviar: ${sendResult.message}`}
                </p>
              )}
            </div>
          )}

          {/* 5. Stats bar — only shown when discovery results are available */}
          {companies.length > 0 && <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Desempenho</p>
              <span className="text-xs text-gray-400">Última pesquisa: agora mesmo</span>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {statsCards.map((card) => {
                const TrendArrow = card.trendArrow;
                return (
                  <div key={card.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-150 flex flex-col gap-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 truncate">{card.label}</p>
                    <p className="text-2xl font-semibold text-gray-900 tabular-nums mt-3 leading-none">{card.value}</p>
                    <p className={`text-xs font-medium mt-1.5 h-4 truncate ${card.trendColor}`}>{card.trend}</p>
                    <div className="mt-3 h-10 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={card.data}>
                          <Line type="monotone" dataKey="v" stroke={card.stroke} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={`mt-2 flex items-center gap-1 ${card.trendPctColor}`}>
                      <TrendArrow className="w-3 h-3" />
                      <span className="text-[10px] font-medium">{card.trendPct} vs. última pesquisa</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}

        </div>
      </div>

      {/* 6. Right action panel */}
      <aside className="w-72 flex-shrink-0 flex flex-col gap-4 p-4 bg-gray-50 border-l border-gray-200 overflow-y-auto">

        {/* Card 1 — Gerar Email */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-150">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <span className="flex items-center gap-1.5">
                <IconSparkle className="w-3.5 h-3.5" />
                Gerar Email
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Gera um email personalizado com base na empresa e oportunidade selecionadas.
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading.generating || company.opportunity === "NONE"}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading.generating ? "A gerar..." : "Gerar Email"}
          </button>
          {generateError !== null && (
            <p className="text-xs text-red-500">{generateError}</p>
          )}
        </div>

        {/* Card 2 — Rascunho de Email */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-150">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <span className="flex items-center gap-1.5">
                <IconDocument className="w-3.5 h-3.5" />
                Rascunho de Email
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Revise e personalize o email gerado antes de enviar.
            </p>
          </div>
          <button
            type="button"
            disabled={emailDraft === null}
            onClick={() => {
              document.getElementById("email-draft")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold text-center transition-colors disabled:cursor-not-allowed ${
              emailDraft !== null
                ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                : "border-gray-200 text-gray-300"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              Ver Rascunho
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* Card 3 — Enviar Email */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-150">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <span className="flex items-center gap-1.5">
                <IconPaperPlane className="w-3.5 h-3.5" />
                Enviar Email
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Envia o email diretamente para o contacto da empresa.
            </p>
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={company.email === null || emailDraft === null || loading.sending}
            className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading.sending ? "A enviar..." : (
              <span className="flex items-center justify-center gap-2">
                <IconPaperPlane className="w-3.5 h-3.5" />
                Enviar Email
              </span>
            )}
          </button>
          {sendResult !== null && (
            <p className={`text-xs ${sendResult.success ? "text-green-600" : "text-red-500"}`}>
              {sendResult.success ? "Enviado com sucesso." : `Erro ao enviar: ${sendResult.message}`}
            </p>
          )}
          {company.email === null && (
            <p className="text-xs text-gray-400">Email de contacto não disponível.</p>
          )}
        </div>

      </aside>

    </div>
  );
}
