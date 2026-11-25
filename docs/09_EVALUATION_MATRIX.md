# 09 — Evaluation Matrix

> Updated M1A.1. Official scoring weights are **unknown**. All seven categories are treated as equally important provisionally.

| Category | Planned evidence | Key files / milestones |
|---|---|---|
| **Code Quality** | TypeScript strict mode; ESLint passing; small focused modules; meaningful naming; documented interfaces; no dead code | `src/lib/`, `src/types/`, M1 |
| **Security** | Supabase RLS on every table (`SELECT`, `INSERT`, `UPDATE`, `DELETE`); `profiles.role` enforced at DB; private photo bucket + signed URLs; `GEMINI_API_KEY` server-side only in Edge Function; `security_invoker = true` on user views + non-PII RPCs for public data; atomic `update_report_status` & `update_report_priority` RPCs; no secrets committed | `supabase/migrations/`, `supabase/functions/`, `src/lib/storage.ts`, M2–M4, M6, M7 |
| **Efficiency** | Indexed columns (`status`, `category`, `reporter_id`, `created_at`, `deleted_at`); paginated list views (≤25 rows); Tailwind CSS purge; Vite tree-shaking; lazy-loaded `MapPicker` | `src/lib/reports.ts`, migrations, M5, M7 |
| **Testing** | Vitest unit tests for validation, domain rules, keyword classifier, analytics; RTL component tests for form states; Playwright E2E for citizen submit, admin update, auth guard, keyboard flow; 9 critical scenarios from `docs/08` covered; results recorded | `src/__tests__/`, `e2e/`, M2–M6, M7 |
| **Accessibility** | Semantic HTML; every input labeled; keyboard-navigable routes; visible focus rings; ARIA roles where needed; `axe-playwright` scan; reduced-motion respected; mobile-responsive | `src/components/`, M7 |
| **Google Services** | Google Maps JS API (optional, HTTP-referrer restricted): location picker + public report map; Gemini API (optional, server-side Edge Function): AI category suggestion with keyword fallback; Google OAuth (optional, deferred) | `src/components/MapPicker.tsx`, `supabase/functions/classify-report/`, `src/lib/classify.ts`, M3, M5, M6 |
| **Problem Statement Alignment** | Citizen reporting → M3; status tracking → M3+M4; admin review & prioritization → M4; analytics → M5; AI-assisted classification → M6; location evidence → M3; optional photo evidence → M3 | Full traceability table in M8 README |

## Evidence rule
For every claimed achievement, identify the file, test, configuration, or demonstrated behavior. Do not add Google services merely to increase their number. Do not claim tests pass without running them and recording results.

## Traceability note
When the final scoring weights are released, update this matrix with explicit point estimates and re-prioritize accordingly.
