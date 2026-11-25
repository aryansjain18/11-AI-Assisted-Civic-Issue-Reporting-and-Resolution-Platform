# 04 — Architecture

> Updated M1A.1: corrected Gemini server-side boundary, PostgreSQL view security, private photo access, and admin priority/status RPCs.

## Overview
CivicFix is a single-page React + TypeScript application backed by hosted Supabase (PostgreSQL, Auth, private Storage, and Edge Functions). Authorization is enforced at the Supabase PostgreSQL (RLS and `SECURITY DEFINER` RPCs) and Storage policy layers—never only in the UI.

## Module structure (planned)

```
src/
  components/     # Shared UI components (Layout, StatusBadge, PriorityBadge, MapPicker, …)
  pages/          # Route-level page components
    admin/        # Admin-only pages (Dashboard, ReportReview)
  hooks/          # Custom React hooks (useAuth, useClassification, useReports, …)
  lib/            # Non-UI logic (supabase.ts, auth.ts, reports.ts, storage.ts, classify.ts, analytics.ts)
  types/          # Shared TypeScript types and enums (Report, Profile, StatusEvent, …)
  router.tsx      # Route definitions and auth/admin guards
  main.tsx        # Application entry point
supabase/
  migrations/     # SQL migration files (tables, RLS, RPCs, views, storage policies)
  functions/      # Supabase Edge Functions (e.g., classify-report for Gemini)
```

## Data flow

1. User completes a validated React form.
2. Client calls Supabase JS SDK (parameterized queries / RPCs / Edge Functions).
3. Supabase enforces RLS policies, DB constraints, and `SECURITY DEFINER` RPC checks before reading or writing any row.
4. Operation succeeds or returns a typed error.
5. UI reflects the result (loading, success, empty, or error state).

## Roles

| Role | Established by | Description |
|---|---|---|
| `citizen` | Default on sign-up | Submit and track own reports |
| `admin` | Manual DB update or seeded migration | Review all reports; change status, priority, and notes |

Role is stored in `profiles.role`. Users cannot update their own role. RLS and admin RPCs verify `profiles.role = 'admin'` for every administrative operation. The UI checks role for routing and conditional rendering only—the database is the authoritative boundary.

## Authorization & Database View Boundaries

- **Hidden UI controls are not authorization.** Every admin mutation is blocked at the DB level for non-admins.
- **RLS policies** are enabled and tested for `SELECT`, `INSERT`, `UPDATE`, `DELETE` on every exposed table.
- **Citizens cannot modify administrative fields:** `status`, `priority`, `reporter_id`, and `deleted_at` are protected at the DB level (citizens have no direct `UPDATE` on administrative columns).
- **Atomic status & priority updates:** Status transitions and `status_events` inserts execute atomically inside PostgreSQL `SECURITY DEFINER` RPC `update_report_status(...)` (`SET search_path = public`). Priority updates execute inside `update_report_priority(...)`.
- **PostgreSQL view security (`security_invoker`):**
  - Views that query user-owned data must set `WITH (security_invoker = true)` (PostgreSQL 15+) so they run with the caller's permissions and respect RLS rather than bypassing RLS as the view owner.
  - Because `reports` restricts `SELECT` to `reporter_id = auth.uid()` or `admin` (to protect `reporter_id` and private fields), public map data and aggregate analytics are served through narrowly scoped `SECURITY DEFINER` RPC functions (`get_public_reports()`, `get_analytics_summary()`) with `SET search_path = public` that return **only** non-PII fields/aggregates—never `reporter_id`, email, or private photo paths.

## Photo Privacy Boundary

- `report-photos` is a **private** Supabase Storage bucket (`public = false`).
- `reports.photo_path` stores the storage object path (not a public URL).
- Upload validation enforces allowlisted MIME types (`image/jpeg`, `image/png`, `image/webp`), size limits (5 MB client / 10 MB bucket), and UUID-generated filenames.
- Read access uses short-lived **signed URLs** issued only to authorized users (the report owner or an admin) via Storage RLS policies. Public/unauthenticated visitors do not receive private photos.

## AI Classification Boundary

```
ReportForm
  → useClassification hook
    → classify.ts adapter
        ├── Supabase Edge Function: classify-report (calls Gemini with server-side GEMINI_API_KEY)
        └── KeywordClassifier fallback (in-browser, zero cost, always available)
```

- `GEMINI_API_KEY` is stored **only** as a Supabase Edge Function secret—never in `VITE_` variables.
- Only `title` and `description` are sent to the Edge Function; PII (`reporter_id`, email, location, photos) is never sent to the AI provider.
- Classification output is a display suggestion only; the user can accept or override it.

## Google Maps Boundary

```
NewReport page
  → MapPicker component (feature-flagged on VITE_GOOGLE_MAPS_API_KEY)
      ├── Google Maps JS API pin picker  (key present)
      └── Text input fallback            (key absent)

PublicMap page
  → Google Maps JS API markers           (key present)
  └── Styled list fallback               (key absent)
```

## Security rules
- Enforce authorization at the DB (Supabase RLS and `SECURITY DEFINER` RPCs with `SET search_path = public`), not only in the UI.
- Validate and normalize all inputs server-side (DB `CHECK` constraints + RPC validation).
- Use parameterized access through Supabase JS SDK; no raw SQL from client.
- Upload filenames are UUID-generated; original filenames are discarded.
- Secrets in server-side env/Edge Function secrets only; never committed or exposed in `VITE_` variables.
- Internal errors are not exposed in API responses.

## Routing (planned)

| Path | Access | Page |
|---|---|---|
| `/` | Public | Home / landing |
| `/reports/new` | Authenticated (citizen) | Submit new report |
| `/reports/my` | Authenticated (citizen) | My reports list |
| `/reports/:id` | Authenticated (own or admin) | Report detail + history |
| `/map` | Public (non-PII summary only) | Public report map / list |
| `/analytics` | Public (aggregates only) | Analytics dashboard |
| `/admin` | Admin only | Admin report queue |
| `/admin/reports/:id` | Admin only | Admin review and status/priority update |
| `/sign-in` | Public | Sign in |
| `/sign-up` | Public | Sign up |

## Performance notes
- Paginate all report lists (page size ≤ 25).
- Index `reports.reporter_id`, `reports.status`, `reports.category`, `reports.created_at`, and `reports.deleted_at`.
- Lazy-load the `MapPicker` component (dynamic import) to avoid loading Google Maps on pages that don't need it.
- Tailwind CSS purge removes unused classes in production build.
