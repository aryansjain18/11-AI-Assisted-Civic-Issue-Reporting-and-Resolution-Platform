-- CivicFix M2.3A: Database Schema Foundation
-- Tables: profiles, reports, status_events
-- Includes constraints, indexes, auth signup trigger, safe existing-user backfill,
-- non-recursive is_admin() helper, least-privilege grants, and RLS policies.
-- Do NOT add public SECURITY DEFINER RPCs or weaken RLS.

-- ============================================================================
-- 1. Tables
-- ============================================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text CHECK (
    display_name IS NULL
    OR char_length(btrim(display_name)) BETWEEN 1 AND 100
  ),
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 5 AND 120),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 20 AND 2000),
  category text NOT NULL CHECK (
    category IN ('pothole', 'garbage', 'water_leak', 'streetlight', 'drainage', 'other')
  ),
  location_text text NOT NULL CHECK (char_length(btrim(location_text)) BETWEEN 3 AND 500),
  location_lat numeric(10, 7) CHECK (
    location_lat IS NULL OR (location_lat BETWEEN -90 AND 90)
  ),
  location_lng numeric(10, 7) CHECK (
    location_lng IS NULL OR (location_lng BETWEEN -180 AND 180)
  ),
  status text NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')
  ),
  priority text NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  photo_path text CHECK (
    photo_path IS NULL OR char_length(btrim(photo_path)) BETWEEN 1 AND 500
  ),
  ai_category_suggestion text CHECK (
    ai_category_suggestion IS NULL
    OR ai_category_suggestion IN ('pothole', 'garbage', 'water_leak', 'streetlight', 'drainage', 'other')
  ),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_coordinates_pair_check CHECK (
    (location_lat IS NULL AND location_lng IS NULL)
    OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)
  )
);

CREATE TABLE public.status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status text CHECK (
    previous_status IS NULL
    OR previous_status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')
  ),
  new_status text NOT NULL CHECK (
    new_status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')
  ),
  note text CHECK (note IS NULL OR char_length(btrim(note)) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================

CREATE INDEX idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX idx_reports_status ON public.reports (status);
CREATE INDEX idx_reports_category ON public.reports (category);
CREATE INDEX idx_reports_created_at ON public.reports (created_at DESC);
CREATE INDEX idx_reports_active_created_at
  ON public.reports (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_status_events_report_id
  ON public.status_events (report_id, created_at ASC);

-- ============================================================================
-- 3. Timestamp & Signup Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Creates a citizen profile on new auth.users registration.
-- Security: role is hardcoded to 'citizen'; signup metadata is never trusted.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name text;
BEGIN
  v_display_name := NULLIF(
    left(btrim(COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')), 100),
    ''
  );

  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, v_display_name, 'citizen')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill users who registered before this migration installed the trigger.
-- Existing profile rows (including any existing role assignment) are preserved.
INSERT INTO public.profiles (id, display_name, role)
SELECT
  u.id,
  NULLIF(
    left(btrim(COALESCE(u.raw_user_meta_data ->> 'display_name', '')), 100),
    ''
  ),
  'citizen'
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Non-recursive Admin Helper (internal RLS use only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT role = 'admin'
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;

-- Functions are executable by PUBLIC by default. Restrict direct client access.
-- Trigger functions remain usable by their already-created triggers.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 5. Row Level Security & Least-Privilege Grants
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_events ENABLE ROW LEVEL SECURITY;

-- Start from no direct table privileges for client roles.
-- Reapply only the permissions required by the policies below.
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.reports FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.status_events FROM PUBLIC, anon, authenticated;

-- Profiles: citizens can only update their own display_name (never role).
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Reports: citizens can read own active reports and insert new reports for themselves.
-- UPDATE is granted at table level, but RLS permits it only for trusted admins.
GRANT SELECT, INSERT, UPDATE ON TABLE public.reports TO authenticated;

CREATE POLICY "reports_select_own"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "reports_select_admin"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "reports_insert_own"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND status = 'submitted'
    AND priority = 'low'
    AND deleted_at IS NULL
  );

CREATE POLICY "reports_update_admin"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Status events: citizens can read history for their own active reports; admins read all.
-- Direct client inserts, updates, and deletes are not permitted.
GRANT SELECT ON TABLE public.status_events TO authenticated;

CREATE POLICY "status_events_select_own"
  ON public.status_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = status_events.report_id
        AND r.reporter_id = auth.uid()
        AND r.deleted_at IS NULL
    )
  );

CREATE POLICY "status_events_select_admin"
  ON public.status_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
