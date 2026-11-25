# 05 — Data Model

> Updated M1A.1: resolved `deleted_at` consistency, added `update_report_priority` RPC, documented atomic status/audit transitions, `security_invoker` view rules, and private photo storage.

## Entities

### `profiles`

Extends Supabase `auth.users`. Created by trigger on user sign-up.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` PK | References `auth.users(id) ON DELETE CASCADE` |
| `display_name` | `text` | Nullable |
| `role` | `text` | NOT NULL, CHECK IN ('citizen','admin'), DEFAULT 'citizen' |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() |

**RLS policies:**
- `SELECT`: user reads own row (`id = auth.uid()`); admins read all.
- `INSERT`: auth trigger only (not directly by client).
- `UPDATE`: user updates own `display_name` only (column-restricted / trigger-enforced so `role` cannot be changed via client API).
- `DELETE`: none (cascades from `auth.users` deletion).

---

### `reports`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` PK | DEFAULT gen_random_uuid() |
| `reporter_id` | `uuid` | NOT NULL, FK → `profiles(id)` |
| `title` | `text` | NOT NULL, length 5–120 |
| `description` | `text` | NOT NULL, length 20–2000 |
| `category` | `text` | NOT NULL, CHECK IN ('pothole','garbage','water_leak','streetlight','drainage','other') |
| `location_text` | `text` | NOT NULL, length 3–500 |
| `location_lat` | `numeric(10,7)` | Nullable (from map pin) |
| `location_lng` | `numeric(10,7)` | Nullable (from map pin) |
| `status` | `text` | NOT NULL, CHECK IN ('submitted','under_review','in_progress','resolved','rejected'), DEFAULT 'submitted' |
| `priority` | `text` | NOT NULL, CHECK IN ('low','medium','high'), DEFAULT 'low' |
| `photo_path` | `text` | Nullable; private Supabase Storage object path (not a public URL) |
| `ai_category_suggestion` | `text` | Nullable; CHECK IN ('pothole','garbage','water_leak','streetlight','drainage','other') OR NULL; display/audit reference only |
| `deleted_at` | `timestamptz` | Nullable; soft-delete timestamp (NULL = active) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() |

**Indexes:** `reporter_id`, `status`, `category`, `created_at`, and partial index `WHERE deleted_at IS NULL`.

**RLS policies:**
- `SELECT`: citizen sees own active reports (`reporter_id = auth.uid() AND deleted_at IS NULL`); admin sees all. Public/unauthenticated users have **no** direct `SELECT` on `reports` (preventing exposure of `reporter_id` or private fields).
- `INSERT`: authenticated user; `reporter_id` forced to `auth.uid()` by `WITH CHECK (reporter_id = auth.uid())`, `status = 'submitted'`, `priority = 'low'`, `deleted_at IS NULL`.
- `UPDATE`: citizens cannot change administrative fields (`status`, `priority`, `reporter_id`, `deleted_at`). All admin updates to `status`, `priority`, and `deleted_at` go through trusted `SECURITY DEFINER` RPCs.
- `DELETE`: no direct client `DELETE`; admins soft-delete via trusted RPC setting `deleted_at = now()`.

---

### `status_events`

Immutable audit log of every report status change.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` PK | DEFAULT gen_random_uuid() |
| `report_id` | `uuid` | NOT NULL, FK → `reports(id) ON DELETE CASCADE` |
| `actor_id` | `uuid` | NOT NULL, FK → `profiles(id)` |
| `previous_status` | `text` | Nullable (NULL on initial creation event if logged) |
| `new_status` | `text` | NOT NULL |
| `note` | `text` | Nullable; admin-supplied note (max 500 chars) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() |

**RLS policies:**
- `SELECT`: citizen sees events for own active reports; admin sees all.
- `INSERT`: via trusted DB function `update_report_status()` only; no direct client `INSERT`.
- `UPDATE` / `DELETE`: none (immutable audit log).

---

## Trusted Admin RPCs (Atomic & Server-Authorized)

All administrative mutations run as PostgreSQL `SECURITY DEFINER` functions with `SET search_path = public` so they execute atomically inside a single transaction and cannot be bypassed by client requests.

### 1. `update_report_status(p_report_id uuid, p_new_status text, p_note text DEFAULT NULL)`
Allowed transitions:
```
submitted      → under_review | rejected
under_review   → in_progress  | rejected
in_progress    → resolved     | rejected
resolved       → (terminal)
rejected       → (terminal)
```
Steps (single atomic transaction):
1. Verify caller is admin (`EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`); otherwise raise `insufficient_privilege`.
2. Lock target active report row (`FOR UPDATE`, `deleted_at IS NULL`); raise error if not found.
3. Validate transition from `current_status` to `p_new_status`.
4. Update `reports.status` and `reports.updated_at = now()`.
5. Insert row into `status_events` (`report_id`, `actor_id = auth.uid()`, `previous_status`, `new_status`, `note`).
If any step fails, the entire transaction rolls back.

### 2. `update_report_priority(p_report_id uuid, p_new_priority text)`
Steps (single atomic transaction):
1. Verify caller is admin (`profiles.role = 'admin'`); otherwise raise `insufficient_privilege`.
2. Validate `p_new_priority IN ('low', 'medium', 'high')`.
3. Update `reports.priority` and `reports.updated_at = now()` where `id = p_report_id AND deleted_at IS NULL`.

---

## Photo Storage (Private Bucket)

- **Bucket:** `report-photos` with **`public = false`** (private).
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`.
- **Size limits:** 5 MB client-side validation; 10 MB Supabase bucket limit.
- **Path & filename:** `{auth.uid()}/{report_id}/{uuid}.{ext}` — never original filenames.
- **Storage RLS (`storage.objects`):**
  - `INSERT`: authenticated users may upload only under their own `{auth.uid()}/` folder prefix.
  - `SELECT`: report owner (`owner = auth.uid()` / path prefix match) or `admin` only.
  - Access in UI: generate short-lived signed URLs (`createSignedUrl`) for authorized viewers only. Unauthorized users and public visitors cannot access private photos.

---

## Views & Public Read Boundaries

### View security (`security_invoker`)
- Any PostgreSQL view that queries `reports` or `status_events` for authenticated users **must** be created with `WITH (security_invoker = true)` (PostgreSQL 15+) so the view executes with the caller's privileges and enforces RLS policies rather than running with the view owner's privileges.

### Public map & analytics (non-PII projections)
Because `reports` itself has no `anon` `SELECT` policy (to prevent exposing `reporter_id`, `photo_path`, or other private fields via PostgREST):
- **`get_public_reports()`** (`SECURITY DEFINER`, `SET search_path = public`, granted to `anon, authenticated`): returns **only** `id`, `title`, `category`, `status`, `location_text`, `location_lat`, `location_lng`, `created_at` where `status <> 'rejected' AND deleted_at IS NULL`. Never returns `reporter_id`, `photo_path`, or user emails.
- **`get_analytics_summary()`** (`SECURITY DEFINER`, `SET search_path = public`, granted to `anon, authenticated`): returns aggregate counts by `category`, by `status`, and 30-day daily totals for active (`deleted_at IS NULL`) reports.

---

## Integrity Rules
- All PKs and timestamps are server-generated (`gen_random_uuid()`, `now()`).
- Status, category, and priority values are enforced at the DB level by `CHECK` constraints.
- Foreign keys enforced across `profiles`, `reports`, and `status_events`.
- Transitions and admin mutations enforced in `SECURITY DEFINER` DB functions, never in client code alone.
- Personal data minimized: no phone numbers, no public exposure of `reporter_id`, emails, or private photos.
