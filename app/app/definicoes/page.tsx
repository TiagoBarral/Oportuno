"use client";

import { useRef, useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import { IconUpload, IconPaperclip } from "../components/shared";
import type { UserSettings } from "../types";

export default function DefinicoesPage() {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Perfil de Remetente state
  const [senderProfile, setSenderProfile] = useState("");
  const [attachmentFilename, setAttachmentFilename] = useState<string | null>(null);
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<UserSettings>)
      .then((data) => {
        if (data.senderName) setSenderName(data.senderName);
        if (data.senderEmail) setSenderEmail(data.senderEmail);
        if (data.senderProfile) setSenderProfile(data.senderProfile);
        setAttachmentFilename(data.attachmentFilename ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, senderEmail }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "Erro ao guardar definições.");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") &&
      file.type === "application/pdf";

    if (!isPdf) {
      setPdfError("Apenas ficheiros PDF são aceites.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      setPdfError("O ficheiro não pode exceder 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingPdf(file);
    setPdfError(null);
  }

  async function handleSaveProfile() {
    if (!senderName.trim() || !senderEmail.trim()) {
      setProfileSaveError("Configure primeiro o nome e email do remetente (secção acima) antes de guardar o perfil.");
      return;
    }
    setProfileSaving(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, senderEmail, senderProfile }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setProfileSaveError(data.error ?? "Erro ao guardar perfil.");
        return;
      }

      if (pendingPdf !== null) {
        const formData = new FormData();
        formData.append("file", pendingPdf);
        const attachRes = await fetch("/api/settings/attachment", {
          method: "PATCH",
          body: formData,
        });
        const attachData = (await attachRes.json()) as {
          attachmentFilename?: string;
          error?: string;
        };
        if (!attachRes.ok) {
          setProfileSaveError(attachData.error ?? "Erro ao guardar anexo.");
          return;
        }
        setAttachmentFilename(attachData.attachmentFilename ?? null);
        setPendingPdf(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 2000);
    } catch {
      setProfileSaveError("Erro de rede. Tente novamente.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleRemoveAttachment() {
    try {
      await fetch("/api/settings/attachment", { method: "DELETE" });
      setAttachmentFilename(null);
      setPendingPdf(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // silently ignore — user can retry
    }
  }

  const previewReady = senderName.trim() !== "" && senderEmail.trim() !== "";
  const profileUnconfigured =
    senderProfile.trim() === "" && attachmentFilename === null;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-6">

          <header>
            <h1 className="text-xl font-bold text-gray-900">Definições</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure a sua identidade de envio</p>
          </header>

          {/* ── Sender identity card ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-6">

            <div>
              <h2 className="text-sm font-semibold text-gray-900">Remetente</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Estes dados aparecem no campo "De" de todos os emails enviados pela plataforma.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">A carregar...</p>
            ) : (
              <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700" htmlFor="senderName">
                    O seu nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="senderName"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ex: Tiago Barral"
                    maxLength={100}
                    required
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700" htmlFor="senderEmail">
                    Email de envio <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="senderEmail"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="Ex: tiago@empresa.pt"
                    required
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Este email deve estar verificado no Resend para que os envios funcionem. As respostas dos destinatários chegam também a este endereço.
                  </p>
                </div>

                {previewReady && (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-xs text-blue-600">
                      <span className="font-medium">Pré-visualização:</span>{" "}
                      Os seus emails serão enviados como{" "}
                      <span className="font-mono">{senderName.trim()} &lt;{senderEmail.trim()}&gt;</span>
                    </p>
                  </div>
                )}

                {saveError !== null && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    Definições guardadas com sucesso.
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || senderName.trim() === "" || senderEmail.trim() === ""}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "A guardar..." : "Guardar"}
                  </button>
                </div>

              </form>
            )}
          </div>

          {/* ── Perfil de Remetente card ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-6">

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">Perfil de Remetente</h2>
                {profileUnconfigured && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    não configurado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Informação sobre os seus serviços e um anexo opcional incluído automaticamente em cada email.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">A carregar...</p>
            ) : (
              <div className="flex flex-col gap-4">

                {/* Service description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700" htmlFor="senderProfile">
                    Descrição dos seus serviços
                  </label>
                  <textarea
                    id="senderProfile"
                    rows={4}
                    value={senderProfile}
                    onChange={(e) => setSenderProfile(e.target.value)}
                    maxLength={500}
                    placeholder="Descreva o que faz, para quem, e o que oferece de diferente. Este texto é usado pela IA para escrever os emails na sua perspetiva."
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {senderProfile.length}/500
                  </p>
                </div>

                {/* PDF attachment */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-700">
                    Anexo padrão <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>

                  {/* Stored attachment chip */}
                  {attachmentFilename !== null && pendingPdf === null && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700 font-medium">
                        <IconPaperclip className="w-3.5 h-3.5" />
                        {attachmentFilename}
                        <span className="text-green-500 font-normal">(guardado)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveAttachment()}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  )}

                  {/* Pending (not yet saved) chip */}
                  {pendingPdf !== null && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs text-blue-700 font-medium">
                        <IconPaperclip className="w-3.5 h-3.5" />
                        {pendingPdf.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingPdf(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Remover ficheiro selecionado"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Upload zone — shown when nothing is pending and nothing is stored */}
                  {pendingPdf === null && attachmentFilename === null && (
                    <label
                      htmlFor="pdfUpload"
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <IconUpload className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Anexar PDF <span className="text-gray-400">(máx. 5 MB)</span> — será enviado com cada email
                      </span>
                      <input
                        ref={fileInputRef}
                        id="pdfUpload"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfChange}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {/* Allow replacing a stored attachment via a small link */}
                  {attachmentFilename !== null && pendingPdf === null && (
                    <label
                      htmlFor="pdfReplace"
                      className="inline-flex w-fit cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <IconUpload className="w-3 h-3" />
                      Substituir anexo
                      <input
                        ref={fileInputRef}
                        id="pdfReplace"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfChange}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {pdfError !== null && (
                    <p className="text-xs text-red-600">{pdfError}</p>
                  )}
                </div>

                {/* Feedback messages */}
                {profileSaveError !== null && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {profileSaveError}
                  </div>
                )}

                {profileSaveSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    Perfil guardado!
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    disabled={profileSaving}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {profileSaving ? "A guardar..." : "Guardar perfil"}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
