# LeadBridge

Lead generation and outreach tool for small businesses in Portugal.

Finds companies that likely need your services, generates personalised emails in European Portuguese, and sends them via Resend — all from a single dashboard.

---

## Features

- **Company Discovery** — search by industry and city using Google Places API
- **Opportunity Detection** — classifies each company as `NO_WEBSITE`, `WEAK_WEBSITE`, or `NONE`
- **Contact Extraction** — extracts public business emails from company websites
- **Email Generation** — generates personalised outreach emails in PT-PT (real or mock)
- **Email Sending** — sends individually via Resend and logs the result

---

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Framework | Next.js (App Router), TypeScript  |
| Styling   | Tailwind CSS                      |
| Database  | PostgreSQL via Prisma ORM         |
| Email     | Resend API                        |
| Scraping  | Playwright (email extraction)     |
| Discovery | Google Places API                 |

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

---

## Environment Variables

Create `app/.env.local` with the following:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/leadbridge_db?schema=public"
GOOGLE_API_KEY=""
RESEND_API_KEY=""
RESEND_FROM_ADDRESS=""
USE_MOCK_AI=true
```

| Variable            | Description                                      |
|---------------------|--------------------------------------------------|
| `DATABASE_URL`      | PostgreSQL connection string                     |
| `GOOGLE_API_KEY`    | Google Places API key                            |
| `RESEND_API_KEY`    | Resend API key for email sending                 |
| `RESEND_FROM_ADDRESS` | Verified sender address in Resend              |
| `USE_MOCK_AI`       | Set to `true` to skip Anthropic and use mock emails |

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
└── prisma/
    └── schema.prisma
```
