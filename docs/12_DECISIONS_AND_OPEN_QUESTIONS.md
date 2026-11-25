# 12 — Decisions and Open Questions

> Updated M1A.1. Recommended defaults recorded below; **all unresolved items remain pending owner approval and are not final.**

## Confirmed

| Decision | Detail |
|---|---|
| Repository | https://github.com/aryansjain18/11-AI-Assisted-Civic-Issue-Reporting-and-Resolution-Platform |
| Project topic | AI-Assisted Civic Issue Reporting and Resolution Platform |
| Judging categories | Code Quality, Security, Efficiency, Testing, Accessibility, Google Services, Problem Statement Alignment |
| Judging weights | **Unknown.** All seven treated as equally important provisionally. |
| Technology stack | React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Vitest + RTL + Playwright |
| Package manager | `pnpm` (`npm` acceptable fallback) |
| AI security & fallback | `GEMINI_API_KEY` kept strictly server-side in a Supabase Edge Function (never `VITE_`); in-browser keyword classifier always available; no PII sent to AI |
| Public DB views & RPCs | User-scoped views use `security_invoker = true`; public map/analytics use non-PII `SECURITY DEFINER` RPCs (`SET search_path = public`) with no `reporter_id`, email, or private photo access |
| Roles | `citizen` (default) and `admin` (DB-managed); enforced via RLS and `SECURITY DEFINER` RPCs |
| Report lifecycle | `submitted → under_review → in_progress → resolved / rejected`; `deleted_at` soft-delete supported |
| Admin mutations | Atomic `update_report_status` (updates status + inserts `status_events` in one transaction) and `update_report_priority` RPCs |
| Photo storage | Private `report-photos` bucket (`public = false`); signed URLs for owner/admin only; allowlisted MIME types; 5 MB client / 10 MB bucket limit; UUID filenames |
| Coding agent | Google Antigravity (free tier); prompts must be quota-conscious |

## Recommended Defaults (Pending Owner Approval)

| # | Topic | Recommended Default (Provisional) | Impact if Changed |
|---|---|---|---|
| 1 | Supabase environment | **Hosted Supabase** (free tier) | Local `supabase` CLI setup would be needed instead |
| 2 | Deployment target | **Vercel** (free tier) | Build/deploy config adjusted for Netlify or other host |
| 3 | Authentication method | **Email + password** via Supabase Auth | Enabling Google OAuth requires Google Cloud OAuth client ID setup |
| 4 | Photo uploads | **Optional** on report submission | Making required changes form validation |
| 5 | Public report visibility | **Limited non-PII public view** (title, category, status, general location via RPC; no `reporter_id`, email, or private photos) | Requiring sign-in removes public `/map` access for `anon` |
| 6 | Google Maps | **Optional** (`VITE_GOOGLE_MAPS_API_KEY`, HTTP-referrer restricted, text fallback when absent) | If unavailable, text-only location fallback is primary |
| 7 | Gemini AI | **Optional** (`GEMINI_API_KEY` in Edge Function only, keyword fallback when absent) | If unavailable, keyword-only classifier is used |
| 8 | License | **MIT License** (pending owner approval) | Owner must confirm or select another license before M8 |

## Still Unknown (External)
- **Official judging weightages** across the seven categories.
- **Complete official challenge statement** and exact submission format/deadline.

## Decision log

| Date | Decision | Reason | Alternatives considered | Documents affected |
|---|---|---|---|---|
| 2026-11-25 | Confirmed React + TypeScript + Vite + Tailwind + Supabase stack | Cohesive, free-tier, beginner-friendly, covers all 7 judging categories | Next.js; Firebase | 03, 04 |
| 2026-11-25 | Google Maps JS API as optional Google service with text fallback | Directly supports location evidence; HTTP-referrer restricted; works without key | No map | 03, 04, 09 |
| 2026-11-25 | Move Gemini API strictly server-side (Supabase Edge Function `GEMINI_API_KEY`) | Prevents exposing API key in client `VITE_` bundle; keyword fallback keeps core independent | Client-side `VITE_GEMINI_API_KEY` (insecure, rejected in M1A.1) | 03, 04, 09, 10 |
| 2026-11-25 | Private `report-photos` bucket with signed URLs | Prevents unauthorized access to potentially sensitive citizen photos | Public bucket (rejected in M1A.1) | 04, 05, 10 |
| 2026-11-25 | `security_invoker = true` for user views + non-PII `SECURITY DEFINER` RPCs for public map/analytics | Prevents accidental RLS bypass on views while protecting `reporter_id` on `reports` | Public `SELECT` on `reports` (exposes `reporter_id`, rejected) | 04, 05 |
| 2026-11-25 | Atomic `update_report_status` + `update_report_priority` RPCs + `deleted_at` column | Fixes missing priority RPC and `deleted_at` mismatch; ensures status + audit log atomicity | Client-side multi-step writes (non-atomic, insecure) | 04, 05, 10 |
