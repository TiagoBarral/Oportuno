"use client";

import { useRef, useEffect, useState } from "react";
import type { FilterSuggestion } from "../types";

interface FilterAdvisorModalProps {
  onApply: (suggestion: FilterSuggestion) => void;
  onClose: () => void;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function FilterChip({ label, variant }: { label: string; variant: "category" | "specialty" | "size" }) {
  const cls =
    variant === "category" ? "bg-blue-50 text-blue-700" :
    variant === "size"     ? "bg-green-50 text-green-700" :
                             "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function SuggestionCard({
  suggestion,
  selected,
  onToggle,
}: {
  suggestion: FilterSuggestion;
  selected: boolean;
  onToggle: () => void;
}) {
  const { label, explanation, filters } = suggestion;
  const hasChips = filters.categories.length > 0 || filters.specialties.length > 0 || filters.companySizes.length > 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        selected
          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          selected ? "bg-blue-600 border-blue-600" : "border-gray-300"
        }`}>
          {selected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{explanation}</p>
          {hasChips && (
            <div className="mt-2 flex flex-wrap gap-1">
              {filters.categories.map((c) => <FilterChip key={c} label={c} variant="category"/>)}
              {filters.specialties.map((s) => <FilterChip key={s} label={s} variant="specialty"/>)}
              {filters.companySizes.map((sz) => <FilterChip key={sz} label={sz} variant="size"/>)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function mergeSelectedSuggestions(selected: FilterSuggestion[]): FilterSuggestion {
  return {
    label: selected.map((s) => s.label).join(" + "),
    explanation: "",
    filters: {
      categories: [...new Set(selected.flatMap((s) => s.filters.categories))],
      specialties: [...new Set(selected.flatMap((s) => s.filters.specialties))],
      companySizes: [...new Set(selected.flatMap((s) => s.filters.companySizes))],
    },
  };
}

export default function FilterAdvisorModal({ onApply, onClose }: FilterAdvisorModalProps) {
  const [situation, setSituation] = useState("");
  const [suggestions, setSuggestions] = useState<FilterSuggestion[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!situation.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuggestions(null);
    setSelectedIndices(new Set());

    try {
      const res = await fetch("/api/filter-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: situation.trim() }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Não foi possível gerar sugestões. Tente novamente.";
        throw new Error(message);
      }

      if (
        typeof data === "object" && data !== null &&
        "suggestions" in data &&
        Array.isArray((data as Record<string, unknown>).suggestions)
      ) {
        setSuggestions((data as { suggestions: FilterSuggestion[] }).suggestions);
      } else {
        throw new Error("Resposta inesperada do servidor.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggleSuggestion(index: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function handleApply() {
    if (!suggestions || selectedIndices.size === 0) return;
    const selected = [...selectedIndices].map((i) => suggestions[i]!);
    onApply(mergeSelectedSuggestions(selected));
    onClose();
  }

  const canSubmit = situation.trim().length > 0 && !loading;
  const canApply = selectedIndices.size > 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-advisor-heading"
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="filter-advisor-heading" className="text-base font-semibold text-gray-900">
              Sugerir filtros
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Descreva o seu negócio ou objetivo e receberá sugestões de pesquisa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <textarea
            ref={textareaRef}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            maxLength={500}
            placeholder="Ex.: Sou consultor de TI e quero contactar empresas sem presença digital no Porto"
            className="w-full min-h-[80px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
            rows={3}
          />
          <p className="mt-1 text-right text-xs text-gray-400">{situation.length}/500</p>

          {error !== null && (
            <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {loading && <Spinner />}
              {loading ? "A gerar sugestões..." : "Gerar sugestões"}
            </button>
          </div>
        </form>

        {suggestions !== null && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Sugestões — selecione as que quer aplicar
            </p>
            {suggestions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Não foram encontradas sugestões. Tente reformular a descrição.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={s}
                      selected={selectedIndices.has(i)}
                      onToggle={() => handleToggleSuggestion(i)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!canApply}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {canApply
                    ? `Aplicar ${selectedIndices.size} sugestão${selectedIndices.size !== 1 ? "ões" : ""}`
                    : "Selecione pelo menos uma sugestão"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
