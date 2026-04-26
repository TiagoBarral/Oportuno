"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { Company, Filters, Opportunity } from "./types";

// ---------------------------------------------------------------------------
// Helpers — defined at module level, outside the component
// ---------------------------------------------------------------------------

function opportunityLabel(o: Opportunity): string {
  if (o === "NO_WEBSITE") return "Sem website";
  if (o === "WEAK_WEBSITE") return "Site fraco";
  return "Sem oportunidade";
}

function opportunityColor(o: Opportunity): string {
  if (o === "NO_WEBSITE") return "text-green-600 bg-green-50";
  if (o === "WEAK_WEBSITE") return "text-yellow-700 bg-yellow-50";
  return "text-gray-500 bg-gray-100";
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const IconSearch = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const IconPin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IconBuilding = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
  </svg>
);

const IconGlobe = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const IconTag = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const IconEnvelope = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const IconUsers = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const IconStar = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const IconSparkle = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const IconDocument = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IconPaperPlane = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const IconArrowRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const IconTrendUp = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const IconTrendDown = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
  </svg>
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LoadingState {
  companies: boolean;
  pipeline: boolean;
  generating: boolean;
  sending: boolean;
}

interface EmailDraft {
  subject: string;
  body: string;
}

interface SendResult {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Sparkline mock data
// ---------------------------------------------------------------------------

const sparkData = {
  empresas:   [{ v: 5 }, { v: 8 }, { v: 6 }, { v: 10 }, { v: 14 }, { v: 12 }, { v: 20 }],
  boas:       [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 },  { v: 8 },  { v: 10 }, { v: 14 }],
  fracos:     [{ v: 3 }, { v: 5 }, { v: 4 }, { v: 7 },  { v: 6 },  { v: 8 },  { v: 10 }],
  semOp:      [{ v: 8 }, { v: 7 }, { v: 9 }, { v: 6 },  { v: 5 },  { v: 4 },  { v: 4 }],
  emails:     [{ v: 0 }, { v: 1 }, { v: 1 }, { v: 3 },  { v: 5 },  { v: 8 },  { v: 12 }],
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function Home() {
  const [filters, setFilters] = useState<Filters>({
    industry: "",
    location: "",
    opportunity: "",
    hasWebsite: "",
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [loading, setLoading] = useState<LoadingState>({
    companies: false,
    pipeline: false,
    generating: false,
    sending: false,
  });

  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const [pipelineNote, setPipelineNote] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<{ done: number; total: number } | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  async function fetchCompanies(currentFilters: Filters) {
    setLoading((l) => ({ ...l, companies: true }));
    setCompaniesError(null);
    try {
      const params = new URLSearchParams();
      if (currentFilters.industry) params.set("industry", currentFilters.industry);
      if (currentFilters.location) params.set("location", currentFilters.location);
      if (currentFilters.opportunity) params.set("opportunity", currentFilters.opportunity);
      if (currentFilters.hasWebsite) params.set("hasWebsite", currentFilters.hasWebsite);
      const res = await fetch(`/api/companies?${params.toString()}`);
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error("Resposta inesperada do servidor.");
      const validOpportunities = new Set(["NO_WEBSITE", "WEAK_WEBSITE", "NONE"]);
      const companies = (data as unknown[]).filter(
        (item): item is Company =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          typeof (item as Record<string, unknown>).id === "string" &&
          "name" in item &&
          typeof (item as Record<string, unknown>).name === "string" &&
          "opportunity" in item &&
          validOpportunities.has((item as Record<string, unknown>).opportunity as string),
      );
      setCompanies(companies);
    } catch {
      setCompaniesError("Erro ao carregar empresas.");
    } finally {
      setLoading((l) => ({ ...l, companies: false }));
    }
  }


  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPipelineNote(null);
    fetchCompanies(filters);
  }

  function handleSelectCompany(company: Company) {
    setSelectedCompany(company);
    setEmailDraft(null);
    setSendResult(null);
    setGenerateError(null);
  }

  async function handleDiscover() {
    if (!filters.industry || !filters.location) {
      setPipelineNote({ message: "Preencha o setor e a localização antes de descobrir empresas.", type: "error" });
      return;
    }
    setPipelineNote(null);
    setPipelineProgress(null);
    setSelectedCompany(null);
    setEmailDraft(null);
    setSendResult(null);
    setGenerateError(null);
    setLoading((l) => ({ ...l, pipeline: true }));
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: filters.industry,
          location: filters.location,
          radius: 5000,
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
      const jobData = await res.json() as { jobId: string; status: string; queued: boolean };

      if (jobData.queued) {
        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const pollRes = await fetch(`/api/pipeline/${jobData.jobId}`);
              if (!pollRes.ok) { clearInterval(interval); reject(new Error("Polling falhou.")); return; }
              const poll = await pollRes.json() as { status: string; progress: { done: number; total: number } };
              setPipelineProgress({ done: poll.progress.done, total: poll.progress.total });
              if (poll.status === "DONE") { clearInterval(interval); resolve(); }
              else if (poll.status === "FAILED") { clearInterval(interval); reject(new Error("Descoberta falhou.")); }
            } catch (err) { clearInterval(interval); reject(err); }
          }, 2000);
        });
      }

      await fetchCompanies(filters);
      setPipelineNote({ message: "Descoberta concluída.", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro na descoberta.";
      setPipelineNote({ message, type: "error" });
    } finally {
      setLoading((l) => ({ ...l, pipeline: false }));
      setPipelineProgress(null);
    }
  }

  async function handleGenerate() {
    if (!selectedCompany || selectedCompany.opportunity === "NONE") return;
    setLoading((l) => ({ ...l, generating: true }));
    setGenerateError(null);
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedCompany.name,
          industry: selectedCompany.industry,
          opportunityType: selectedCompany.opportunity,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Erro ao gerar email.";
        throw new Error(message);
      }
      if (
        typeof data === "object" &&
        data !== null &&
        "subject" in data &&
        "body" in data &&
        typeof (data as Record<string, unknown>).subject === "string" &&
        typeof (data as Record<string, unknown>).body === "string"
      ) {
        const d = data as { subject: string; body: string };
        setEmailDraft({ subject: d.subject, body: d.body });
      } else {
        throw new Error("Resposta inesperada do servidor.");
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Erro ao gerar email.",
      );
    } finally {
      setLoading((l) => ({ ...l, generating: false }));
    }
  }

  async function handleSend() {
    if (!selectedCompany || !selectedCompany.email || !emailDraft) return;
    setLoading((l) => ({ ...l, sending: true }));
    setSendResult(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          to: selectedCompany.email,
          subject: emailDraft.subject,
          body: emailDraft.body,
        }),
      });
      const data: unknown = await res.json();
      if (
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as Record<string, unknown>).success === true
      ) {
        setSendResult({ success: true, message: "Email enviado com sucesso." });
      } else {
        const message =
          typeof data === "object" && data !== null
            ? ((data as Record<string, unknown>).error as string | undefined) ??
              ((data as Record<string, unknown>).message as string | undefined) ??
              "Erro desconhecido."
            : "Erro desconhecido.";
        setSendResult({ success: false, message });
      }
    } catch {
      setSendResult({ success: false, message: "Erro de rede ao enviar." });
    } finally {
      setLoading((l) => ({ ...l, sending: false }));
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* COLUMN 1: Main sidebar */}
      <aside className="w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">

        {/* Brand header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Oportuno</h1>
          <p className="text-xs text-gray-400 mt-0.5">Aquisição de clientes</p>
        </div>

        {/* DESCOBERTA section */}
        <section className="border-b border-gray-100 flex-shrink-0">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Descoberta</p>
          </div>
          <div className="px-5 pb-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDiscover}
              disabled={loading.pipeline}
              className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading.pipeline
                ? pipelineProgress !== null && pipelineProgress.total > 0
                  ? `A processar: ${pipelineProgress.done}/${pipelineProgress.total}`
                  : "A descobrir..."
                : (
                  <span className="flex items-center justify-center gap-2">
                    <IconSearch className="w-4 h-4" />
                    Descobrir Empresas
                  </span>
                )}
            </button>
            {pipelineNote !== null && (
              <p className={pipelineNote.type === "success" ? "text-xs text-green-600" : "text-xs text-red-500"}>
                {pipelineNote.message}
              </p>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                name="industry"
                type="text"
                autoComplete="off"
                placeholder="Setor (ex: restaurante)"
                value={filters.industry}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IconPin className="w-4 h-4" />
              </span>
              <input
                name="location"
                type="text"
                autoComplete="off"
                placeholder="Localização (ex: Lisboa)"
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* RESULTADOS section */}
        <section className="flex flex-col flex-1 min-h-0">

          {/* Section header row */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Resultados</p>
            {!loading.companies && companiesError === null && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {companies.length}
              </span>
            )}
          </div>

          {/* Filter form */}
          <form onSubmit={handleSearch} className="px-5 pb-3 flex flex-col gap-3 flex-shrink-0">
            <select
              name="opportunity"
              value={filters.opportunity}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas as oportunidades</option>
              <option value="NO_WEBSITE">Sem website</option>
              <option value="WEAK_WEBSITE">Site fraco</option>
              <option value="NONE">Sem oportunidade</option>
            </select>
            <select
              name="hasWebsite"
              value={filters.hasWebsite}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Website: todos</option>
              <option value="true">Têm website</option>
              <option value="false">Não têm website</option>
            </select>
            <button
              type="submit"
              disabled={loading.companies}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading.companies ? "A pesquisar..." : "Pesquisar"}
            </button>
          </form>

          {/* Scrollable company list */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">

            {/* Loading */}
            {loading.companies && (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">A carregar...</p>
              </div>
            )}

            {/* Error */}
            {!loading.companies && companiesError !== null && (
              <div className="py-6 px-2">
                <p className="text-sm text-red-500">{companiesError}</p>
              </div>
            )}

            {/* Empty */}
            {!loading.companies && companiesError === null && companies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <IconSearch className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">Nenhuma empresa encontrada</p>
                <p className="mt-1 text-xs text-gray-500">
                  Clique em &lsquo;Descobrir Empresas&rsquo; para iniciar a pesquisa
                </p>
              </div>
            )}

            {/* Company card list */}
            {!loading.companies && companiesError === null && companies.length > 0 && (
              <ul role="list" className="flex flex-col gap-2 pt-1">
                {companies.map((company) => {
                  const isSelected = selectedCompany?.id === company.id;
                  return (
                    <li key={company.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCompany(company)}
                        className={`w-full text-left rounded-xl border px-4 py-3.5 shadow-sm transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                            : "border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-500">
                              {company.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                                {company.name}
                              </p>
                              <span className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${opportunityColor(company.opportunity)}`}>
                                {opportunityLabel(company.opportunity)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {company.industry}{company.industry && company.location ? " · " : ""}{company.location}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

          </div>
        </section>

      </aside>

      {/* COLUMN 3: Main content */}
      <main className="flex-1 overflow-y-auto scroll-smooth bg-gray-100 min-w-0">
        {selectedCompany === null ? (

          /* ── Empty state ── */
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                <span className="text-gray-400 text-xl select-none">⊙</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Nenhuma empresa selecionada</p>
              <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                Selecione uma empresa da lista para avaliar a oportunidade e gerar um email de contacto.
              </p>
            </div>
          </div>

        ) : (

          /* ── Selected company view ── */
          <div className="flex flex-col gap-5 p-6 max-w-4xl mx-auto w-full">

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                  <IconBuilding className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                    {selectedCompany.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500 truncate">
                    {selectedCompany.address ?? "Endereço não disponível"}
                  </p>
                </div>
                <span className={`flex-shrink-0 mt-0.5 rounded-full px-2 py-1 text-xs font-medium ${opportunityColor(selectedCompany.opportunity)}`}>
                  {opportunityLabel(selectedCompany.opportunity)}
                </span>
              </div>
              {(selectedCompany.websiteUrl !== null || selectedCompany.phoneNumber !== null || selectedCompany.email !== null) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {selectedCompany.websiteUrl !== null && (
                    <a
                      href={
                        selectedCompany.websiteUrl.startsWith("http://") || selectedCompany.websiteUrl.startsWith("https://")
                          ? selectedCompany.websiteUrl
                          : `https://${selectedCompany.websiteUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline truncate max-w-xs"
                    >
                      <span className="text-xs select-none">🌐</span>
                      <span className="truncate">{selectedCompany.websiteUrl}</span>
                    </a>
                  )}
                  {selectedCompany.phoneNumber !== null && (
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <span className="text-xs select-none">📞</span>
                      {selectedCompany.phoneNumber}
                    </span>
                  )}
                  {selectedCompany.email !== null && (
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <span className="text-xs select-none">✉</span>
                      {selectedCompany.email}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Opportunity alert — only when NONE */}
            {selectedCompany.opportunity === "NONE" && (
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

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">

              {/* VISÃO GERAL */}
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
                    <dd className="text-sm font-medium text-gray-800 mt-0.5">{selectedCompany.industry || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <IconPin className="w-3.5 h-3.5" />
                        Localização
                      </span>
                    </dt>
                    <dd className="text-sm font-medium text-gray-800 mt-0.5">{selectedCompany.location || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <IconGlobe className="w-3.5 h-3.5" />
                        Website
                      </span>
                    </dt>
                    <dd className={`text-sm font-medium mt-0.5 ${selectedCompany.websiteUrl ? "text-green-600" : "text-gray-300"}`}>
                      {selectedCompany.websiteUrl ? "Tem website" : "Sem website"}
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
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${opportunityColor(selectedCompany.opportunity)}`}>
                        {opportunityLabel(selectedCompany.opportunity)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* PRESENÇA ONLINE */}
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
                      {selectedCompany.websiteUrl ?? "Sem website"}
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
                      {selectedCompany.email ?? "Não encontrado"}
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

            {/* Email draft card — only when emailDraft !== null */}
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
                        setEmailDraft((d) => d !== null ? { ...d, subject: e.target.value } : d)
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
                        setEmailDraft((d) => d !== null ? { ...d, body: e.target.value } : d)
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

            {/* Stats bar */}
            {(() => {
              const total = companies.length;
              const boas = companies.filter((c) => c.opportunity === "NO_WEBSITE").length;
              const fracos = companies.filter((c) => c.opportunity === "WEAK_WEBSITE").length;
              const semOp = companies.filter((c) => c.opportunity === "NONE").length;
              const boasPct = total > 0 ? Math.round((boas / total) * 100) : 0;
              const fracosPct = total > 0 ? Math.round((fracos / total) * 100) : 0;
              const semOpPct = total > 0 ? Math.round((semOp / total) * 100) : 0;

              const cards: Array<{
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
                { label: "Empresas encontradas", value: total,  trend: total > 0 ? `+${total} nesta pesquisa` : "Sem dados", trendColor: "text-blue-500",   data: sparkData.empresas, stroke: "#3b82f6", trendArrow: IconTrendUp,   trendPct: "+12%", trendPctColor: "text-green-500" },
                { label: "Boas oportunidades",   value: boas,   trend: total > 0 ? `${boasPct}% do total`       : "Sem dados", trendColor: "text-green-500", data: sparkData.boas,     stroke: "#22c55e", trendArrow: IconTrendUp,   trendPct: "+27%", trendPctColor: "text-green-500" },
                { label: "Sites fracos",         value: fracos, trend: total > 0 ? `${fracosPct}% do total`     : "Sem dados", trendColor: "text-amber-500", data: sparkData.fracos,   stroke: "#f59e0b", trendArrow: IconTrendUp,   trendPct: "+33%", trendPctColor: "text-amber-500" },
                { label: "Sem oportunidade",     value: semOp,  trend: total > 0 ? `${semOpPct}% do total`      : "Sem dados", trendColor: "text-gray-400",  data: sparkData.semOp,    stroke: "#9ca3af", trendArrow: IconTrendDown, trendPct: "-40%", trendPctColor: "text-red-400"   },
                { label: "Emails enviados",      value: 0,      trend: "Este mês",                               trendColor: "text-purple-500", data: sparkData.emails,   stroke: "#a855f7", trendArrow: IconTrendUp,   trendPct: "+20%", trendPctColor: "text-purple-500" },
              ];

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Desempenho</p>
                    <span className="text-xs text-gray-400">Última pesquisa: agora mesmo</span>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {cards.map((card) => {
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
                </div>
              );
            })()}

          </div>
        )}
      </main>

      {/* COLUMN 4: Right action panel */}
      <aside className="w-72 flex-shrink-0 flex flex-col gap-4 p-4 bg-gray-50 border-l border-gray-200 overflow-y-auto">

        {/* Card 1 — GERAR EMAIL */}
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
            onClick={handleGenerate}
            disabled={loading.generating || !selectedCompany || selectedCompany.opportunity === "NONE"}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading.generating ? "A gerar..." : "Gerar Email"}
          </button>
          {generateError !== null && (
            <p className="text-xs text-red-500">{generateError}</p>
          )}
        </div>

        {/* Card 2 — RASCUNHO DE EMAIL */}
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

        {/* Card 3 — ENVIAR EMAIL */}
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
            onClick={handleSend}
            disabled={!selectedCompany || !selectedCompany.email || !emailDraft || loading.sending}
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
          {selectedCompany !== null && selectedCompany.email === null && (
            <p className="text-xs text-gray-400">Email de contacto não disponível.</p>
          )}
        </div>

      </aside>

    </div>
  );
}
