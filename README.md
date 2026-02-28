# InvoiceRecover — Automated Invoice Recovery System

A production-ready SaaS system that automates invoice recovery using psychology-based follow-up staging. Built with Next.js, Supabase, and a pluggable notification system.

## Features

- **Psychology-based follow-ups** — 4-stage escalation (Friendly → Social → Firm → Escalation)
- **Customer Dashboard** — Metrics, charts, invoice management, settings
- **Admin Dashboard** — System-wide analytics, user management, invoice overrides
- **Pluggable notifications** — Email (Nodemailer), SMS & WhatsApp (abstract adapters)
- **Automated cron engine** — Configurable interval, stops on payment
- **Role-based access** — Admin/Customer with Supabase RLS
- **Dark mode** — Premium glassmorphism UI

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Frontend | Next.js 14+ (App Router), TypeScript, TailwindCSS, ShadCN UI |
| Backend  | Supabase (PostgreSQL + Auth + Realtime)                      |
| Charts   | Recharts                                                     |
| Forms    | React Hook Form + Zod                                        |
| Email    | Nodemailer                                                   |
| Deploy   | Docker + Docker Compose                                      |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Copy your project URL and keys from **Settings → API**

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials and SMTP settings.

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### 5. Create Admin User

1. Register a new account
2. In Supabase SQL Editor, run:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Cron Setup

### Local Development

Use an external tool or curl to trigger follow-ups:

```bash
curl -X POST http://localhost:3000/api/cron/process-followups \
  -H "Authorization: Bearer your-cron-secret"
```

### Docker Deployment

The `docker-compose.yml` includes a cron service that triggers automatically.

```bash
docker compose up -d
```

### VPS Cron Tab

```bash
# Run every 6 hours
0 */6 * * * curl -s -X POST https://your-domain.com/api/cron/process-followups -H "Authorization: Bearer YOUR_SECRET"
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Dashboard shell + all pages
│   │   └── dashboard/
│   │       ├── admin/   # Admin overview, users, invoices, logs
│   │       ├── clients/ # Client management
│   │       ├── invoices/ # Invoice list
│   │       └── settings/ # User preferences
│   ├── api/             # REST API routes
│   │   ├── admin/       # Admin endpoints
│   │   ├── clients/
│   │   ├── cron/        # Automation trigger
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx         # Landing page
├── components/
│   ├── dashboard/       # Dashboard-specific components
│   └── ui/              # ShadCN UI primitives
├── lib/
│   ├── automation/      # Follow-up engine
│   │   ├── adapters/    # Email, SMS, WhatsApp
│   │   ├── processor.ts # Core processor
│   │   ├── stages.ts    # Stage logic
│   │   └── templates.ts # Message templates
│   ├── supabase/        # DB client + types
│   └── utils.ts
└── middleware.ts        # Auth middleware
```

## Environment Variables

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server only) |
| `SMTP_HOST`                     | SMTP server hostname                    |
| `SMTP_PORT`                     | SMTP port (587 for TLS)                 |
| `SMTP_USER`                     | SMTP username                           |
| `SMTP_PASS`                     | SMTP password/app password              |
| `SMTP_FROM`                     | From email address                      |
| `CRON_SECRET`                   | Secret key for cron endpoint auth       |
| `CRON_INTERVAL_HOURS`           | Hours between follow-up runs            |
| `NEXT_PUBLIC_APP_URL`           | Public app URL                          |

## Follow-Up Stage Logic

| Stage | Days Overdue | Strategy          |
| ----- | ------------ | ----------------- |
| 1     | 1–4 days     | Friendly Reminder |
| 2     | 5–9 days     | Social Framing    |
| 3     | 10–14 days   | Firm Reminder     |
| 4     | 15+ days     | Escalation        |

Each stage has **3 tone variants**: Friendly, Professional, Firm.

## Future Scalability

- **Stripe Integration** — Auto-import invoices from Stripe
- **Webhook Support** — Receive payment notifications from payment providers
- **Multi-tenant** — Organization-level accounts with team members
- **Custom Templates** — User-defined message templates
- **Analytics** — Advanced reporting with cohort analysis
- **API Keys** — External integration via API
- **Internationalization** — Multi-language support
- **Rate Limiting** — Per-user rate limits for notifications
