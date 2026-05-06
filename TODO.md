# Oportuno — TODO

Tracks known gaps, deferred decisions, and limitations. Not bugs (see `_private/bugs/BUGS.md`).

---

## Setup

- [ ] Verify `app/.env.local` contains valid `DATABASE_URL`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, and `GOOGLE_API_KEY` without exposing secret values
- [ ] Add/configure `CRON_SECRET` before using the pipeline worker outside local development
- [ ] Confirm `USE_MOCK_AI` is set intentionally for local testing (`true` for mocked AI, unset/false for real AI calls)
- [ ] Choose a deployment host (Vercel or similar) and configure runtime env vars there before first deployment
- [ ] Keep `app/.env.example` synced with required env var names, using empty placeholder values only
- [ ] Verify Resend sender domain (required before emails can be delivered)
- [ ] Set up branch protection on `main` in GitHub (require PR, no direct push)
- [ ] Set a hard budget cap on the Google Cloud project
- [ ] Add API key restrictions (restrict to Places API, add HTTP referrer or IP restriction)
- [ ] Investigate Google Places API (New) — currently using legacy REST endpoints; new API may have better pricing and field coverage

## Testing

- [ ] Test pipeline end-to-end with a real Portuguese city and industry
- [ ] Test email generation with a real company (NO_WEBSITE and WEAK_WEBSITE)
- [ ] Test email sending with a verified Resend address
- [ ] Confirm email logs are written to the DB regardless of Resend outcome

## Features

- [ ] Store search snapshots so performance stats trend percentages are real, not mock
- [ ] Progressive enrichment — show companies immediately from Places, enrich asynchronously
- [ ] Add version number visible in the UI or footer

## Production Readiness

Items to debate and plan before deploying to a real environment. Not prioritized yet.

**Security**
- [ ] Authentication on API routes — all routes are currently unauthenticated; `/api/email/send` and `/api/email/generate-template` can be called by any HTTP client to send emails or consume Anthropic budget; add session or shared-secret auth before any public deployment
- [ ] Rate limiting on `/api/pipeline` and `/api/email/send` — pipeline calls Google Places (costs money per call), send route can be abused
- [ ] Server-side companyId verification in bulk send — bulk path does not verify each companyId exists in the DB (single-send path does); add a `prisma.company.findMany({ where: { id: { in: ids } } })` check before dispatching
- [ ] Scrub internal error messages from API responses — Prisma, Resend, and Anthropic SDK errors are currently returned verbatim; map to generic user-facing strings in production
- [ ] Input validation with a schema library (e.g. Zod) — currently parsing query params and request bodies manually with no enforcement
- [ ] Scrub internal errors before API responses — stack traces must not reach the client in production
- [ ] GDPR deletion endpoint — data retention policy and a mechanism to delete a company's data on request (legitimate interest basis requires this)

**Pipeline**
- [ ] Atomic job claiming — `claimNextJob` does find-then-update, not atomic; two simultaneous worker invocations (e.g. cron tick overlapping a manual trigger) could claim the same job. Fix with a raw `UPDATE ... WHERE status = 'PENDING' RETURNING *` or a Prisma transaction when concurrency becomes a real concern.
- [ ] Polling timeout ceiling — `handleDiscover` polls indefinitely; if the worker dies without writing DONE or FAILED the spinner locks forever. Add a max poll count (~150 × 2s = 5 min) and surface a timeout error to the user.
- [ ] Polling condition — polling only starts when a new job is created (`queued === true`); a returning user whose existing job is PENDING or FAILED gets no feedback. Change the condition to `jobData.status !== "DONE"`.

**Reliability**
- [ ] `sendEmail` split-brain on DB failure — if Resend succeeds but `prisma.emailLog.create` throws, `sendBulkEmails` records the send as failed and the user may re-send; fix by separating the Resend call from the log write and handling DB failure independently
- [ ] Environment variable validation at startup — app currently boots silently with missing keys and fails at runtime; should fail fast with a clear message
- [ ] Prisma global client singleton — Next.js serverless can exhaust DB connections without the `globalThis` singleton pattern; verify current `lib/prisma.ts` handles this
- [ ] Health check endpoint (`GET /api/health`) — required by most deployment platforms to verify the app is alive

**Observability**
- [ ] Structured logging — replace `console.log` with a logger that includes timestamps, severity, and request context
- [ ] Error monitoring — integrate Sentry (or equivalent) so production errors are visible without tailing logs

**Code Quality**
- [ ] Prettier — add formatter so code style doesn't drift; integrate with ESLint and pre-commit hook
- [ ] Stricter ESLint rules — enable `no-console`, `no-unused-vars`, `@typescript-eslint/no-explicit-any`
- [ ] `cities.ts` parallel arrays — `PORTUGUESE_CITIES` and `CITY_NAMES` must be kept in sync manually; refactor to a single `CITIES` array of `{ key, display, coords }` and derive both from it.
- [ ] `placesService.ts` continuation params — continuation requests include `query`/`region`/`language` alongside `pagetoken`; the API ignores them but it's misleading. Remove for clarity.
- [ ] `placesService.ts` magic number — extract `2000` (Places API next-page delay) to a named constant `NEXT_PAGE_DELAY_MS`.

**Deployment**
- [ ] Decide and document deployment target — Railway, Vercel, or a managed PostgreSQL host; decision affects connection pooling, env var management, and cold starts
- [ ] Database backup strategy — document how the PostgreSQL database will be backed up in production

---

## Known Limitations (MVP)

- [ ] Many companies will have `email: null` — scraper only extracts emails from websites
- [ ] Pipeline runs manually — no scheduling
- [ ] No retry UI if company list fails to load
- [ ] performance stats trend percentages are hardcoded mock values
