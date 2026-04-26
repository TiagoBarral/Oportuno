# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- **`PipelineJob` / `PipelineCompany` models** (`prisma/schema.prisma`): two new models tracking async discovery jobs and their per-company progress. `PipelineJob` has `JobStatus` (PENDING / RUNNING / DONE / FAILED) and a `@@unique([industry, location])` constraint to prevent duplicate runs. `PipelineCompany` has `CompanyStatus` per place and a FK to `Company` once enriched.
- **`pipelineJobService.ts`**: all job-lifecycle helpers — `createOrGetJob`, `claimNextJob` (with 10-minute stale-job recovery), `markJobDone/Failed`, `seedPipelineCompanies`, `claimPendingCompany`, `markCompanyDone/Failed`, `getJobProgress` (aggregated counts by status).
- **`companyService.ts`**: `persistCompany` — extracted upsert logic from `pipelineService`; null-guards on update so existing `websiteUrl`, `email`, and `phoneNumber` are never overwritten with null; sets `lastEnrichedAt` on every write.
- **`GET /api/pipeline/[jobId]`**: returns job status and per-status progress counts (`total`, `pending`, `processing`, `done`, `failed`).
- **`GET /api/pipeline/worker`**: cron-safe worker endpoint that calls `runWorkerTick`; protected by `Authorization: Bearer <CRON_SECRET>` in all non-development environments; bypassed locally.
- **`vercel.json`**: Vercel Cron schedule — `/api/pipeline/worker` fires every minute (`* * * * *`).
- **`CRON_SECRET` env var**: added to `app/.env.example` with description.
- **Pipeline progress UI** (`page.tsx`): `pipelineProgress` state tracks `{ done, total }` polled from `/api/pipeline/[jobId]` every 2 s while a job is running; the Descobrir button label switches from "A descobrir..." to "A processar: N/M" while total > 0.
- **Empty state illustration** (`page.tsx`): company list empty state now shows a large `IconSearch` icon and Portuguese prompt ("Clique em 'Descobrir Empresas' para iniciar a pesquisa").

### Changed

- **`POST /api/pipeline/route.ts`**: no longer calls `runPipeline` synchronously; now calls `createOrGetJob` and returns `{ jobId, status, queued }` with HTTP 202 when a new job is created or 200 when the same job already exists.
- **`pipelineService.ts`**: `runPipeline` removed; replaced with `runWorkerTick` which claims one PENDING job, seeds its company list, enriches each company sequentially, and marks the job DONE or FAILED.
- **`Company` schema fields renamed**: `website` → `websiteUrl`, `phone` → `phoneNumber`; `address` made optional; `updatedAt` no longer has a static default; `lastEnrichedAt` added as nullable.
- **`types.ts` `Company` interface**: updated to match renamed fields (`websiteUrl`, `phoneNumber`, `address: string | null`).
- **`page.tsx` field references**: all `selectedCompany.website` → `selectedCompany.websiteUrl`, `selectedCompany.phone` → `selectedCompany.phoneNumber`.

---

## [0.3.0] — 2026-04-26

### Added

- **Vitest test suite**: Installed `vitest@4.1.5`, created `vitest.config.ts` with `@/` path alias (resolves to `app/`), added `test` and `test:watch` npm scripts. Four test files covering all core service logic:
  - `tests/opportunityService.test.ts` — 12 cases for `classifyOpportunity`: all four classification rules (NO_WEBSITE, WEAK_WEBSITE, NONE), exact signal thresholds (2-of-3 weak signals), absolute vs. relative link hostname matching, malformed HTML safety.
  - `tests/scraperService.test.ts` — 14 cases for `extractEmail`: mailto-first extraction, plain-text fallback, case normalization, query-string stripping, first-of-multiple, subdomain handling, blocklist (example.com, yourdomain, retina suffixes), null cases, noisy HTML.
  - `tests/emailGenerator.test.ts` — 10 cases for `generateEmail` via `USE_MOCK_AI=true` mock path: shape validation, placeholder interpolation, no unreplaced `{{` tokens, opt-out line present, different output per opportunity type.
  - `tests/templateService.test.ts` — 13 cases across `getTemplateById`, `getDefaultTemplateForOpportunity`, `listTemplates`, `applyTemplate`: known/unknown IDs, per-type defaults, mutation safety (list copy, original template not mutated), multi-occurrence replacement.

### Changed

- **Repository structure**: Removed nested `app/.git` repository; `app/` is now tracked directly under the root repo. All `app/` files staged as part of the initial project commit.
- **`.gitignore` consolidation**: Deleted `app/.gitignore`; all ignore rules merged into root `.gitignore`. Added `app/app/generated/` pattern to cover Prisma client output.

### Fixed

- **`GeneratedEmail` duplicate type**: Interface was defined in both `app/app/types.ts` and `app/lib/services/emailGenerator.ts`. Removed the duplicate from `emailGenerator.ts`; it now imports from `types.ts` and re-exports for downstream consumers.
- **PostgreSQL not starting on boot**: Server was not registered as a Windows service after PostgreSQL 18 installation. Resolved by starting manually via `pg_ctl.exe`. Schema sync confirmed via `prisma db push` (shadow DB not required, avoiding CREATEDB privilege error with `migrate dev`).

---

### Added

- **SVG icon system**: 14 reusable inline Heroicons 2.x defined as typed const arrow functions at module level (`IconSearch`, `IconPin`, `IconBuilding`, `IconGlobe`, `IconTag`, `IconEnvelope`, `IconUsers`, `IconStar`, `IconSparkle`, `IconDocument`, `IconPaperPlane`, `IconArrowRight`, `IconTrendUp`, `IconTrendDown`). All accept an optional `className` prop for size/color overrides via Tailwind.
- **Company avatars**: Initials circles (bg-blue-50, blue text) in the sidebar company card list. Extracted from the company name with `trim().split(/\s+/)` to handle names with multiple or leading/trailing spaces.
- **Icon-prefixed inputs**: `IconSearch` on the industry input, `IconPin` on the location input — absolute-positioned spans inside relative wrappers with `pl-9` on the input.
- **Header placeholder**: 64×64 rounded building icon placeholder in the selected company header card.
- **Info grid row icons**: Each field label in Visão Geral and Presença Online now has a leading Heroicon (14×14, `text-gray-400`).
- **DESEMPENHO section**: Five sparkline stat cards (Recharts `LineChart`) below the company detail — Empresas Encontradas, Boas Oportunidades, Sites Fracos, Sem Oportunidade, Emails Enviados. Each card uses four fixed-height zones (label, value, trend text, sparkline) for consistent alignment across all five cards. Includes trend arrow + percentage row.
- **Right panel icon titles**: Each action card (Gerar Email, Rascunho, Enviar Email) has its section label prefixed with an icon.
- **`recharts` package**: Added for sparkline charts.

### Changed

- **Right panel card padding**: Standardised to `p-5` across all three action cards (was `px-4 py-4`).
- **Section label consistency**: All section labels now uniformly use `text-[11px] font-semibold uppercase tracking-wider text-gray-400`. Previously some used `text-xs tracking-wide`.
- **Sidebar spacing**: Input gap in DESCOBERTA section and filter form increased from `gap-2` to `gap-3`.
- **Company card hover states**: Added `hover:shadow-md hover:border-gray-300 transition-all duration-150` to unselected cards.
- **Green website indicator**: "Tem website" in Visão Geral is `text-green-600`; "Sem website" is `text-gray-300`.
- **`handleDiscover` resets state**: Starting a new discovery run now clears `selectedCompany`, `emailDraft`, `sendResult`, and `generateError` before running, preventing a stale detail panel.
- **Website URL sanitization**: The company website link now prepends `https://` if the stored URL has no scheme, guarding against `javascript:` URIs from malformed scraped data.

### Fixed

- **Avatar initials with multiple spaces**: Changed `.split(" ")` to `.trim().split(/\s+/)` to handle names with repeated or surrounding spaces.
- **Dead `generateError` block in draft card**: `generateError` is only set when generation fails (emailDraft is null), making the block inside `{emailDraft !== null && ...}` unreachable. Removed it; the error now shows exclusively in the right panel.

---

## [0.2.0] — 2026-04-24

### Added

- **Recharts sparkline stats row**: Five `LineChart` sparkline cards at the bottom of the dashboard. Mock `sparkData` arrays defined at module level.
- **RESULTADOS counter badge**: Company count shown as a pill badge next to the section label, visible even when count is 0.
- **Pipeline feedback note**: Inline success/error message below the Descobrir button after a pipeline run.

### Changed

- **Layout**: Restructured from a 4-column layout to 3 columns — left sidebar (w-80), main content (flex-1, max-w-4xl centered), right action panel (w-72). Main content scrolls independently.
- **Company cards**: Redesigned with initials avatar, name + opportunity badge row, and industry/location subtext. Selected state uses a blue ring and bg-blue-50.
- **Info grid**: Two-column grid (Visão Geral + Presença Online) replaces a flat field list.
- **Opportunity alert**: Renders only for NONE-opportunity companies as a blue info banner.

### Fixed

- **BUG-001 — Stats cards misaligned**: Values and labels appeared at different heights depending on trend text length. Fixed with four explicit fixed-height zones per card: label (truncate), value (`leading-none`), trend text (`h-4 truncate`), sparkline (`h-10 flex-shrink-0`).
- **Blank state on page load**: Removed a `useEffect` that auto-called `fetchCompanies` on mount, which was loading previous session's database results on every page open.
- **Browser autocomplete pre-filling inputs**: Added `autoComplete="off"` to the industry and location inputs.
- **"Ver Rascunho" scroll broken inside scrollable container**: `href="#email-draft"` scrolled the document root, not the inner `<main>` with `overflow-y-auto`. Replaced with a button using `scrollIntoView({ behavior: "smooth", block: "start" })`.
- **Double vertical spacing**: `space-y-6` on parent + `pt-6` on conditionally-rendered children produced 48 px gaps. Removed `pt-6` from email draft and send sections.

### Removed

- **Decorative icon sidebar**: A non-interactive w-14 icon column added for visual structure. Removed — it looked clickable but wasn't, causing confusion.
- **`useEffect` import**: Removed after the auto-fetch effect was deleted.

---

## [0.1.0] - 2026-04-24

### Added

- Next.js 16 + Prisma + PostgreSQL project setup
- Company discovery via Google Places API (industry + city search)
- Opportunity detection: `NO_WEBSITE`, `WEAK_WEBSITE`, `NONE` classification
- Phone number extraction from Google Places Details API
- Contact email extraction from company websites via Playwright
- Email generation in European Portuguese — real (Anthropic) or mock mode
- Email sending via Resend API with DB logging
- Single-page dashboard: filters, company list, email generation panel
