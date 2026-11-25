# 10 — Implementation Plan

> Updated M1A.1. Reconciled with security corrections (server-side Gemini Edge Function, private photo bucket, atomic status/priority RPCs, and non-PII public RPCs).

## M0 — Inspect and align ✅
- Inspect repository and all documentation.
- Confirm challenge topic (AI-Assisted Civic Issue Reporting and Resolution Platform).
- Note seven judging categories; weights unknown.

## M1A & M1A.1 — Challenge alignment, blueprint, and security corrections ✅
- Finalized provisional stack, Google services strategy, data model, RLS, and milestone plan.
- Corrected Gemini API placement (Edge Function secret, never `VITE_`), private photo bucket + signed URLs, PostgreSQL view security (`security_invoker` + non-PII public RPCs), `deleted_at` consistency, and atomic `update_report_status` / `update_report_priority` RPCs.
- Recorded recommended defaults (pending owner approval).
- No application code created.

## M1 — Project foundation
**Objective:** Runnable skeleton; all quality gates wired.
- Vite + React 18 + TypeScript scaffold.
- Tailwind CSS.
- ESLint + TypeScript ESLint; Vitest; Playwright skeleton.
- Shared layout: header, navigation, footer.
- Route skeleton (`react-router-dom` v6): `/`, `/sign-in`, `/sign-up`, `/reports/new`, `/reports/my`, `/reports/:id`, `/map`, `/analytics`, `/admin`, `/admin/reports/:id`.
- `.gitignore`, `.env.example` (no server secrets in `VITE_` vars).
- Smoke test: app renders.
- **Security:** `.gitignore` excludes `.env` and `node_modules/` before first upload/commit.
- **Verification:** `lint`, `typecheck`, `test`, `build` all pass.

## M2 — Authentication
**Objective:** Citizens and admins can sign in; role gates enforced.
- Email + password auth via Supabase Auth (default; Google OAuth optional/deferred).
- `profiles` table with RLS and auth sign-up trigger.
- Sign-in, sign-up, sign-out UI.
- Route guards: `AuthGuard`, `AdminGuard`.
- Supabase migration: `001_profiles.sql`.
- **Security:** role never self-assigned; RLS verified.
- **Tests:** sign-up / sign-in / sign-out; auth guard blocks; admin guard blocks non-admin.

## M3 — Citizen reporting workflow
**Objective:** Citizens can submit and track reports.
- Report form: title, description, category, location text, optional map pin, optional photo upload.
- Client + server validation; accessible error messages.
- Submission → stable report ID + confirmation.
- My Reports list (paginated, filterable).
- Report detail page + status history + signed photo URL for authorized viewer.
- Supabase migrations: `002_reports.sql`, `003_status_events.sql`, private bucket `report-photos` + Storage RLS.
- Optional Google Maps picker (feature-flagged on `VITE_GOOGLE_MAPS_API_KEY`).
- **Security:** `reporter_id` forced by RLS (`auth.uid()`); citizens cannot modify admin fields; private photo bucket with MIME/size allowlist and UUID filenames.
- **Tests:** valid submission; missing field rejection; upload over limit; citizen cannot see another's reports or private photos; Playwright E2E for submit→detail.

## M4 — Admin workflow
**Objective:** Admins can review, prioritize, and resolve reports.
- Admin dashboard: all active reports, filters by category/status/date, pagination.
- Atomic status update via `update_report_status` RPC (+ optional note, writes `status_events`).
- Priority update via `update_report_priority` RPC.
- Status history panel on report detail.
- Supabase migration: `004_admin_rpcs.sql`.
- **Security:** all admin writes gated by `profiles.role = 'admin'` inside `SECURITY DEFINER` RPCs (`SET search_path = public`); non-admin calls rejected; invalid transitions rejected; status + audit event atomic.
- **Tests:** non-admin cannot access admin routes/RPCs; valid admin status & priority updates succeed; invalid transition rejected; `status_events` row created atomically.

## M5 — Public map and analytics
**Objective:** Public can see non-PII reports on a map; analytics dashboard shows real data.
- Public map: Google Maps JS API markers (or styled list fallback if no key) powered by `get_public_reports()` RPC (non-PII fields only).
- Analytics page: count by category, status breakdown, 30-day trend powered by `get_analytics_summary()` RPC.
- **Security:** public RPCs expose no `reporter_id`, email, or private `photo_path`; user-scoped views use `security_invoker = true`.
- **Tests:** analytics values match DB counts; map renders without key; public payload contains no PII.

## M6 — Optional AI classification
**Objective:** Category suggestion on report form; core workflow unaffected without it.
- Supabase Edge Function `classify-report` calling Gemini API with server-side `GEMINI_API_KEY` secret.
- Client `classify.ts` adapter calling Edge Function with automatic fallback to in-browser `KeywordClassifier`.
- Suggestion chip on form; user can accept or override.
- **Security:** `GEMINI_API_KEY` never exposed in `VITE_` vars; only `title` and `description` sent (no PII).
- **Tests:** keyword fallback returns valid category; adapter degrades gracefully when Edge Function unavailable; suggestion overridable.

## M7 — Quality, security, and accessibility
**Objective:** All quality gates pass; accessibility verified.
- Keyboard navigation audit + visible focus rings.
- ARIA labels and landmark roles.
- Color contrast and reduced-motion checks.
- Loading / empty / error states for all pages.
- RLS policy & threat-model documentation.
- `axe-playwright` scan.
- All 9 critical test scenarios from `docs/08_TESTING_QUALITY.md` verified.

## M8 — Release readiness
**Objective:** Deployable, documented, submission-ready.
- `README.md` with setup, env vars, run/test/deploy instructions.
- Hosted Supabase & Vercel deployment setup guide.
- Google Maps (HTTP-referrer restricted) and Gemini Edge Function setup guides.
- Known limitations note and license file (MIT pending owner approval).
- Full requirement traceability table.
- `PROJECT_STATUS.md` finalized.

## Quota-aware execution
Implement one milestone or small subtask at a time. Record results in `PROJECT_STATUS.md` after each milestone. Stop at verified checkpoints. Do not build multiple milestones in a single request.
