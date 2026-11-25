# CivicFix

**AI-Assisted Civic Issue Reporting and Resolution Platform**

CivicFix is a responsive, accessible web platform for reporting local civic infrastructure and sanitation issues, tracking resolution progress, viewing public non-identifying issue maps and analytics, and managing administrative triage with an immutable status audit trail.

---

## Implemented Capabilities

- **Citizen Authentication:** Email/password registration, sign-in, sign-out, session persistence, and protected citizen routes via Supabase Auth.
- **Citizen Report Submission (`/reports/new`):** Validated issue reporting (title, description, category, location description, optional browser geolocation coordinates, and optional AI category suggestion).
- **My Reports (`/reports/my`):** Authenticated citizen view of submitted reports with status, priority, category, location, date, refresh, loading, empty, and error states.
- **Admin Dashboard & Review (`/admin`, `/admin/reports/:id`):** Role-gated administrative queue with status/category filters, priority updates, atomic status transitions with optional resolution notes, and `status_events` audit history.
- **Public Issue Map (`/map`):** Publicly accessible non-PII coordinate map and keyboard-navigable report list backed by `get_public_reports()` (generic category titles, approximate `"Approximate area"` label, and coordinates rounded to 2 decimal places).
- **Public Analytics (`/analytics`):** Public aggregate statistics (total, open, resolved, rejected, status breakdown, category breakdown, and 30-day daily trend with accessible data table) backed by `get_analytics_summary()`.
- **Optional AI Classification:** Server-side `classify-report` Supabase Edge Function calling Gemini API (`GEMINI_API_KEY`) using only report `title` and `description`. Citizens review and accept or ignore suggestions; core reporting works normally when AI is disabled or unconfigured.

---

## Technology Stack

- **Frontend:** React 18, TypeScript (strict mode), Vite 5, Tailwind CSS 3, React Router v6
- **Backend / Database:** Hosted Supabase (PostgreSQL, Row Level Security, `SECURITY DEFINER` RPCs, Auth, Edge Functions)
- **Testing & Quality:** Vitest, React Testing Library, ESLint (`--max-warnings 0`), TypeScript `tsc --noEmit`
- **Deployment Target:** Vercel (static Vite SPA with `vercel.json` SPA rewrites)

---

## Prerequisites

- Node.js 20+ (verified with Node 22.11.0)
- `pnpm`
- A Supabase project (for live database, auth, and optional Edge Functions)

---

## Local Setup

1. Install dependencies:
   ```bash
   pnpm --ignore-workspace install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase project values:
   ```bash
   cp .env.example .env.local
   ```
3. Start the development server:
   ```bash
   pnpm --ignore-workspace run dev
   ```

> Note: `.env.local` is ignored by `.gitignore`. Never commit `.env`, `.env.local`, service-role keys, or provider API keys.

---

## Environment Variables

### Client-side (`.env.local` or hosting environment)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Hosted Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase public/publishable anon key (safe for browser; security enforced by RLS) |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Reserved optional Google Maps key (currently unused; map uses coordinate canvas + accessible list) |

### Server-side only (Supabase Edge Function Secrets — NEVER prefix with `VITE_`)

| Secret | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | No | Google Gemini API key for `classify-report` Edge Function |
| `GEMINI_MODEL` | No | Optional Gemini model override (defaults to `gemini-2.0-flash`) |

---

## Supabase Setup & Migrations

Apply the SQL migrations in order via the **Supabase Dashboard → SQL Editor** (or Supabase CLI):

1. `supabase/migrations/001_initial_schema.sql` — `profiles`, `reports`, `status_events`, indexes, `handle_new_user()` trigger, `is_admin()`, and RLS policies.
2. `supabase/migrations/002_admin_rpcs.sql` — `update_report_status()` and `update_report_priority()` `SECURITY DEFINER` RPCs.
3. `supabase/migrations/003_public_reports_rpc.sql` — `get_public_reports()` non-PII public summary RPC.
4. `supabase/migrations/004_analytics_rpc.sql` — `get_analytics_summary()` aggregate-only RPC.

To promote an admin user after sign-up:
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

---

## Optional AI Edge Function Deployment

If you want live Gemini-backed category suggestions:

```bash
supabase functions deploy classify-report
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```

If `classify-report` is not deployed or `GEMINI_API_KEY` is unset, clicking **Suggest category with AI** displays a clear unavailable message and manual category selection + report submission continue working normally.

---

## Scripts

```bash
pnpm --ignore-workspace run dev         # Start local Vite dev server
pnpm --ignore-workspace run typecheck   # TypeScript strict typecheck (tsc --noEmit)
pnpm --ignore-workspace run lint        # ESLint (--max-warnings 0)
pnpm --ignore-workspace run test -- --run  # Run Vitest unit & component suite
pnpm --ignore-workspace run build       # Typecheck + production Vite build to dist/
```

---

## Deployment (Vercel)

- **Build Command:** `pnpm --ignore-workspace run build` (or `pnpm run build` if workspace root config is absent)
- **Output Directory:** `dist`
- **SPA Routing:** `vercel.json` rewrites all routes (`/(.*)`) to `/index.html` so direct navigation and browser refreshes on `/map`, `/analytics`, `/reports/my`, `/admin`, etc. resolve properly.
- **Environment Variables:** Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel project settings.
- **Supabase Auth URLs:** Add your deployed Vercel domain to **Supabase Dashboard → Authentication → URL Configuration** (`Site URL` and `Redirect URLs`).

---

## Main Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page and category overview |
| `/sign-in`, `/sign-up` | Public | Citizen authentication |
| `/map` | Public | Non-PII public civic issue map and accessible list |
| `/analytics` | Public | Aggregate community issue statistics |
| `/reports/new` | Authenticated | Submit a civic issue report (with optional AI suggestion) |
| `/reports/my` | Authenticated | Track personal submitted reports |
| `/admin` | Admin | Administrative report queue and filters |
| `/admin/reports/:id` | Admin | Review report, update priority/status, view `status_events` |

---

## Security & Privacy Notes

- Authorization is enforced at the PostgreSQL layer via RLS and `SECURITY DEFINER` RPCs (`SET search_path = ''`), never solely in the React UI.
- Citizens cannot alter `status`, `priority`, `reporter_id`, or `deleted_at`, and cannot assign themselves `admin` role.
- Public endpoints (`/map`, `/analytics`) never expose `reporter_id`, emails, descriptions, photos, or exact coordinates.
- AI classification sends only `title` and `description` and requires an authenticated user JWT.

---

## Known Limitations

- **My Reports hard-refresh visibility (unresolved):** `/reports/my` may fail to display a previously submitted report after a hard browser refresh even though the row exists in Supabase.
- **Photo upload placeholder:** The photo file input on `/reports/new` is a UI placeholder, not a working upload feature; private Storage bucket upload and signed URLs are not yet enabled.
- **Optional AI classification:** Live Gemini classification requires deploying `classify-report` and setting `GEMINI_API_KEY` in Supabase Edge Function secrets.
- **E2E / automated accessibility suite:** No Playwright end-to-end or automated `axe` accessibility suite has been verified.
- **Google Maps JS API:** Not integrated; `/map` uses the built-in coordinate visualization and accessible report list.
- **Challenge rubric & license:** Official hackathon challenge statement and exact judging rubric remain unavailable; open-source license selection is pending owner decision (see `docs/12_DECISIONS_AND_OPEN_QUESTIONS.md`).
