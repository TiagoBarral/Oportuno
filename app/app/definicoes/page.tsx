"use client";

import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import type { UserSettings } from "../types";

export default function DefinicoesPage() {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<UserSettings>)
      .then((data) => {
        if (data.senderName) setSenderName(data.senderName);
        if (data.senderEmail) setSenderEmail(data.senderEmail);
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

  const previewReady = senderName.trim() !== "" && senderEmail.trim() !== "";

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-6">

          <header>
            <h1 className="text-xl font-bold text-gray-900">Definições</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure a sua identidade de envio</p>
          </header>

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

        </div>
      </div>
    </AppShell>
  );
}
