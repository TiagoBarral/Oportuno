# Project Context — LeadBridge MVP (Portugal)

## System Architecture

- This repository contains ONLY application code
- AI tooling and agents are external (AIAssist)
- Claude must operate on this project using that external system
- Do NOT recreate or embed tooling inside this repo

---

## Product Vision

LeadBridge helps small businesses in Portugal:

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

## Implementation Philosophy

- Keep code minimal and runnable
- Prefer simple solutions over scalable ones
- Avoid unnecessary abstractions
- Build only what is explicitly required
- When unsure → choose the simplest working solution

---

## Dev Team (spark-ai-assist)

The AI dev team lives at: `d:\PERSONAL\AIAssist\spark-ai-assist`

This is a separate repo used as a personal AI dev team across all projects. It provides skills (interactive workflows), agents (specialist executors), and documentation. Do NOT recreate any of this tooling inside LeadBridge.

Full docs: `d:\PERSONAL\AIAssist\spark-ai-assist\.claude\docs\`
Agent manifest: `d:\PERSONAL\AIAssist\spark-ai-assist\AGENTS.md`

---

### Skills — invoke these by typing the slash command

| Skill | When to use |
|---|---|
| `/development` | Starting any new feature. 5-phase flow: definition → brainstorm → plan → tasks → execute. Has 3 human checkpoints — nothing runs until the task list is approved. **Always use this for new features.** |
| `/bugfix` | Investigating any bug. Same 5-phase structure adapted for root cause analysis and targeted fix. |
| `/ship` | When all tasks and quality gates are done. Generates commit message, PR title, and description. Read-only — does not commit or push. |
| `/test-case-design` | Generating test cases from a spec, user story, or acceptance criteria. Covers plain text, CSV, and Gherkin. |

**Rule: never start implementing a feature without first running `/development`. Never fix a bug without first running `/bugfix`.**

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
| New feature | `/development` |
| Bug to investigate | `/bugfix` |
| Ready to commit and PR | `/ship` |
| Writing test cases from a spec | `/test-case-design` |
| Narrowly scoped, single-domain task | Call the relevant specialist agent directly |
| Multi-specialist task outside a feature/bug | Invoke `tech-lead` directly with a specific brief |

Do not nest `/development` inside `tech-lead`. They serve the same orchestration purpose — use one or the other, never both.

---

## Execution Workflow (MANDATORY)

For every task:

1. Identify whether it is a feature, a bug, or a scoped single-specialist task
2. Route accordingly (see routing rules above)
3. Do NOT implement ad-hoc — always go through the appropriate skill or agent

Do NOT skip steps.

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
- `main` is always stable — only merged, working code lives here
- All work happens on short-lived branches:
  - `feat/short-description` — new features
  - `fix/short-description` — bug fixes
  - `chore/short-description` — tooling, config, cleanup
  - `test/short-description` — tests only
  - `refactor/short-description` — structural changes, no new behavior
- Never commit directly to `main`

### Commits
- One logical change per commit — no "misc changes" or "WIP" commits
- For feature branches that span multiple parts of the system, structure commits in dependency order (from lower-level building blocks to higher-level consumers). Example (current architecture): schema → services → domain/pipeline → API → UI → infra. The exact layers may evolve — the rule is to commit in the order components depend on each other.
- Format: `type: short description` (lowercase, no period)
  - e.g. `feat: add opportunity classifier`, `fix: extractEmail uppercase mailto`
- Valid types: `feat`, `fix`, `chore`, `test`, `refactor`, `docs`

### Pull Requests
- Every branch merges into `main` via a PR — no direct merges
- Use the PR template at `.github/pull_request_template.md`:
  - Fill in: what it does, type of change, files changed, how to test
  - Complete the checklist before merging (app runs, no secrets, CHANGELOG updated)
- Squash and merge to keep `main` history clean
- Delete the branch after merging

### Releases and Versioning

- Follow Semantic Versioning: `MAJOR.MINOR.PATCH`
  - `PATCH` — bug fixes only (0.1.1)
  - `MINOR` — new features, backwards compatible (0.2.0)
  - `MAJOR` — breaking changes or significant product shifts (1.0.0)
- Cut a release when a coherent set of features works end-to-end — not after every commit

**Release checklist** (do in order):
1. All feature branches merged to `main` via PR
2. `bun run test` passes — 0 failures
3. `bun tsc --noEmit` passes — 0 errors
4. App runs locally without errors (`bun dev`)
5. `[Unreleased]` in `CHANGELOG.md` renamed to version + date: `## [0.3.0] — YYYY-MM-DD`
6. Fresh empty `## [Unreleased]` section opened above it
7. Commit: `chore: release v0.3.0`
8. Tag the commit: `git tag v0.3.0`
9. Push tag: `git push origin v0.3.0`

### Pre-commit verification gate
Before every commit, both must pass:
```bash
bun run test        # 0 failing tests
bun tsc --noEmit    # 0 type errors
```
Do not commit if either fails.

### Environment variables
- Never commit `.env` or `.env.local`
- Always keep `app/.env.example` in sync — add or remove a variable in one, do the same in the other
- `.env.example` contains keys with empty values, never real secrets

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

### Git hooks
- The pre-commit hook lives in `scripts/hooks/pre-commit` (tracked) and `.git/hooks/pre-commit` (active)
- After cloning, run `sh scripts/setup-hooks.sh` to install
- The hook runs `bun run test` and `bun tsc --noEmit` and blocks the commit if either fails

### Private Data
- `_private/` is gitignored
- Never commit anything from it

### Journal (`_private/JOURNAL.md`)

**Rule: whenever CHANGELOG.md is updated, always update the journal in the same action — no need to ask.**

The journal is a personal development log written for portfolio use. Each entry feeds the project reflection format on the portfolio page.

**When to update:** whenever the user asks, or after a session with meaningful work.

**Entry format — one section per working session:**

```
## [Date] — [Short title describing the session]

### What I built
One or two paragraphs. Concrete, specific. What exists now that didn't before.

### What I was trying to learn
What skill, concept, or problem drove this session beyond just shipping the feature.

### What went wrong
Honest account of failures, dead ends, and wasted time. Don't sanitize.

### Biggest challenge / bug
Single hardest thing. One focused story — what it was, why it was hard, how it was resolved.

### What I learned
The insight that will change how I approach something next time. Not a summary of what I did — the thing I now know that I didn't before.

### What I would do differently
Specific and actionable. What would change if starting over with today's knowledge.
```

**Tone rules:**
- Write in first person ("I built", "I learned", not "the developer")
- Human and personal — this is a reflection, not a changelog
- Honest about failures and confusion, not just wins
- No bullet-point dumps — write in prose
- Avoid technical jargon unless explaining it is the point
- Do NOT mirror the CHANGELOG — the journal is about the experience, not the feature list

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