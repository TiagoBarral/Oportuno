"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHandshake, IconSearch, IconSparkle, IconClock } from "./shared";
import type { UserSettings } from "../types";

interface AppShellProps {
  children: React.ReactNode;
}

type Crumb = { label: string; href?: string };

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname.startsWith("/networking/send")) {
    return [{ label: "Networking", href: "/networking" }, { label: "Enviar email em massa" }];
  }
  if (pathname.startsWith("/networking")) {
    return [{ label: "Networking" }];
  }
  if (pathname.startsWith("/discover")) {
    return [{ label: "Descobrir" }];
  }
  if (pathname.startsWith("/historico")) {
    return [{ label: "Histórico de Emails" }];
  }
  if (pathname.startsWith("/templates")) {
    return [{ label: "Modelos de email" }];
  }
  if (pathname.startsWith("/definicoes")) {
    return [{ label: "Definições" }];
  }
  return [{ label: "Início" }];
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);
  const [settings, setSettings] = useState<UserSettings>({ senderName: null, senderEmail: null });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() as Promise<UserSettings> : Promise.reject())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const networkingActive =
    pathname === "/" || pathname === "/networking" || pathname.startsWith("/networking/");
  const discoverActive = pathname === "/discover";
  const templatesActive = pathname.startsWith("/templates");
  const historicoActive = pathname.startsWith("/historico");
  const definicoesActive = pathname.startsWith("/definicoes");

  const displayName = settings.senderName ?? "Tiago Barral";
  const initials = getInitials(displayName);

  const navItem = (href: string, active: boolean, icon: React.ReactNode, label: string) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
        <Link href="/" className="px-4 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">Oportuno</span>
        </Link>

        <nav className="flex-1 px-3 pt-2 flex flex-col gap-1">
          {navItem("/networking", networkingActive, <IconHandshake className="w-5 h-5" />, "Networking")}
          {navItem("/discover", discoverActive, <IconSearch className="w-5 h-5" />, "Descobrir")}
          {navItem("/templates", templatesActive, <IconSparkle className="w-5 h-5" />, "Modelos de email")}
          {navItem("/historico", historicoActive, <IconClock className="w-5 h-5" />, "Histórico")}
          {navItem("/definicoes", definicoesActive, (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ), "Definições")}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate">{displayName}</span>
            <span className="text-xs text-gray-400">Admin</span>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Breadcrumb bar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 h-10 flex items-center">
          <nav className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-gray-300">›</span>}
                {crumb.href !== undefined ? (
                  <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
