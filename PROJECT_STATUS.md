# CivicFix — Project Status

**Last updated:** 2026-11-25

---

## M0 — Challenge and repository inspection ✅ COMPLETE

**Result:** Documentation-only repository confirmed. No application code exists. Challenge topic confirmed: AI-Assisted Civic Issue Reporting and Resolution Platform. Seven judging categories noted (official weights unknown).

**No application files modified.**

---

## M1A — Challenge alignment and architecture blueprint ✅ COMPLETE

**Result:** Technical blueprint drafted; documentation updated; no application code created.

---

## M1A.1 — Architecture and security corrections ✅ COMPLETE

**Result:** Security and data-model review completed and applied to documentation before coding. No application code created.

---

## M1 — Project Foundation ✅ COMPLETE

**Result:** Clean React 18 + TypeScript (strict mode) + Vite + Tailwind CSS + React Router + ESLint + Vitest + React Testing Library foundation established. Accessible CivicFix application shell, navbar, skip-to-content link, footer, pages/placeholders, shared types, domain badges, and quality gates are operational and verified.

---

## M2.1 — Supabase Client Setup ✅ COMPLETE

**Result:** Installed `@supabase/supabase-js` (`2.119.2`) and created the reusable, validated Supabase client module (`src/lib/supabase.ts`) using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only (no secret or service-role keys). `.env.local` remains ignored in `.gitignore`, and `.env.example` uses placeholders only.

**Changed / created files:**
- `package.json`, `pnpm-lock.yaml` — added `@supabase/supabase-js@^2.119.2` (`2.119.2` installed).
- `src/vite-env.d.ts` — typed `ImportMetaEnv` for `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_GOOGLE_MAPS_API_KEY`.
- `src/lib/supabase.ts` — `getSupabaseConfig()`, `createSupabaseClient()`, and `supabase` singleton with missing/blank env var validation.
- `src/__tests__/supabase.test.ts` — 5 unit tests covering missing/blank env vars, trimmed config, and singleton initialization.
- `.env.example` — updated placeholder to `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Commands executed & actual results:**
1. `pnpm --ignore-workspace typecheck` (`tsc --noEmit`): Exit code 0, 0 errors.
2. `pnpm --ignore-workspace lint` (`eslint . --max-warnings 0`): Exit code 0, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace test` (`vitest run`): Exit code 0, 5 test files passed, 34 tests passed (0 failed).
4. `pnpm --ignore-workspace build` (`tsc --noEmit && vite build`): Exit code 0, built `dist/` in 456ms (`dist/index.html` 0.56 kB, `dist/assets/index-*.css` 19.31 kB, `dist/assets/index-*.js` 229.21 kB).

**Next recommended subtask:**
- **M2.2: Authentication & Profiles** (database migration `001_profiles.sql` with RLS, `useAuth` hook, sign-in/sign-up/sign-out integration, and route guards).

---

## M2.2 — Citizen Authentication ✅ COMPLETE

**Result:** Implemented Supabase email/password citizen authentication (sign-up with email-confirmation handling, sign-in, sign-out, session restoration on reload via `getSession` and `onAuthStateChange`), shared `AuthProvider`/`useAuth`, and `AuthGuard` protecting `/reports/my`. No database tables, RLS policies, report submission, or admin authorization were implemented.

**Changed / created files:**
- `src/lib/auth.ts` — `signUpWithEmail`, `signInWithEmail`, `signOutUser`, and `formatAuthError`.
- `src/context/auth-context.ts` & `src/context/AuthContext.tsx` — shared auth state, session restoration, and `onAuthStateChange` subscription.
- `src/hooks/useAuth.ts` — `useAuth()` hook.
- `src/components/AuthGuard.tsx` — route guard with loading state and redirect to `/sign-in` preserving target path.
- `src/components/Navbar.tsx` — authenticated user display/email and Sign Out button vs. Sign In link.
- `src/pages/SignInPage.tsx` & `src/pages/SignUpPage.tsx` — connected forms with client validation, loading, error, and email-confirmation success states.
- `src/pages/MyReportsPage.tsx` — removed M1 unauthenticated notice now that `/reports/my` is protected by `AuthGuard`.
- `src/main.tsx`, `src/router.tsx`, `src/App.tsx` — wrapped app in `AuthProvider` and protected `/reports/my` with `AuthGuard`.
- `src/__tests__/auth.test.tsx`, `src/__tests__/App.test.tsx`, `src/__tests__/routing.test.tsx` — added 8 auth/guard tests and updated shell/routing tests with mocked Supabase client.

**Commands executed & actual results:**
1. `pnpm --ignore-workspace typecheck` (`tsc --noEmit`): Exit code 0, 0 errors.
2. `pnpm --ignore-workspace lint` (`eslint . --max-warnings 0`): Exit code 0, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace test` (`vitest run`): Exit code 0, 6 test files passed, 42 tests passed (0 failed).
4. `pnpm --ignore-workspace build` (`tsc --noEmit && vite build`): Exit code 0, built `dist/` in 656ms (`dist/index.html` 0.56 kB, `dist/assets/index-*.css` 19.87 kB, `dist/assets/index-*.js` 466.32 kB).

**Next recommended milestone:**
- **M3 / Schema & Citizen Reporting** (or **M2.3** if `profiles` table + RLS is added before report submission).

---

## M2.3A — Database Schema Foundation ✅ COMPLETE

**Result:** Created the versioned PostgreSQL migration `supabase/migrations/001_initial_schema.sql` defining `profiles`, `reports`, and `status_events`, constraints, indexes (including partial index for active non-deleted reports), timestamp/signup triggers, non-recursive `is_admin()` helper, and least-privilege RLS policies. Migration has **not** been applied to a live Supabase project yet.

**Created files:**
- `supabase/migrations/001_initial_schema.sql` — tables, constraints, indexes, `set_updated_at()` and `handle_new_user()` triggers, `is_admin()` helper, RLS enablement, and least-privilege policies.
- `src/__tests__/migration.test.ts` — 8 static SQL invariant tests verifying tables, `deleted_at` partial index, RLS, hardcoded `'citizen'` role, column-restricted profile updates, `is_admin()` security, no `USING (true)`/`WITH CHECK (true)`, and `anon` revocation.

**Commands executed & actual results:**
1. `pnpm --ignore-workspace typecheck` (`tsc --noEmit`): Exit code 0, 0 errors.
2. `pnpm --ignore-workspace lint` (`eslint . --max-warnings 0`): Exit code 0, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace test` (`vitest run`): Exit code 0, 7 test files passed, 50 tests passed (0 failed).
4. `pnpm --ignore-workspace build` (`tsc --noEmit && vite build`): Exit code 0, built `dist/` in 743ms.

**Next recommended step:**
- Review and apply `supabase/migrations/001_initial_schema.sql` to the hosted Supabase project (via Supabase SQL Editor or CLI), then proceed to **M3: Citizen reporting workflow** (or storage bucket + RLS setup).

---

## M2 — Citizen Reporting (My Reports & Navigation) ✅ COMPLETE

**Result:** Completed and manually verified in browser with two separate citizen accounts, confirming end-to-end authentication, report submission, My Reports retrieval, and Supabase RLS row isolation.

**Changed / created files:**
- `src/lib/reports.ts` — `fetchMyReports()`, `getCategoryLabel()`, and `formatReportDate()`.
- `src/pages/MyReportsPage.tsx` — fetches citizen reports, renders responsive accessible report cards, refresh button, loading (`role="status"`), error (`role="alert"` + retry), and empty states.
- `src/pages/NewReportPage.tsx` — added `"View My Reports"` link in the submission success notice while preserving existing report submission logic.
- `src/__tests__/myReports.test.tsx` — 6 tests covering unauthenticated redirect, loading state, report retrieval/display, empty state, error + retry, and refresh.
- `src/__tests__/auth.test.tsx` — added `supabase.from` mock for `/reports/my` integration.

---

## M3 — Admin Dashboard and Resolution ✅ IMPLEMENTED (Pending Live Migration & Browser Verification)

**Result:** Implemented the admin-only dashboard, report review page, priority updates, atomic status transitions with `status_events` audit history, `AdminGuard`, and trusted PostgreSQL RPC migration `002_admin_rpcs.sql`.

**Changed / created files:**
- `supabase/migrations/002_admin_rpcs.sql` — non-destructive migration adding `SECURITY DEFINER` RPCs `update_report_status(p_report_id, p_new_status, p_note)` and `update_report_priority(p_report_id, p_new_priority)` with `SET search_path = ''`, `public.is_admin()` checks, transition validation, atomic `status_events` insert, and `REVOKE ALL ... FROM PUBLIC` / `GRANT EXECUTE ... TO authenticated`.
- `src/lib/auth.ts`, `src/context/auth-context.ts`, `src/context/AuthContext.tsx` — added `fetchUserProfile()` and exposed `profile` / `isAdmin` for UI routing only.
- `src/components/AdminGuard.tsx` — blocks unauthenticated users (redirect to `/sign-in`) and non-admin citizens (`Access denied` alert).
- `src/components/Navbar.tsx` — conditionally renders `Admin` navigation link when `isAdmin` is true.
- `src/lib/admin.ts` — `ALLOWED_STATUS_TRANSITIONS`, `fetchAllReports()`, `fetchAdminReportById()`, `fetchReportStatusEvents()`, `updateReportStatus()`, and `updateReportPriority()`.
- `src/pages/admin/AdminDashboardPage.tsx` — admin report queue with live summary counts, status/category filters, refresh button, loading/error/empty states, and review links.
- `src/pages/admin/AdminReportReviewPage.tsx` — full report review, priority update form, status transition form with optional note, terminal-state handling, and `status_events` timeline.
- `src/router.tsx` & `src/App.tsx` — protected `/admin` and `/admin/reports/:id` routes with `AdminGuard`.
- `src/__tests__/admin.test.tsx`, `src/__tests__/migration.test.ts`, `src/__tests__/myReports.test.tsx`, `src/__tests__/routing.test.tsx` — added 6 admin workflow tests and 3 `002_admin_rpcs.sql` security invariant tests.

**Commands executed & actual results:**
1. `pnpm --ignore-workspace typecheck` (`tsc --noEmit`): Exit code `0`, 0 errors.
2. `pnpm --ignore-workspace lint` (`eslint . --max-warnings 0`): Exit code `0`, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace test` (`vitest run`): Exit code `0`, 9 test files passed, 65 tests passed (0 failed).
4. `pnpm --ignore-workspace build` (`tsc --noEmit && vite build`): Exit code `0`, 102 modules transformed, built `dist/` in 690ms (`dist/index.html` 0.56 kB, `dist/assets/index-*.css` 22.38 kB, `dist/assets/index-*.js` 486.04 kB).

**Remaining manual verification steps:**
- Apply `supabase/migrations/002_admin_rpcs.sql` in the Supabase Dashboard SQL Editor.
- Promote a test admin user in `public.profiles` (`UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';`).
- Verify in browser: non-admin citizen is denied `/admin` and RPC calls; admin can view all reports, update priority, transition status with notes, and see `status_events` history persisted.

**Created files and major components:**
- Configuration & environment: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `.gitignore`, `.env.example`, `index.html`, `public/favicon.svg`.
- Styles: `src/index.css` (Tailwind base/components/utilities, focus rings, reduced-motion overrides, skip link, button & badge components).
- Core routing & entry: `src/main.tsx`, `src/App.tsx`, `src/router.tsx`.
- Shared layout: `src/components/Layout.tsx` (skip-link + semantic main), `src/components/Navbar.tsx` (brand logo, desktop + mobile nav), `src/components/Footer.tsx`.
- Shared components: `src/components/StatusBadge.tsx` (accessible badge with non-color label), `src/components/PriorityBadge.tsx`.
- Domain models: `src/types/index.ts` (Category, Status, Priority, Profile, Report, StatusEvent, PublicReportSummary).
- Pages & placeholders: `src/pages/HomePage.tsx` (hero, feature cards, categories), `src/pages/NewReportPage.tsx`, `src/pages/MyReportsPage.tsx`, `src/pages/PublicMapPage.tsx`, `src/pages/AnalyticsPage.tsx`, `src/pages/SignInPage.tsx`, `src/pages/SignUpPage.tsx`, `src/pages/NotFoundPage.tsx`, `src/pages/admin/AdminDashboardPage.tsx`.
- Test suite: `src/test/setup.ts`, `src/__tests__/App.test.tsx`, `src/__tests__/routing.test.tsx`, `src/__tests__/components.test.tsx`, `src/__tests__/types.test.ts`.

**Dependencies added:**
- Production: `react`, `react-dom`, `react-router-dom`.
- Development: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8`.

**Commands executed & actual results:**
1. `pnpm typecheck` (`tsc --noEmit`): Exit code 0, 0 errors.
2. `pnpm lint` (`eslint . --max-warnings 0`): Exit code 0, 0 warnings, 0 errors.
3. `pnpm test` (`vitest run`): Exit code 0, 4 test files passed, 29 tests passed (0 failed).
4. `pnpm build` (`tsc --noEmit && vite build`): Exit code 0, built `dist/` in 474ms (`dist/index.html` 0.56 kB, `dist/assets/index-*.css` 19.31 kB, `dist/assets/index-*.js` 229.21 kB).

**Known issues / non-blocking notes:**
- React Router v6 logs standard v7 future flag warnings during test execution (`v7_startTransition`, `v7_relativeSplatPath`), which do not affect functionality.
- Node.js runtime environment was set up locally in `/tmp` for execution as Node was not globally present in system PATH.

**Next recommended milestone:**
- **M2: Authentication** (Supabase Auth integration, `profiles` table schema and RLS policies, `useAuth` hook, sign-in/sign-up forms, and route protection guards).

---

## Recommended defaults awaiting owner approval before M2

- [ ] Hosted Supabase (free tier)
- [ ] Vercel deployment (free tier)
- [ ] Email + password authentication (Google OAuth optional/deferred)
- [ ] Optional photo uploads (private bucket + signed URLs)
- [ ] Limited public non-PII report information (`/map` and `/analytics` via RPCs)
- [ ] Optional Google Maps JS API (HTTP-referrer restricted; text fallback when absent)
- [ ] Optional Gemini API (Supabase Edge Function secret; keyword fallback when absent)
- [ ] MIT License (pending owner approval)

---

## M4.1 — Public Issue Map ✅ COMPLETE

**Result:** Implemented and manually verified the public civic issue map using a restricted Supabase RPC. Public visitors can view active, non-rejected reports without exposing original report titles, descriptions, reporter IDs, or exact coordinates.

**Completed and verified:**
- Device location capture is optional during report submission.
- Report coordinates are saved to Supabase.
- Reports without coordinates remain available in the public report list.
- `get_public_reports()` returns limited public report summaries.
- Public coordinates are rounded to two decimal places.
- Generic category-based titles and approximate-area labels are displayed.
- Reports with coordinates appear as pins on the public map.
- Public map loading, error, empty, and refresh states are implemented.

**Quality checks:**
- `pnpm run typecheck` — passed.
- `pnpm run lint` — passed.
- `pnpm run test -- --run` — 10 test files, 74 tests passed.
- `pnpm run build` — passed.

**Database changes:**
- `supabase/migrations/003_public_reports_rpc.sql`
- Citizen INSERT permission updated to include `location_lat` and `location_lng`.

**Next recommended subtask:**
- M4.2 — Analytics dashboard implementation and verification.

---

## M4.2 — Public Analytics Dashboard ✅ COMPLETE

**Result:** Implemented and verified a publicly accessible analytics dashboard backed by the restricted Supabase RPC `get_analytics_summary()`. The dashboard displays aggregate report totals, status breakdowns, category breakdowns, and daily report counts over the last 30 days. No individual report descriptions, reporter identities, or other personal report details are returned by the analytics RPC.

**Completed and verified:**
- Public `/analytics` page loads without requiring sign-in.
- Total report count matches the Supabase database.
- Status breakdown displays correct counts.
- Category breakdown displays correct counts.
- Daily report trend is returned for the last 30 days.
- Refresh functionality works.
- Loading, error, and empty states are implemented.
- Accessible labels and progress indicators are included.
- Signed-out access verified in an incognito browser session.

**Database changes:**
- `supabase/migrations/004_analytics_rpc.sql` — creates `public.get_analytics_summary()` using `SECURITY DEFINER`, `STABLE`, and an empty `search_path`.
- Function returns aggregate counts only.
- Execution revoked from `PUBLIC`, `anon`, and `authenticated`, then explicitly granted to `anon` and `authenticated`.
- Function owner verified as `postgres`.
- `SECURITY DEFINER` verified as enabled.
- Empty `search_path` verified.
- Public and authenticated execution permissions verified.

**Changed / created files:**
- `supabase/migrations/004_analytics_rpc.sql`
- `src/lib/analytics.ts`
- `src/pages/AnalyticsPage.tsx`
- `src/types/index.ts`
- `src/__tests__/analytics.test.tsx`
- `src/__tests__/migration.test.ts`

**Quality checks:**
- `pnpm run typecheck` — passed.
- `pnpm run lint` — passed.
- `pnpm run test -- --run` — 11 test files passed, 85 tests passed, 0 failed.
- `pnpm run build` — passed; 103 modules transformed.

**Non-blocking notes:**
- Vite reports a JavaScript bundle larger than 500 kB.
- Existing Supabase GoTrueClient, Node localStorage, and React Router future-flag warnings remain non-blocking.

**Next recommended milestone:**
- **M5 — Optional AI classification.** Keep the core reporting workflow functional when the AI service or API key is unavailable.

---

## M5 — Optional AI-Assisted Classification ✅ COMPLETE (Edge Function Deployment Optional)

**Result:** Implemented optional AI-assisted category suggestions in the citizen report submission workflow using a server-side Supabase Edge Function (`classify-report`) backed by Gemini API (`GEMINI_API_KEY`), with strict input/output validation, zero PII transmission, and a graceful disabled/unavailable state when unconfigured or unreachable. No rule-based guesses are presented as AI output, and manual category selection + report submission remain fully functional without AI.

**Features implemented:**
- Server-side `classify-report` Supabase Edge Function (`supabase/functions/classify-report/index.ts`) requiring an authenticated user JWT, validating input bounds, reading `GEMINI_API_KEY` strictly from `Deno.env`, enforcing an 8s timeout, validating Gemini output against the 6 allowed CivicFix categories, and returning a clean `unavailable` (`not_configured`, `rate_limited`, `timeout`, `invalid_response`, `error`) response when disabled or failing.
- Client-side classification adapter (`src/lib/classify.ts`) validating title (5–120 chars) and description (20–2000 chars), sending **only** `{ title, description }`, enforcing a 10s timeout, and validating returned categories against `CATEGORIES`.
- Report form integration (`src/pages/NewReportPage.tsx`) adding an optional `"Suggest category with AI"` action, accessible loading/status announcements (`role="status"`), clearly labeled `"AI Suggestion"` banner with `"Accept suggestion"` and `"Ignore suggestion"` controls, and optional `ai_category_suggestion` persistence on submit (never auto-submitting or altering report status/priority).

**Changed / created files:**
- `supabase/functions/classify-report/index.ts` — server-side Edge Function calling Gemini API with `GEMINI_API_KEY` secret.
- `src/types/index.ts` — added `ClassificationUnavailableReason` and `ClassificationResult` types.
- `src/lib/classify.ts` — `validateClassificationInput()` and `classifyReportText()`.
- `src/pages/NewReportPage.tsx` — integrated optional AI category suggestion UI and `ai_category_suggestion` persistence.
- `eslint.config.js` — ignored Deno Edge Function directory `supabase/functions` from browser `tsconfig.json` lint project.
- `src/__tests__/classify.test.ts` — 8 unit/security tests covering input validation, valid suggestion, unsupported category rejection, malformed responses, missing config, provider errors/rate limits, timeouts, privacy payload check, and Edge Function static security invariants.
- `src/__tests__/newReport.test.tsx` — 5 component tests covering accepting suggestions without auto-submit, ignoring suggestions, manual submission when AI is unavailable, submission without AI, and validation feedback.

**Provider & architecture decisions:**
- Uses Gemini API (`gemini-2.0-flash` default, overridable via `GEMINI_MODEL`) exclusively behind the `classify-report` Supabase Edge Function (`GEMINI_API_KEY` server-side secret, never `VITE_`).
- Free-tier Gemini limits apply if enabled; if `GEMINI_API_KEY` is unset or the Edge Function is not deployed, the UI gracefully displays an unavailable state without blocking reporting.

**Database changes:**
- None required (`public.reports.ai_category_suggestion` and citizen `INSERT` permissions already exist in `supabase/migrations/001_initial_schema.sql`).

**Required configuration (optional, for live AI suggestions):**
- `GEMINI_API_KEY` — Supabase Edge Function secret (never in `.env.local` or `VITE_*`).
- `GEMINI_MODEL` — Optional Supabase Edge Function secret/env var (defaults to `gemini-2.0-flash`).

**Quality checks:**
1. `pnpm --ignore-workspace run typecheck` (`tsc --noEmit`): Exit code 0, 0 errors.
2. `pnpm --ignore-workspace run lint` (`eslint . --max-warnings 0`): Exit code 0, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace run test -- --run` (`vitest run -- --run`): Exit code 0, 13 test files passed, 98 tests passed (0 failed).
4. `pnpm --ignore-workspace run build` (`tsc --noEmit && vite build`): Exit code 0, 104 modules transformed, built `dist/` in 714ms (`dist/index.html` 0.56 kB, `dist/assets/index-*.css` 27.02 kB, `dist/assets/index-*.js` 506.89 kB).

**Known limitations / remaining blockers:**
- Live Gemini classification requires deploying `supabase/functions/classify-report` and setting `GEMINI_API_KEY` in Supabase Edge Function secrets; until deployed/configured, clicking `"Suggest category with AI"` gracefully reports that AI suggestion is unavailable.

**Next milestone:**
- **M6 — Testing, security, accessibility, and performance polish.**

---

## M6 — Testing, Security, and Accessibility ⏳ VERIFIED LOCALLY (Pending Live Browser & Supabase Verification)

**Result:** Completed automated test expansion, security audit, accessibility fixes, and production bundle splitting. All automated checks (`typecheck`, `lint`, `test -- --run`, `build`) pass locally with 104 tests across 13 test files. Live browser testing and hosted Supabase verification were not executed in this offline environment, and the known **My Reports refresh issue** remains **unresolved**.

**Security & accessibility issues found and fixed:**
- **Mobile admin navigation gap (`src/components/Navbar.tsx`):** Added the `Admin` link to the mobile navigation menu when `isAdmin` is true, plus a `catch` handler on `handleSignOut()` to avoid unhandled promise rejections.
- **WCAG AA contrast (`src/pages/SignUpPage.tsx`, `src/pages/admin/AdminReportReviewPage.tsx`):** Updated `(optional)` label helper text from `text-gray-400` to `text-gray-500` for sufficient contrast on white backgrounds.
- **Lint / nullability cleanup (`src/lib/reports.ts`):** Removed redundant `?? []` on already-typed `Report[]` return in `fetchMyReports`.
- **Bundle chunking (`vite.config.ts`):** Split `vendor-react` and `vendor-supabase` chunks via `build.rollupOptions.output.manualChunks`, eliminating the >500 kB main bundle warning (`index-*.js` reduced to `70.59 kB`).

**Security audit summary (static & migration review):**
- Citizens can read/insert only their own active reports via `reports_select_own` and `reports_insert_own` (`reporter_id = auth.uid()`, `status = 'submitted'`, `priority = 'low'`, `deleted_at IS NULL`).
- Citizens cannot update `reports` directly (`reports_update_admin` requires `public.is_admin()`).
- Public RPCs (`get_public_reports()`, `get_analytics_summary()`) use `SECURITY DEFINER`, `SET search_path = ''`, and return only non-PII summaries/aggregates.
- Admin RPCs (`update_report_status`, `update_report_priority`) enforce `public.is_admin()` and atomic `status_events` logging.
- `classify-report` Edge Function requires an authenticated JWT, keeps `GEMINI_API_KEY` server-side only, accepts only `title` and `description`, and validates outputs against `ALLOWED_CATEGORIES`.
- **No database schema changes required.**

**Known unresolved failure — My Reports refresh issue:**
- **Status:** **UNRESOLVED** (could not be reproduced or verified against live hosted Supabase in this offline environment).
- **Symptom:** My Reports (`/reports/my`) may fail to display a persisted report after refreshing the page, even though the row exists in Supabase `public.reports`.
- **Reproduction steps:**
  1. Sign in as a citizen and submit a new report at `/reports/new`.
  2. Confirm the report row exists in Supabase `public.reports` with `reporter_id = <user_uuid>` and `deleted_at IS NULL`.
  3. Navigate to `/reports/my` and perform a full browser page refresh (`F5` / `Cmd+R`).
  4. Observe whether the persisted report renders or fails to appear after session restoration.
- **Investigation notes:** In `AuthContext.tsx`, `restoreSession()` (`getSession()`) and `onAuthStateChange` (`INITIAL_SESSION`) both run on mount; if `INITIAL_SESSION` or `TOKEN_REFRESHED` races with `fetchUserProfile()` or `fetchMyReports(user.id)` before token refresh completes, `MyReportsPage` could query with a stale token or miss a subsequent state update. Live browser/network inspection against hosted Supabase is required to confirm root cause.

**Changed / created files:**
- `src/components/Navbar.tsx` — mobile `Admin` nav link + `signOut` error handling.
- `src/pages/SignUpPage.tsx` — `text-gray-500` contrast fix on optional label.
- `src/pages/admin/AdminReportReviewPage.tsx` — `text-gray-500` contrast fix on optional label.
- `src/lib/reports.ts` — removed unnecessary nullish coalescing in `fetchMyReports`.
- `vite.config.ts` — added `manualChunks` for `vendor-react` and `vendor-supabase`.
- `src/__tests__/newReport.test.tsx` — added 3 tests (validation rejection + no admin fields sent, DB insert error alert, unauthenticated submit disabled).
- `src/__tests__/admin.test.tsx` — added 2 tests (non-admin blocked on `/admin/reports/:id` + hidden nav links, RPC error alert on status update).
- `src/__tests__/migration.test.ts` — added 1 test verifying `reports_insert_own` and `reports_update_admin` RLS constraints.

**Quality checks (exact commands & actual results):**
1. `pnpm --ignore-workspace run typecheck` (`tsc --noEmit`): Exit code `0`, 0 errors.
2. `pnpm --ignore-workspace run lint` (`eslint . --max-warnings 0`): Exit code `0`, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace run test -- --run` (`vitest run -- --run`): Exit code `0`, **13 test files passed, 104 tests passed (0 failed)**.
4. `pnpm --ignore-workspace run build` (`tsc --noEmit && vite build`): Exit code `0`, 104 modules transformed, built `dist/` in 1.29s (`index-*.js` `70.59 kB`, `vendor-react-*.js` `206.33 kB`, `vendor-supabase-*.js` `230.48 kB`, `index-*.css` `26.97 kB`, no chunk warnings).

**Remaining risks & manual verification required:**
- Investigate and verify the **My Reports refresh issue** in a live browser against hosted Supabase (inspect Network tab for `/rest/v1/reports` status/response on hard refresh).
- Run manual keyboard-only and mobile viewport walkthroughs across `/`, `/sign-in`, `/sign-up`, `/reports/new`, `/reports/my`, `/map`, `/analytics`, `/admin`, and `/admin/reports/:id`.
- Verify live Supabase RLS policies and Edge Function deployment (`classify-report` + `GEMINI_API_KEY` if enabling live AI).

---

## M7 — Deployment Readiness and Final Judging Audit ⏳ Deployment-ready locally; hosted deployment pending owner action

**Result:** Completed deployment configuration (`vercel.json` SPA rewrites), reconciled `README.md` and `PROJECT_STATUS.md` with the implemented application, ran final automated verification, and completed the provisional judging-category audit. Live hosting deployment and hosted Supabase Edge Function deployment were not executed from this environment and remain user-side actions.

**Work completed in M7:**
- Added `vercel.json` with SPA rewrite rules (`/(.*)` → `/index.html`) so direct navigation and refreshes on client-side routes do not 404 on Vercel.
- Updated root `README.md` from pre-implementation placeholder text to accurate setup, environment variable, Supabase migration, optional Edge Function deployment, script, route, security, and limitation documentation.
- Conducted production quality & secret audit across `src/` and `supabase/` (zero `service_role` keys, zero `GEMINI_API_KEY` in `VITE_*`, zero `console.log` debug statements).
- Reconciled `PROJECT_STATUS.md` milestone history and recorded the provisional judging-category audit.

**Files created / modified in M7:**
- `vercel.json` — SPA rewrite configuration for Vercel hosting.
- `README.md` — full project, setup, migration, deployment, route, and limitation documentation.
- `PROJECT_STATUS.md` — M7 audit, verification results, deployment readiness, and reconciled milestone checklist.

**Automated verification (exact commands & actual results):**
1. `pnpm --ignore-workspace run typecheck` (`tsc --noEmit`): Exit code `0`, 0 errors.
2. `pnpm --ignore-workspace run lint` (`eslint . --max-warnings 0`): Exit code `0`, 0 errors, 0 warnings.
3. `pnpm --ignore-workspace run test -- --run` (`vitest run -- --run`): Exit code `0`, **13 test files passed, 104 tests passed (0 failed)** (Supabase & Edge Function calls mocked).
4. `pnpm --ignore-workspace run build` (`tsc --noEmit && vite build`): Exit code `0`, 104 modules transformed, built `dist/` in 1.29s (`dist/index.html` `0.73 kB`, `dist/assets/index-*.css` `26.97 kB`, `dist/assets/index-*.js` `70.59 kB`, `dist/assets/vendor-react-*.js` `206.33 kB`, `dist/assets/vendor-supabase-*.js` `230.48 kB`).

**Reported manual browser verification (prior to M7):**
- Citizen sign-in and report submission — passed.
- Admin review and status update — passed.
- Public map and analytics while signed out — passed.
- Admin mobile navigation — passed.
- **Not yet verified in a live hosted deployment:** Vercel production URL, live `classify-report` Edge Function with `GEMINI_API_KEY`.

**AI integration status:**
- **Implemented & unit-tested** (`supabase/functions/classify-report/index.ts`, `src/lib/classify.ts`, `src/pages/NewReportPage.tsx`) with graceful unavailable fallback.
- **Optional / Not yet configured in hosted Supabase:** Requires deploying `classify-report` and setting `GEMINI_API_KEY` as a Supabase Edge Function secret. Core reporting works without it.

**Known unresolved issues & limitations:**
- **My Reports hard-refresh visibility (unresolved):** `/reports/my` may fail to display a previously submitted report after a hard browser refresh, even though the report row is persisted in Supabase `public.reports`. Left untouched per M7 scope to avoid destabilizing working workflows; requires live browser/network debugging against hosted Supabase.
- **Photo upload placeholder:** Photo input on `/reports/new` is a UI placeholder, not a working upload feature.
- **Optional Gemini AI:** Live classification requires deploying `classify-report` and setting `GEMINI_API_KEY` in Supabase Edge Function secrets.
- **Playwright / axe:** No Playwright end-to-end or automated `axe` accessibility suite has been verified.
- **Google Maps JS API:** Not integrated; `/map` uses the built-in coordinate visualization and accessible report list.
- **Official challenge & rubric:** Official hackathon challenge statement and exact judging rubric remain unavailable.

**Remaining owner actions for hosted deployment:**
1. Deploy the Vite app to Vercel (build command `pnpm --ignore-workspace run build`, output directory `dist`, env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
2. Add the deployed Vercel URL to Supabase Dashboard → Authentication → URL Configuration (`Site URL` and `Redirect URLs`).
3. Confirm migrations `001`–`004` are applied on the hosted Supabase project.
4. *(Optional)* Deploy `classify-report` (`supabase functions deploy classify-report`) and set `GEMINI_API_KEY` (`supabase secrets set GEMINI_API_KEY=...`).
5. *(Recommended)* Select and add an open-source license file if publishing publicly.

---

## Milestones

- [x] M0: Challenge and repository inspection
- [x] M1A: Challenge alignment and architecture blueprint
- [x] M1A.1: Architecture and security corrections
- [x] M1: Project foundation
- [x] M2: Citizen authentication and reporting
- [x] M3: Admin dashboard and resolution
- [x] M4.1: Public issue map
- [x] M4.2: Public analytics dashboard
- [x] M5: Optional AI classification
- [x] M6: Testing, security, and accessibility polish (automated checks passed; manual browser checks passed except My Reports hard-refresh issue)
- [ ] M7: Deployment-ready locally; hosted deployment pending owner action

---

## Risks

- Official judging weights and complete challenge statement not yet released; all 7 categories treated as equally important provisionally.
- Google Maps and Gemini API keys may not be available; core workflow remains fully functional without them.
- Supabase free-tier limits (500 MB DB, 1 GB storage, 50 MB/day upload) are sufficient for demo scale.
- Manual ZIP/GitHub-web-UI workflow requires disciplined `.gitignore` hygiene to avoid uploading secrets or `node_modules/`.

---

## Update protocol
After each milestone: record changed files, decisions, exact test commands and results, blockers, and the next smallest task.
