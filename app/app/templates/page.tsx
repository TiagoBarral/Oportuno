"use client";

import Link from "next/link";
import AppShell from "../components/AppShell";
import { IconSparkle } from "../components/shared";

export default function TemplatesPage() {
  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
              <IconSparkle className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Modelos de email</h1>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Crie e guarde templates personalizados para usar nas suas campanhas de email. Esta funcionalidade estará disponível em breve.
            </p>
            <Link
              href="/networking"
              className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Gerar email no Networking
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
