# Oportuno

Lead generation and outreach tool for small businesses in Portugal.

Finds companies that likely need your services, generates personalised emails in European Portuguese, and sends them via Resend — all from a single dashboard.

---

## Features

- **Company Discovery** — search by industry and city using Google Places API
- **Opportunity Detection** — classifies each company as `NO_WEBSITE`, `WEAK_WEBSITE`, or `NONE`
- **Contact Extraction** — extracts public business emails from company websites via Playwright
- **Email Generation** — generates personalised outreach emails in PT-PT via Claude (or mock mode)
- **Email Sending** — sends individually via Resend and logs the result to the database

---

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling   | Tailwind CSS v4                   |
| Database  | PostgreSQL via Prisma ORM         |
| Email     | Resend API                        |
| Scraping  | Playwright (email extraction)     |
| Discovery | Google Places API                 |
| AI        | Anthropic Claude (PT-PT emails)   |
| Charts    | Recharts                          |
| Testing   | Vitest                            |

---

## Setup

### Prerequisites

- [Bun](https://bun.sh/)
- PostgreSQL running locally
- API keys (see Environment Variables below)

### Install & Run

```bash
cd app
bun install
bunx prisma db push
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Git hooks

After cloning, install the pre-commit and pre-push hooks:

```bash
sh scripts/setup-hooks.sh
```

- **pre-commit** — runs `bun tsc --noEmit` (type check only, fast)
- **pre-push** — runs `bun run test` (full test suite before code leaves your machine)

---

## Environment Variables

Copy `app/.env.example` to `app/.env.local` and fill in your values:

```bash
cp app/.env.example app/.env.local
```

| Variable               | Required | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                         |
| `GOOGLE_API_KEY`       | Yes      | Google Places API key                                |
| `RESEND_API_KEY`       | Yes      | Resend API key for email sending                     |
| `RESEND_FROM_ADDRESS`  | Yes      | Verified sender address configured in Resend         |
| `USE_MOCK_AI`          | No       | Set to `true` to skip Anthropic and use mock emails  |
| `ANTHROPIC_API_KEY`    | No       | Required only when `USE_MOCK_AI` is not `true`       |

---

## Testing

```bash
cd app
bun run test        # run all tests once
bun run test:watch  # watch mode
```

52 unit tests across four service modules: opportunity classification, email extraction, email generation, and template rendering. All tests run offline with no external API calls.

---

## Project Structure

```
app/
├── app/              # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── companies/
│   │   ├── pipeline/
│   │   └── email/
│   └── page.tsx      # Main dashboard
├── lib/
│   ├── services/     # Business logic
│   └── prisma.ts     # Prisma client
├── prisma/
│   └── schema.prisma
└── tests/            # Vitest unit tests
scripts/
├── hooks/
│   ├── pre-commit    # tsc check
│   └── pre-push      # test suite
└── setup-hooks.sh    # installs hooks after cloning
```

---

## Constraints

- Only uses public business data
- No LinkedIn scraping
- GDPR compliant — legitimate interest basis + opt-out included in every email
