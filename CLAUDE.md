# Project Context — Oportuno MVP (Portugal)

## System Architecture

- This repository contains ONLY application code
- AI tooling and agents are external (AIAssist)
- Claude must operate on this project using that external system
- Do NOT recreate or embed tooling inside this repo

---

## Product Vision

Oportuno helps small businesses in Portugal:

1. Find companies that likely need their services
2. Generate high-quality outreach emails
3. Send those emails efficiently

This is a client acquisition tool for Portuguese SMEs — not a generic lead database.

---

## Stack

- Next.js (App Router), TypeScript
- Tailwind CSS
- API routes (no separate backend)
- PostgreSQL via Prisma ORM
- Resend API (email sending)
- Playwright (email extraction only)
- Google Places API (company discovery)

---

## Project Structure

All paths relative to `/app`:

- app/app — pages
- app/app/api — API routes
- app/lib/services — business logic
- app/lib/prisma.ts — Prisma client
- app/prisma/schema.prisma — database schema

---

## Core Rules (CRITICAL)

- Never modify `.env` files
- Never access `_private/` for commits
- Never commit secrets or credentials
- Never modify `node_modules` or `.next`
- Always use Prisma (no raw SQL)
- Follow existing patterns — do not introduce new ones unnecessarily

---

## Oportuno Danger Zones

These areas can affect real businesses, private data, external systems, or production stability. Use `/development` or `/bugfix` unless the change is clearly tiny and safe:

- Email sending, Resend integration, bulk outreach, or delivery logs
- AI-generated outreach copy, prompts, template generation, or classification
- Company discovery, Google Places, contact extraction, scraping, or enrichment
- Prisma schema, database writes, data migrations, or backfills
- GDPR/privacy-sensitive data, personal/contact data, or opt-out behavior
- Bulk actions, imports, exports, scoring, opportunity detection, or pipeline workflows
- Production/Vercel config, environment variable wiring, CI, or deployment behavior

### External action safety

- Never send real emails, trigger bulk outreach, or contact external companies unless the user explicitly confirms the exact action.
- Prefer dry-run, preview, confirmation, or test-recipient flows for anything that mutates external systems.
- When testing email features, default to mock/test data and explain what NOT to test.

### Privacy and logging

- Do not log API keys, env values, credentials, raw tokens, or secrets.
- Avoid logging full email bodies, extracted personal/contact data, or full third-party API responses unless explicitly debugging and safe.
- Redact sensitive fields in logs and examples.
- Keep GDPR constraints visible in implementation decisions: public business data only, legitimate interest, clear opt-out.

---

## Implementation Philosophy

- Keep code minimal and runnable
- Prefer simple solutions over scalable ones
- Avoid unnecessary abstractions
- Build only what is explicitly required
- When unsure → choose the simplest working solution

### After every implementation

Always end with a numbered testing checklist. Cover:
1. How to start the dev server
2. The happy path — step by step what to click/do
3. Edge cases specific to what was built (empty states, disabled states, error states)
4. What NOT to test (e.g. real sends, real API calls) and why

Keep it concise — one sentence per step. No prose paragraphs.

### Testing expectations by work type

- UI changes: test the affected route/page manually, including empty and disabled states.
- API changes: test the endpoint with safe sample input and avoid real external side effects.
- Email changes: use preview, dry-run, test recipients, or mocked sends unless the user explicitly approves a real send.
- Prisma changes: verify the generated client, typecheck, build, and confirm whether backfill is needed.
- Pipeline/discovery changes: test with a small controlled sample before running broad searches.
- Production/config changes: confirm local build first, then explain the deployment impact.

---

## Dev Team (ai-dev-framework)

The AI dev team lives at: `d:\PERSONAL\AIAssist\ai-dev-framework`

This is a separate repo used as a personal AI dev team across all projects. It provides skills (interactive workflows), agents (specialist executors), and documentation. Do NOT recreate any of this tooling inside Oportuno.

Full docs: `d:\PERSONAL\AIAssist\ai-dev-framework\.claude\docs\`
Agent manifest: `d:\PERSONAL\AIAssist\ai-dev-framework\AGENTS.md`

---

### Skills — invoke these by typing the slash command

| Skill | When to use |
|---|---|
| `/development` | Non-trivial features, unclear product work, multi-file changes, or anything affecting data, email, privacy, company discovery, scoring, or core business flows. 5-phase flow: definition → brainstorm → plan → tasks → execute. Has 3 human checkpoints — nothing runs until the task list is approved. |
| `/bugfix` | Unclear bugs, recurring bugs, production-impacting bugs, or bugs involving data, email, scraping/extraction, privacy, database state, or core business flows. Same 5-phase structure adapted for root cause analysis and targeted fix. |
| `/ship` | Not used in this project — CHANGELOG, commits, and PR follow the rules in this file directly. |
| `/test-case-design` | Generating test cases from a spec, user story, or acceptance criteria. Covers plain text, CSV, and Gherkin. |

**Rule: use AIAssist for risky or unclear work, not for every tiny edit.**

Use `/development` before implementing:
- New user-facing features
- Multi-file or cross-layer changes
- Product decisions that are still ambiguous
- Database/schema changes
- Email generation, email sending, company discovery, contact extraction, scoring, or pipeline workflows
- Privacy/GDPR-sensitive work

Use `/bugfix` before fixing:
- Bugs without an obvious root cause
- Recurring bugs
- Production-impacting bugs
- Bugs involving data correctness, email behavior, scraping/extraction, Prisma, privacy, or external APIs

Direct implementation is allowed for:
- Documentation-only edits
- Copy tweaks
- Small CSS/UI polish with no behavior change
- Comments or formatting
- Obvious one-file fixes where the cause and solution are clear
- Refactors with no behavior change, as long as normal build/test gates still apply

---

### Agents — the specialists behind the skills

The system has three layers:

```
SKILL LAYER      /development  /bugfix  /ship  /test-case-design
                      │
ORCHESTRATION    tech-lead  (sequences, delegates, synthesizes)
                      │
SPECIALIST LAYER agents (scoped execution, report back to orchestrator)
```

**Orchestration**
- `tech-lead` — primary orchestrator. Auto-invoked by skills at execution phase. Invoke directly for refactors, audits, or multi-specialist tasks outside the feature/bug lifecycle.
- `architect` — read-only design agent. Produces file-level plans, not code. Auto-invoked by `/development` Phase 3 and by `tech-lead`.

**Frontend (run in this sequence)**
- `design-system-engineer` — design tokens, color system, spacing, primitives (Button, Input, Modal). Runs before `ui-engineer` when token changes are needed.
- `ui-engineer` — components, pages, routing, state, forms, client-side data fetching.
- `a11y-auditor` — WCAG 2.1/2.2 AA audit. **Mandatory quality gate** for any interactive UI. Read-only.
- `frontend-qa` — RTL component tests, Playwright/Cypress E2E tests. Runs after `ui-engineer`.
- `performance-engineer` — Core Web Vitals, bundle size, render perf. Runs post-implementation.

**Backend & Infrastructure**
- `backend-engineer` — API routes, business logic, Prisma, database schemas, background jobs, third-party integrations.
- `devops-engineer` — CI/CD, Docker, IaC, Kubernetes, environment config, monitoring.
- `qa-engineer` — backend/integration tests, API contract tests, test infrastructure.
- `debugger` — root cause analysis and surgical fixes. Auto-invoked by `/bugfix`.

**Quality gates (read-only, always last)**
- `code-reviewer` — **mandatory on every completed feature.** Returns APPROVE / APPROVE WITH SUGGESTIONS / NEEDS CHANGES.
- `security-auditor` — **mandatory for auth, payments, file uploads, or user data.** Returns Critical / High / Medium / Low findings.

---

### Routing rules

| Situation | What to do |
|---|---|
| Non-trivial feature, unclear feature, or risky product/data/email/privacy change | `/development` |
| Simple docs, copy, styling, comments, formatting, or obvious one-file fix | Direct implementation using this file's git/build rules |
| Unclear, recurring, production-impacting, data, email, extraction, privacy, Prisma, or external API bug | `/bugfix` |
| Ready to commit and PR | Follow git workflow in this file directly |
| Writing test cases from a spec | `/test-case-design` |
| Narrowly scoped, single-domain task | Call the relevant specialist agent directly |
| Multi-specialist task outside a feature/bug | Invoke `tech-lead` directly with a specific brief |

Do not nest `/development` inside `tech-lead`. They serve the same orchestration purpose — use one or the other, never both.

---

## Execution Workflow (MANDATORY)

For every task:

1. Identify whether it is a feature, bug, docs/style tweak, or scoped single-specialist task
2. Route accordingly (see routing rules above)
3. Use AIAssist workflows for risky, unclear, multi-file, product, data, email, privacy, or production-impacting work
4. For tiny low-risk edits, direct implementation is allowed, but still follow this file's git, build, test, changelog, and safety rules

Do not add process when it does not protect the app, but do not bypass AIAssist when the work is ambiguous or risky.

### Branch rule — enforced without exception

**Before writing a single line of code for any feature or fix, create a branch.**

```
git checkout -b feat/short-description   # new feature
git checkout -b fix/short-description    # bug fix
git checkout -b chore/short-description  # maintenance
```

This is not optional and not skippable. If you are mid-session and realise no branch was created, stop, create the branch, then continue. Never accumulate multiple features on the same branch. Never commit directly to `main` except for docs/typo fixes as defined in the Git Workflow section.

**At the end of every `/development` or `/bugfix` flow**, before asking the user to proceed:
1. Run `bun tsc --noEmit` — must be clean
2. Commit all changes with a meaningful message on the feature branch
3. Update `_private/JOURNAL.md` — write a proper entry covering the debate, decisions, what went wrong, and what was learned. Do NOT skip this. Do NOT defer it to later.
4. Confirm the branch name and commit to the user

After any meaningful debate, decision, or standalone fix (even outside a full flow), write a journal entry immediately — before moving to the next topic.

Failure to create a branch before coding is one of the most repeated mistakes in this project. Failure to update the journal after every meaningful session is the other. There is no excuse for skipping either.

---

## API Design (MVP)

- GET /api/companies
- POST /api/pipeline
- POST /api/email/send

---

## Core Features

### Company Discovery
- Google Places API
- Filter by industry, city, radius

### Opportunity Detection
- NO_WEBSITE → high
- WEAK_WEBSITE → medium
- NONE → low

### Contact Extraction
- Only public business emails
- No LinkedIn scraping
- Keep leads even without email

### Email Generation
- European Portuguese (PT-PT)
- Max 120 words
- Professional tone
- Must include opt-out

---

## Constraints (NON-NEGOTIABLE)

- Only use public business data
- Do NOT scrape personal data
- Do NOT scrape LinkedIn
- Respect GDPR (legitimate interest + opt-out)

---

## Git Workflow

### Branches
- `main` is always stable and deployable — only passing, working code lives here
- Branch for any change that affects app behavior, schema, routing, UI, or dependencies
- Commit directly to `main` only for docs, typos, or comments that do not affect behavior. When unsure, use a branch.
- Branch names:
  - `feat/short-description` — user-facing features
  - `fix/short-description` — bug fixes
  - `chore/short-description` — maintenance, config, deps, docs workflow
  - `refactor/short-description` — internal restructure, no behavior change
  - `test/short-description` — tests only
- A branch should be mergeable within a few days. If scope grows beyond one coherent feature, split it.
- Do not let one branch accumulate unrelated product changes. Pause, commit what is coherent, then start a new branch for the next mission.

### Commits
- One logical change per commit — no "misc changes" or "WIP" commits
- For branches that span multiple layers, commit in dependency order (schema → services → API → UI)
- Format: `type: short description` (lowercase, no period)
  - e.g. `feat: add opportunity classifier`, `fix: extractEmail uppercase mailto`
- Valid types: `feat`, `fix`, `chore`, `refactor`, `test`
- Do not label internal or dev-only changes as `feat`

### Merging
- No PR required for solo development — merge locally after a successful build
- Open a PR only when you want a record of the decision (significant features, architectural changes)
- Merge flow:
  1. `bun run build` must pass on the branch — this is the gate
  2. `git checkout main && git pull`
  3. `git merge <branch-name>`
  4. `git push origin main`
  5. `git branch -d <branch-name>`
- If opening a PR: add entries to `[Unreleased]` in `CHANGELOG.md` on the branch first

### Releases and Versioning

- Follow Semantic Versioning: `MAJOR.MINOR.PATCH`
  - `PATCH` — bug fixes only (0.1.1)
  - `MINOR` — new features, backwards compatible (0.2.0)
  - `MAJOR` — breaking changes or significant product shifts (1.0.0)
- Cut a release when a coherent set of features works end-to-end — not after every commit

**Release checklist** (do in order):
1. All branches merged to `main`
2. `bun run build` passes — 0 errors
3. `bun run test` passes — 0 failures
4. App runs locally without errors (`bun dev`)
5. Rename `[Unreleased]` in `CHANGELOG.md` to version + date: `## [0.3.0] — YYYY-MM-DD`
6. Fresh empty `## [Unreleased]` section opened above it
7. Commit: `chore: release v0.3.0`
8. Tag the commit: `git tag v0.3.0`
9. Push tag: `git push origin v0.3.0`

### Verification gates
- **Before every commit**: `bun tsc --noEmit` must pass (enforced by pre-commit hook)
- **Before every push**: `bun run test` must pass (enforced by pre-push hook)
- **Before merging to main**: `bun run build` must pass
- Do not bypass any gate.

### CHANGELOG
- Required for any change a user or stakeholder would notice: new behaviour, changed behaviour, or fixed behaviour
- Not required for `refactor`, `chore`, `test`, or internal fixes that have no visible effect

### Environment variables
- Never commit `.env` or `.env.local`
- Local development variables live in `app/.env.local` because the Next.js app runs from the `app/` directory
- Production variables live in the hosting provider dashboard (for example, Vercel Project → Settings → Environment Variables), never in git
- Required runtime variables:
  - `DATABASE_URL`
  - `ANTHROPIC_API_KEY`
  - `RESEND_API_KEY`
  - `RESEND_FROM_ADDRESS`
  - `GOOGLE_API_KEY`
  - `CRON_SECRET` for production or scheduled pipeline worker calls
- Development/testing variables:
  - `USE_MOCK_AI` — set to `true` when AI calls should be mocked locally
- Always keep `app/.env.example` in sync — add or remove a variable in one, do the same in the other
- `app/.env.example` contains keys with empty values, never real secrets
- When verifying env setup, check that required keys exist without printing secret values in chat, logs, commits, or screenshots

### Never commit
- `.env` or `.env.local`
- Anything inside `_private/`
- `node_modules/`, `.next/`, `app/app/generated/`

---

## Workflows

### Bugs
- Tracked in `_private/bugs/BUGS.md` — add new bugs at the top, newest first
- Commit message format: `fix: BUG-XXX short description`
- Each entry follows the table template already in that file: ID, date, status, screenshot, description, steps, expected, notes
- Status values: `open` → `in progress` → `fixed`

### Specs
- Located in `_private/specs/`

### TODO.md
- Tracks known gaps, limitations, and deferred decisions — not bugs (use BUGS.md) and not in-progress work (use a branch)
- Sections: **Setup**, **Testing**, **Features**, **Known Limitations**
- When something is done, remove it — don't leave completed checkboxes
- Keep it short: if an item needs more than one line to explain, it belongs in a spec

### Database migrations
- Currently using `prisma db push` — applies schema directly, no migration files, no shadow DB needed
- Switch to `prisma migrate dev` when there is real production data that cannot be wiped — it generates versioned migration files and requires the `CREATE DATABASE` privilege on the DB user
- Do not switch before that point; migration history adds overhead with no benefit on a local-only MVP
- Do not run destructive schema/data changes without explicit approval.
- Before schema changes, explain whether data backfill is needed and whether existing data can be safely preserved.
- Stop the dev server before Prisma generate/db push if Windows DLL locks appear.
- After schema changes, verify Prisma client generation, typecheck, and build before merging.

### Git hooks
- Hooks live in `scripts/hooks/` (tracked). After cloning, run `sh scripts/setup-hooks.sh` to install both.
- **pre-commit**: runs `bun tsc --noEmit` only — fast structural check on every commit
- **pre-push**: runs `bun run test:local` (`vitest run --no-file-parallelism`) — disables parallel worker spawning to avoid a Bun-on-Windows crash; CI uses the standard `bun run test` and is unaffected
- CI runs both as the final safety net on push and PR to `main`
- Do not use `--no-verify` to bypass the pre-push hook — `test:local` is the fix for the Windows crash

### Private Data
- `_private/` is gitignored
- Never commit anything from it

### Journal (`_private/JOURNAL.md`)

The journal is a private, local-only development log. It must never be committed or pushed. It documents the human story of the project: debates, plans, lessons learned, hurdles, confusing bugs, tradeoffs, decisions, and moments where something finally clicks.

**When to update** — create or update an entry whenever:
- We have a meaningful debate or planning discussion
- We make an important product or technical decision
- We hit a confusing bug or blocker
- We solve a significant issue
- We learn something that should influence future work
- We update CHANGELOG.md
- We complete meaningful work that changes app behavior, UX, routing, storage, schema, deployment, or project workflow

**Entry format:**

```
## Month Day, Year — Short Human Title

### What I built / changed
Describe the actual work in plain language.

### What I was trying to learn / decide
Explain the intention, debate, or question behind the work.

### What went wrong
Describe bugs, confusion, false assumptions, or friction.

### Biggest challenge / bug
Capture the hardest part and why it was tricky.

### What I learned
Write the takeaway in a way future me can reuse.

### What I would do differently
Optional, but useful when the work revealed a better future process.
```

**Tone rules:**
- Write in first person, human and reflective — not a changelog
- It is okay to say something was frustrating, confusing, or satisfying
- When an issue is solved, tell the full arc: symptom → false leads → root cause → fix → confirmation
- No bullet-point dumps — write in prose
- Do NOT mirror CHANGELOG.md — the journal is about the experience, not the feature list
- Never include secrets, passwords, API keys, or sensitive credentials

**Separation of concerns:**
- `CHANGELOG.md` — public, concise, release-oriented, committed
- `_private/JOURNAL.md` — private, reflective, local-only, never committed

---

## Priority

If any instruction conflicts:
1. CLAUDE.md rules override everything
2. Simplicity over complexity
3. Do not invent features

## Success Criteria

- Search any Portuguese city
- Find 10 relevant companies
- Identify opportunities
- Generate 5 emails
- Send them
