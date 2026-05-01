"use client";

import { useState } from "react";
import type { Company } from "../types";
import AppShell from "../components/AppShell";
import DiscoverView from "../components/DiscoverView";
import CompanyDetailPanel from "../components/CompanyDetailPanel";

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

interface LoadingState {
  generating: boolean;
  sending: boolean;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DiscoverPage() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [discoveryCompanies, setDiscoveryCompanies] = useState<Company[]>([]);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    generating: false,
    sending: false,
  });

  function handleSelectCompany(company: Company) {
    setSelectedCompany(company);
    setEmailDraft(null);
    setSendResult(null);
    setGenerateError(null);
  }

  function handleEmailDraftChange(draft: EmailDraft) {
    setEmailDraft(draft);
  }

  async function handleGenerate() {
    if (!selectedCompany) return;
    setLoading((prev) => ({ ...prev, generating: true }));
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
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setGenerateError(data.error ?? "Erro ao gerar email.");
      } else {
        const draft = (await res.json()) as EmailDraft;
        setEmailDraft(draft);
      }
    } catch {
      setGenerateError("Erro de rede ao gerar email.");
    } finally {
      setLoading((prev) => ({ ...prev, generating: false }));
    }
  }

  async function handleSend() {
    if (!selectedCompany || !emailDraft) return;
    setLoading((prev) => ({ ...prev, sending: true }));
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
      if (res.ok && typeof data === "object" && data !== null && "success" in data) {
        setSendResult(data as SendResult);
      } else {
        const message =
          typeof data === "object" && data !== null && "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Erro ao enviar email.";
        setSendResult({ success: false, message });
      }
    } catch {
      setSendResult({ success: false, message: "Erro de rede ao enviar email." });
    } finally {
      setLoading((prev) => ({ ...prev, sending: false }));
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DiscoverView
          selectedCompany={selectedCompany}
          onSelectCompany={handleSelectCompany}
          onDiscoveryCompaniesChange={setDiscoveryCompanies}
        />
        {selectedCompany !== null && (
          <CompanyDetailPanel
            company={selectedCompany}
            companies={discoveryCompanies}
            emailDraft={emailDraft}
            sendResult={sendResult}
            generateError={generateError}
            loading={loading}
            onEmailDraftChange={handleEmailDraftChange}
            onGenerate={handleGenerate}
            onSend={handleSend}
          />
        )}
      </div>
    </AppShell>
  );
}
