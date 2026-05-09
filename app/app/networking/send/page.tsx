"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  Company,
  BulkEmailTemplateBrief,
  BulkSendRecipient,
  BulkSendResult,
  AIContextFile,
  EmailAttachment,
  EmailTemplate,
} from "../../types";
import AppShell from "../../components/AppShell";
import {
  IconSparkle,
  IconDocument,
  IconPaperPlane,
  IconStar,
  IconUsers,
  IconBuilding,
  IconPaperclip,
  IconUpload,
} from "../../components/shared";


export default function BulkSendPage() {
  const [allSelected, setAllSelected] = useState<Company[]>([]);
  const [recipients, setRecipients] = useState<(Company & { email: string })[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [brief, setBrief] = useState<BulkEmailTemplateBrief>({
    oferta: "",
    tom: "profissional",
    instrucoesAdicionais: "",
  });

  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [results, setResults] = useState<BulkSendResult[] | null>(null);

  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [bodyDropdownOpen, setBodyDropdownOpen] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const bodyDropdownRef = useRef<HTMLDivElement>(null);

  const [contextFile, setContextFile] = useState<AIContextFile | null>(null);
  const [contextFileError, setContextFileError] = useState<string | null>(null);

  const [attachment, setAttachment] = useState<EmailAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [sendError, setSendError] = useState<string | null>(null);

  const [senderSettings, setSenderSettings] = useState<{ senderName: string | null; senderEmail: string | null; senderProfile: string | null; attachmentFilename: string | null } | null>(null);
  const [settingsAttachmentFilename, setSettingsAttachmentFilename] = useState<string | null>(null);

  const [contactedInSelection, setContactedInSelection] = useState<string[]>([]);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<EmailTemplate[]>([]);
  const [loadError, setLoadError] = useState(false);
  const loadDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() as Promise<{
        senderName: string | null;
        senderEmail: string | null;
        senderProfile: string | null;
        attachmentFilename: string | null;
      }> : Promise.reject())
      .then((data) => {
        setSenderSettings(data);
        // one-time pre-fill: only if oferta is still empty
        if (data.senderProfile && brief.oferta.trim() === "") {
          setBrief((prev) => ({ ...prev, oferta: data.senderProfile! }));
        }
        if (data.attachmentFilename) {
          setSettingsAttachmentFilename(data.attachmentFilename);
        }
      })
      .catch(() => setSenderSettings({ senderName: null, senderEmail: null, senderProfile: null, attachmentFilename: null }));
  }, []);

  useEffect(() => {
    if (recipients.length === 0) return;
    fetch("/api/contacted")
      .then((r) => r.ok ? r.json() as Promise<{ companyIds: string[] }> : Promise.reject())
      .then((data) => {
        const contacted = new Set(data.companyIds);
        const duplicates = recipients.filter((c) => contacted.has(c.id)).map((c) => c.name);
        setContactedInSelection(duplicates);
      })
      .catch(() => {});
  }, [recipients]);

  useEffect(() => {
    const raw = sessionStorage.getItem("oportuno_bulk_selection");
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as Company[];
        const withEmail = parsed.filter((c) => c.email !== null) as (Company & {
          email: string;
        })[];
        const excluded = parsed.filter((c) => c.email === null).length;
        setAllSelected(parsed);
        setRecipients(withEmail);
        setExcludedCount(excluded);
        sessionStorage.removeItem("oportuno_bulk_selection");
      } catch {
        console.error("Failed to parse bulk selection from sessionStorage");
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        subjectDropdownOpen &&
        subjectDropdownRef.current !== null &&
        !subjectDropdownRef.current.contains(e.target as Node)
      ) {
        setSubjectDropdownOpen(false);
      }
      if (
        bodyDropdownOpen &&
        bodyDropdownRef.current !== null &&
        !bodyDropdownRef.current.contains(e.target as Node)
      ) {
        setBodyDropdownOpen(false);
      }
      if (
        showLoadDropdown &&
        loadDropdownRef.current !== null &&
        !loadDropdownRef.current.contains(e.target as Node)
      ) {
        setShowLoadDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [subjectDropdownOpen, bodyDropdownOpen, showLoadDropdown]);

  function handleBriefChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setBrief((prev) => ({ ...prev, [name]: value }));
  }

  function handleTomChange(tom: BulkEmailTemplateBrief["tom"]) {
    setBrief((prev) => ({ ...prev, tom }));
  }

  function handleInsertPlaceholder(placeholder: string, target: "subject" | "body") {
    if (target === "subject") {
      const el = subjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? subjectTemplate.length;
      const end = el.selectionEnd ?? subjectTemplate.length;
      const next = subjectTemplate.slice(0, start) + placeholder + subjectTemplate.slice(end);
      setSubjectTemplate(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + placeholder.length, start + placeholder.length);
      });
      setSubjectDropdownOpen(false);
    } else {
      const el = bodyRef.current;
      if (!el) return;
      const start = el.selectionStart ?? bodyTemplate.length;
      const end = el.selectionEnd ?? bodyTemplate.length;
      const next = bodyTemplate.slice(0, start) + placeholder + bodyTemplate.slice(end);
      setBodyTemplate(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + placeholder.length, start + placeholder.length);
      });
      setBodyDropdownOpen(false);
    }
  }

  function handleContextFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setContextFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setContextFileError("O ficheiro não pode exceder 5 MB.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      setContextFileError("Apenas ficheiros PDF ou TXT são aceites.");
      return;
    }
    const reader = new FileReader();
    if (ext === "txt") {
      reader.onload = () => {
        if (typeof reader.result !== "string") { setContextFileError("Erro ao ler o ficheiro."); return; }
        setContextFile({ type: "txt", filename: file.name, content: reader.result });
      };
      reader.onerror = () => { setContextFileError("Erro ao ler o ficheiro."); };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        if (typeof reader.result !== "string") { setContextFileError("Erro ao ler o ficheiro."); return; }
        const base64 = reader.result.replace(/^data:[^;]+;base64,/, "");
        setContextFile({ type: "pdf", filename: file.name, content: base64 });
      };
      reader.onerror = () => { setContextFileError("Erro ao ler o ficheiro."); };
      reader.readAsDataURL(file);
    }
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachmentError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAttachmentError("O ficheiro não pode exceder 5 MB.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      setAttachmentError("Apenas ficheiros PDF são aceites.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") { setAttachmentError("Erro ao ler o ficheiro."); return; }
      const base64 = reader.result.replace(/^data:[^;]+;base64,/, "");
      setAttachment({ filename: file.name, content: base64 });
    };
    reader.onerror = () => { setAttachmentError("Erro ao ler o ficheiro."); };
    reader.readAsDataURL(file);
  }

  async function handleSaveTemplate() {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          subject: subjectTemplate,
          body: bodyTemplate,
          oferta: brief.oferta,
          tom: brief.tom,
          instrucoesAdicionais: brief.instrucoesAdicionais ?? null,
          contextFileName: contextFile?.filename ?? null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "Erro ao guardar template.");
      } else {
        setShowSaveForm(false);
        setTemplateName("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Erro de rede. Tente novamente.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleOpenLoadDropdown() {
    setLoadError(false);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = (await res.json()) as EmailTemplate[];
        setAvailableTemplates(data);
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    }
    setShowLoadDropdown(true);
  }

  function handleLoadTemplate(t: EmailTemplate) {
    setBrief({
      oferta: t.oferta,
      tom: t.tom,
      instrucoesAdicionais: t.instrucoesAdicionais ?? "",
    });
    setSubjectTemplate(t.subject);
    setBodyTemplate(t.body);
    setShowLoadDropdown(false);
  }

  async function handleGenerateTemplate() {
    setTemplateLoading(true);
    setTemplateError(null);
    try {
      const res = await fetch("/api/email/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...brief,
          ...(contextFile !== null ? { context: contextFile } : {}),
        }),
      });
      const data = (await res.json()) as { subject?: string; body?: string; error?: string };
      if (!res.ok) {
        setTemplateError(data.error ?? "Erro ao gerar template");
      } else {
        setSubjectTemplate(data.subject ?? "");
        setBodyTemplate(data.body ?? "");
      }
    } catch {
      setTemplateError("Erro de rede ao gerar template.");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleSend() {
    setSendLoading(true);
    setSendError(null);
    try {
      const recipientPayload: BulkSendRecipient[] = recipients.map((c) => ({
        companyId: c.id,
        name: c.name,
        municipality: c.municipality,
        category: c.category,
        email: c.email,
      }));
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectTemplate,
          body: bodyTemplate,
          recipients: recipientPayload,
          ...(attachment !== null ? { attachments: [attachment] } : {}),
        }),
      });
      const data = (await res.json()) as { results?: BulkSendResult[]; error?: string };
      if (res.ok && data.results) {
        setResults(data.results);
      } else {
        setSendError(data.error ?? "Erro ao enviar emails. Tente novamente.");
      }
    } catch {
      setSendError("Erro de rede ao enviar emails. Tente novamente.");
    } finally {
      setSendLoading(false);
    }
  }

  const senderConfigured =
    senderSettings !== null &&
    Boolean(senderSettings.senderName) &&
    Boolean(senderSettings.senderEmail);

  const sendDisabled =
    !senderConfigured ||
    recipients.length === 0 ||
    subjectTemplate.trim() === "" ||
    bodyTemplate.trim() === "" ||
    sendLoading;

  const wordCount =
    bodyTemplate.trim() === "" ? 0 : bodyTemplate.trim().split(/\s+/).length;

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const failCount = results?.filter((r) => !r.success).length ?? 0;

  if (mounted && allSelected.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">Nenhuma empresa selecionada</p>
            <p className="mt-1 text-sm text-gray-500">
              Volte ao Networking para escolher destinatários
            </p>
            <Link
              href="/networking"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Voltar ao Networking
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Enviar email em massa</h1>
            <p className="text-sm text-gray-500">
              Escreva uma mensagem ou use a IA para gerar um email personalizado.
            </p>
          </div>
          <Link
            href="/networking"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Voltar ao networking
          </Link>
        </header>

        {contactedInSelection.length > 0 && !warningDismissed && results === null && (
          <div className="flex-shrink-0 mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start justify-between gap-3">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Atenção:</span>{" "}
              {contactedInSelection.length === 1
                ? `${contactedInSelection[0]} já foi contactada anteriormente.`
                : (() => {
                    const shown = contactedInSelection.slice(0, 3).join(", ");
                    const rest = contactedInSelection.length - 3;
                    return `${contactedInSelection.length} empresas já foram contactadas anteriormente: ${shown}${rest > 0 ? ` e mais ${rest}` : ""}.`;
                  })()}{" "}
              Pode continuar ou voltar ao Networking para rever a seleção.
            </p>
            <button
              type="button"
              onClick={() => setWarningDismissed(true)}
              className="flex-shrink-0 text-amber-500 hover:text-amber-700 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden">

          <aside className="w-80 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
            <div className="p-5 flex flex-col gap-5">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <IconSparkle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Assistente IA</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-3">
                Preencha os campos abaixo para gerar um email com IA.
              </p>

              {senderSettings !== null && !senderSettings.senderProfile && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex items-center justify-between gap-2">
                  <span>Perfil de remetente não configurado.</span>
                  <Link href="/definicoes" className="font-medium text-amber-900 underline whitespace-nowrap">
                    Configurar →
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700" htmlFor="oferta">
                  1. A minha oferta <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="oferta"
                  name="oferta"
                  rows={3}
                  value={brief.oferta}
                  onChange={handleBriefChange}
                  placeholder="Descreva o serviço ou produto que está a promover..."
                  maxLength={300}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                />
                <p className="text-right text-xs text-gray-400">{brief.oferta.length}/300</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-gray-700">
                  2. Tom <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { value: "profissional", label: "Profissional", icon: <IconDocument className="w-4 h-4" /> },
                      { value: "amigavel", label: "Amigável", icon: <IconStar className="w-4 h-4" /> },
                      { value: "direto", label: "Direto", icon: <IconPaperPlane className="w-4 h-4" /> },
                    ] as const
                  ).map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTomChange(value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 px-1 text-xs font-medium transition-colors ${
                        brief.tom === value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-gray-700"
                  htmlFor="instrucoesAdicionais"
                >
                  3. Instruções adicionais{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  id="instrucoesAdicionais"
                  name="instrucoesAdicionais"
                  rows={3}
                  maxLength={150}
                  value={brief.instrucoesAdicionais ?? ""}
                  onChange={handleBriefChange}
                  placeholder="Ex: email curto, mencionar sustentabilidade"
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                />
                <p className="text-right text-xs text-gray-400">
                  {(brief.instrucoesAdicionais?.length ?? 0)}/150
                </p>

                <div className="mt-1">
                  {contextFile === null ? (
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                      <IconUpload className="w-4 h-4 flex-shrink-0" />
                      <span>Anexar contexto para a IA (PDF ou TXT, máx. 5 MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={handleContextFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconDocument className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs text-blue-700 font-medium truncate">
                          {contextFile.filename}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContextFile(null)}
                        className="ml-2 flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {contextFileError !== null && (
                    <p className="mt-1 text-xs text-red-600">{contextFileError}</p>
                  )}
                  {contextFile === null && settingsAttachmentFilename !== null && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <span>🤖</span>
                      <span className="truncate"><span className="font-medium text-gray-500">{settingsAttachmentFilename}</span> — usado como contexto</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerateTemplate()}
                disabled={templateLoading || brief.oferta.trim() === ""}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <IconSparkle className="w-4 h-4" />
                {templateLoading ? "A gerar..." : "Gerar com IA"}
              </button>
              <div className="relative" ref={loadDropdownRef}>
                <button
                  type="button"
                  onClick={() => void handleOpenLoadDropdown()}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                >
                  <span>Carregar template</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showLoadDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-gray-200 bg-white shadow-lg py-1 max-h-48 overflow-y-auto">
                    {loadError ? (
                      <p className="px-3 py-2 text-xs text-red-500">Erro ao carregar templates.</p>
                    ) : availableTemplates.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">Nenhum template guardado</p>
                    ) : (
                      availableTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleLoadTemplate(t)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-xs font-medium text-gray-800">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.subject}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {saveSuccess && (
                  <p className="text-xs text-green-600 font-medium">Template guardado!</p>
                )}
                {!showSaveForm ? (
                  <button
                    type="button"
                    disabled={subjectTemplate.trim() === "" || bodyTemplate.trim() === "" || brief.oferta.trim() === ""}
                    onClick={() => { setShowSaveForm(true); setSaveSuccess(false); }}
                    className="w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                    </svg>
                    Guardar template
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Nome do template (ex: Web para PMEs)"
                      maxLength={80}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    {saveError !== null && (
                      <p className="text-xs text-red-600">{saveError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saveLoading || templateName.trim() === ""}
                        onClick={() => void handleSaveTemplate()}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {saveLoading ? "A guardar..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSaveForm(false); setTemplateName(""); setSaveError(null); }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-gray-50">
            {results === null ? (
              <div className="p-6 flex flex-col gap-5">

                {/* De: sender field */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 w-8 flex-shrink-0">De:</span>
                  {senderSettings === null ? (
                    <span className="text-sm text-gray-400">A carregar...</span>
                  ) : senderSettings.senderName && senderSettings.senderEmail ? (
                    <>
                      <span className="text-sm text-gray-800 flex-1">
                        <span className="font-medium">{senderSettings.senderName}</span>
                        <span className="text-gray-400 ml-1">&lt;{senderSettings.senderEmail}&gt;</span>
                      </span>
                      <Link href="/definicoes" className="flex-shrink-0 text-xs text-blue-600 hover:underline">
                        Alterar
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-amber-600 flex-1">Remetente não configurado</span>
                      <Link href="/definicoes" className="flex-shrink-0 text-xs font-medium text-blue-600 hover:underline">
                        Configurar →
                      </Link>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                        1
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        Assunto <span className="text-red-500">*</span>
                      </span>
                    </div>
                    <div className="relative" ref={subjectDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setSubjectDropdownOpen((o) => !o)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Inserir placeholder
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {subjectDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-gray-200 bg-white shadow-lg py-1 min-w-[160px]">
                          {["{{empresa}}", "{{municipio}}", "{{setor}}"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleInsertPlaceholder(p, "subject")}
                              className="w-full text-left px-3 py-2 text-xs font-mono text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    ref={subjectRef}
                    type="text"
                    value={subjectTemplate}
                    onChange={(e) => setSubjectTemplate(e.target.value)}
                    placeholder={`Ex: Uma oportunidade para {{empresa}}`}
                    maxLength={200}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <p className="mt-1.5 text-right text-xs text-gray-400">
                    {subjectTemplate.length}/200
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                        2
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        Mensagem <span className="text-red-500">*</span>
                      </span>
                    </div>
                    <div className="relative" ref={bodyDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setBodyDropdownOpen((o) => !o)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Inserir placeholder
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {bodyDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-gray-200 bg-white shadow-lg py-1 min-w-[160px]">
                          {["{{empresa}}", "{{municipio}}", "{{setor}}"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleInsertPlaceholder(p, "body")}
                              className="w-full text-left px-3 py-2 text-xs font-mono text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    ref={bodyRef}
                    rows={14}
                    value={bodyTemplate}
                    onChange={(e) => setBodyTemplate(e.target.value)}
                    placeholder={"Escreva a sua mensagem aqui..."}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  />
                  <p className="mt-1.5 text-right text-xs text-gray-400">{wordCount} palavras</p>

                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-blue-700">
                          Personalização automática
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Os placeholders serão substituídos automaticamente com os dados de cada
                          empresa no momento do envio.
                        </p>
                        <div className="flex gap-2 mt-2">
                          {["{{empresa}}", "{{municipio}}", "{{setor}}"].map((p) => (
                            <span
                              key={p}
                              className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-mono text-blue-700"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <span className="text-sm font-semibold text-gray-700">Anexo</span>
                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                  </div>
                  {settingsAttachmentFilename !== null && attachment === null && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <IconPaperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 flex-1 truncate">
                        <span className="font-medium">{settingsAttachmentFilename}</span>
                        <span className="text-gray-400"> — incluído no envio</span>
                      </span>
                    </div>
                  )}
                  {attachment === null ? (
                    <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-dashed border-gray-200 px-4 py-5 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <IconPaperclip className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Anexar ficheiro ao email
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF até 5 MB — será enviado a todos os destinatários
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleAttachmentChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconDocument className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-green-800 truncate">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-green-600">Será enviado com cada email</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="ml-3 flex-shrink-0 rounded-lg border border-green-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                  {attachmentError !== null && (
                    <p className="mt-2 text-xs text-red-600">{attachmentError}</p>
                  )}
                </div>

                {templateError !== null && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {templateError}
                  </div>
                )}

                {sendError !== null && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {sendError}
                  </div>
                )}

              </div>
            ) : (
              <div className="p-6 flex flex-col gap-5">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">
                    Resultado do envio
                  </h2>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600">
                            Empresa
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600">
                            Email
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.map((r) => (
                          <tr key={r.companyId}>
                            <td className="px-4 py-2.5 font-medium text-gray-900">{r.name}</td>
                            <td className="px-4 py-2.5 text-gray-600">{r.email}</td>
                            <td className="px-4 py-2.5">
                              {r.success ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Enviado
                                </span>
                              ) : (
                                <span className="text-red-600 font-medium">
                                  ✗ Falhou{r.error ? ` — ${r.error}` : ""}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>

          <aside className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
            <div className="p-5 flex flex-col gap-4">

              <div className="flex items-center gap-2 text-gray-700">
                <IconUsers className="w-4 h-4" />
                <span className="text-sm font-semibold">Destinatários</span>
              </div>

              <div>
                <p className="text-3xl font-bold text-gray-900">{recipients.length}</p>
                <p className="text-xs text-gray-500">empresas selecionadas</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-medium text-green-600">
                    {recipients.length} com email
                  </span>
                  {excludedCount > 0 && (
                    <span className="text-xs font-medium text-red-500">
                      {excludedCount} sem email
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Empresas que vão receber
                </p>
                <ul className="flex flex-col gap-1">
                  {recipients.slice(0, 5).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <IconBuilding className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.municipality ?? "—"}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 truncate max-w-[60px]">
                        {c.category}
                      </span>
                    </li>
                  ))}
                </ul>
                {recipients.length > 5 && (
                  <p className="mt-2 text-xs text-gray-400 text-center">
                    + {recipients.length - 5} empresas
                  </p>
                )}
              </div>

              {excludedCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Importante</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        As empresas sem email foram excluídas automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </aside>

        </div>

        {results === null ? (
          <footer className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {!senderConfigured
                ? "Configure o remetente em Definições antes de enviar."
                : "Não é possível desfazer esta ação"}
            </p>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={sendDisabled}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <IconPaperPlane className="w-4 h-4" />
              {sendLoading
                ? "A enviar..."
                : `Enviar para ${recipients.length} empresa${recipients.length !== 1 ? "s" : ""}`}
            </button>
          </footer>
        ) : (
          <footer className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-6">
            <span className="text-sm font-semibold text-green-700">
              {successCount} enviado{successCount !== 1 ? "s" : ""} com sucesso
            </span>
            {failCount > 0 && (
              <span className="text-sm font-semibold text-red-600">
                {failCount} falha{failCount !== 1 ? "ram" : "u"}
              </span>
            )}
            <Link
              href="/networking"
              className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Voltar ao Networking
            </Link>
          </footer>
        )}

      </div>
    </AppShell>
  );
}
