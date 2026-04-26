# Oportuno — TODO

Tracks known gaps, deferred decisions, and limitations. Not bugs (see `_private/bugs/BUGS.md`).

---

## Setup

- [ ] Fill in `ANTHROPIC_API_KEY` in `app/.env.local`
- [ ] Fill in `RESEND_API_KEY` in `app/.env.local`
- [ ] Fill in `RESEND_FROM_ADDRESS` in `app/.env.local`
- [ ] Fill in `GOOGLE_API_KEY` in `app/.env.local`
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
- [ ] Rate limiting on `/api/pipeline` and `/api/email/send` — pipeline calls Google Places (costs money per call), send route can be abused
- [ ] Input validation with a schema library (e.g. Zod) — currently parsing query params and request bodies manually with no enforcement
- [ ] Scrub internal errors before API responses — stack traces must not reach the client in production
- [ ] GDPR deletion endpoint — data retention policy and a mechanism to delete a company's data on request (legitimate interest basis requires this)

**Pipeline**
- [ ] Atomic job claiming — `claimNextJob` does find-then-update, not atomic; two simultaneous worker invocations (e.g. cron tick overlapping a manual trigger) could claim the same job. Fix with a raw `UPDATE ... WHERE status = 'PENDING' RETURNING *` or a Prisma transaction when concurrency becomes a real concern.

**Reliability**
- [ ] Environment variable validation at startup — app currently boots silently with missing keys and fails at runtime; should fail fast with a clear message
- [ ] Prisma global client singleton — Next.js serverless can exhaust DB connections without the `globalThis` singleton pattern; verify current `lib/prisma.ts` handles this
- [ ] Health check endpoint (`GET /api/health`) — required by most deployment platforms to verify the app is alive

**Observability**
- [ ] Structured logging — replace `console.log` with a logger that includes timestamps, severity, and request context
- [ ] Error monitoring — integrate Sentry (or equivalent) so production errors are visible without tailing logs

**Code Quality**
- [ ] Prettier — add formatter so code style doesn't drift; integrate with ESLint and pre-commit hook
- [ ] Stricter ESLint rules — enable `no-console`, `no-unused-vars`, `@typescript-eslint/no-explicit-any`

**Deployment**
- [ ] Decide and document deployment target — Railway, Vercel, or a managed PostgreSQL host; decision affects connection pooling, env var management, and cold starts
- [ ] Database backup strategy — document how the PostgreSQL database will be backed up in production

---

## Known Limitations (MVP)

- [ ] Many companies will have `email: null` — scraper only extracts emails from websites
- [ ] Pipeline runs manually — no scheduling
- [ ] No retry UI if company list fails to load
- [ ] performance stats trend percentages are hardcoded mock values
