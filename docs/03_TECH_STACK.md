# 03 — Technology Stack

> Updated M1A.1: stack confirmed provisionally; Gemini API moved server-side; Google API key restrictions and quotas documented.

## Confirmed stack (provisional until challenge/owner sign-off)

| Layer | Technology | Reason |
|---|---|---|
| Frontend framework | React 18 + TypeScript | Type-safe, well-documented, beginner-friendly |
| Build tool | Vite | Fast HMR, first-class TS/React, optimal production build |
| Styling | Tailwind CSS | Utility-first, responsive-by-default, good accessibility primitives |
| Backend / Database | Hosted Supabase (PostgreSQL + Auth + Storage + Edge Functions) | DB, auth, private file storage, RLS, Edge Functions, and JS SDK on a single free-tier platform |
| Unit / component tests | Vitest + React Testing Library | Native Vite integration; RTL enforces accessible component design |
| End-to-end tests | Playwright | Cross-browser E2E; `axe-playwright` for automated accessibility |
| Linting | ESLint + TypeScript ESLint | Standard TS/React lint pipeline |
| Routing | react-router-dom v6 | Standard SPA routing |
| Hosting (recommended default) | Vercel (free tier) | Zero-config Vite SPA deployment; pending owner approval |

## Google services (all optional)

| Service | Status | Placement | Purpose |
|---|---|---|---|
| Google Maps JavaScript API (+ optional Geocoding API) | Optional (feature-flagged) | Client-side (`VITE_GOOGLE_MAPS_API_KEY`) | Interactive location picker on report form; public report map |
| Gemini API | Optional (isolated adapter) | **Server-side only** (Supabase Edge Function secret `GEMINI_API_KEY`) | AI category suggestion from title + description |
| Google OAuth | Optional (deferred; email/password default) | Supabase Auth dashboard | "Sign in with Google" if enabled later |

All Google services degrade gracefully. Core reporting works without any Google API key.

## Package manager
`pnpm` (preferred for speed and disk efficiency); `npm` acceptable as fallback.

## External service record

### Supabase (Hosted)
- **Why:** Replaces a separate custom backend; provides PostgreSQL, Auth, private Storage, RLS, and Edge Functions.
- **Free-tier limits:** 500 MB database, 1 GB file storage, 50 MB/day upload, 50,000 monthly active users, Edge Function invocation limits.
- **Env vars (client):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key is public by design; security relies on RLS).
- **Secrets (server-side):** `SUPABASE_SERVICE_ROLE_KEY` (never exposed to client), `GEMINI_API_KEY` (Edge Function secret only).
- **Failure behavior:** App shows clear error state; no silent data loss.
- **Fallback:** Not applicable (Supabase is the primary data layer).
- **Core reporting:** Requires Supabase.

### Google Maps JavaScript API (+ optional Geocoding API)
- **Why:** Interactive location picking and public report map visualization.
- **Configuration & key restrictions:** `VITE_GOOGLE_MAPS_API_KEY` is a browser key and **must** be restricted in Google Cloud Console by **HTTP referrer** (localhost + deployed domain) and restricted to **only** Maps JavaScript API (and Geocoding API if enabled).
- **Billing & quotas:** Google Maps Platform requires a billing account, with a \$200/month free credit. Set daily quota caps and billing alerts in Google Cloud Console to prevent unexpected charges.
- **Env var:** `VITE_GOOGLE_MAPS_API_KEY` (optional).
- **Failure behavior:** Component detects missing/blocked key and renders text-input / styled-list fallback.
- **Fallback:** Plain text address field + optional lat/lng inputs; styled list view for public reports.
- **Core reporting:** Works without key.

### Gemini API
- **Why:** Optional AI category suggestion.
- **Security rule:** **Never expose `GEMINI_API_KEY` via any `VITE_` environment variable or client bundle.** Calls must go through a Supabase Edge Function (`classify-report`) that reads `GEMINI_API_KEY` from server-side secrets.
- **Configuration & quotas:** Restrict key in Google AI Studio / Cloud Console to Generative Language API. Free-tier rate limits (RPM/RPD) apply; set budget alerts if billing is enabled.
- **Env var (Edge Function only):** `GEMINI_API_KEY`.
- **Failure behavior:** If the Edge Function is unconfigured, rate-limited, or fails, the client/server falls back to the deterministic keyword classifier automatically.
- **Fallback:** In-browser keyword rule classifier (zero cost, zero network, always available).
- **Core reporting:** Works without key.

## Secrets
Use environment variables and Supabase Edge Function secrets only. `.env` is in `.gitignore`. Provide `.env.example` with placeholders only. Never commit real credentials or expose server secrets in `VITE_` variables.
