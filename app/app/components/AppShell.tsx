"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHandshake, IconSearch } from "./shared";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const linkBase =
    "flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors";
  const linkActive = `${linkBase} font-semibold text-blue-600 border-blue-600`;
  const linkInactive = `${linkBase} font-medium text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300`;

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 flex items-center h-14">
        {/* Left: logo + wordmark */}
        <div className="flex-shrink-0 mr-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">Oportuno</span>
        </div>

        {/* Center: nav */}
        <nav className="flex flex-1 items-center justify-center gap-1">
          <Link
            href="/networking"
            className={pathname === "/networking" || pathname === "/" ? linkActive : linkInactive}
          >
            <IconHandshake className="w-4 h-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>Networking</span>
              <span className="text-xs font-normal text-gray-400">Base de oportunidades</span>
            </span>
          </Link>

          <Link
            href="/discover"
            className={pathname === "/discover" ? linkActive : linkInactive}
          >
            <IconSearch className="w-4 h-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>Descobrir</span>
              <span className="text-xs font-normal text-gray-400">Encontrar novas empresas</span>
            </span>
          </Link>
        </nav>

        {/* Right: credits + help + user */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            Créditos: 1.250
          </span>
          <button type="button" className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors text-sm font-medium">
            ?
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">TB</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Tiago Barral</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
