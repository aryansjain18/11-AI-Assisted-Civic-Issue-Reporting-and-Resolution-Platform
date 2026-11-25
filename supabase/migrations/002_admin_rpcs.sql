-- CivicFix M3: Trusted Administrative RPCs
-- Adds atomic, admin-authorized PostgreSQL functions for report status and priority updates.
-- Non-destructive migration building on 001_initial_schema.sql.

-- ============================================================================
-- 1. Atomic Status Update + Audit Event RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_report_status(
  p_report_id uuid,
  p_new_status text,
  p_note text DEFAULT NULL
)
RETURNS public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_report public.reports;
  v_updated public.reports;
  v_clean_note text;
  v_allowed boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update report status.'
      USING ERRCODE = '42501';
  END IF;

  IF p_new_status IS NULL OR p_new_status NOT IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status value: %', p_new_status
      USING ERRCODE = '22023';
  END IF;

  v_clean_note := NULLIF(btrim(COALESCE(p_note, '')), '');
  IF v_clean_note IS NOT NULL AND char_length(v_clean_note) > 500 THEN
    RAISE EXCEPTION 'Status note must be 500 characters or fewer.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_report
  FROM public.reports
  WHERE id = p_report_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_report.status = p_new_status THEN
    RAISE EXCEPTION 'Report is already in status "%".', p_new_status
      USING ERRCODE = '22023';
  END IF;

  v_allowed := CASE v_report.status
    WHEN 'submitted' THEN p_new_status IN ('under_review', 'rejected')
    WHEN 'under_review' THEN p_new_status IN ('in_progress', 'rejected')
    WHEN 'in_progress' THEN p_new_status IN ('resolved', 'rejected')
    ELSE false
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition from "%" to "%".', v_report.status, p_new_status
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.reports
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_report_id
  RETURNING * INTO v_updated;

  INSERT INTO public.status_events (
    report_id,
    actor_id,
    previous_status,
    new_status,
    note
  )
  VALUES (
    p_report_id,
    auth.uid(),
    v_report.status,
    p_new_status,
    v_clean_note
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.update_report_status(uuid, text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_report_status(uuid, text, text)
TO authenticated;

-- ============================================================================
-- 2. Trusted Priority Update RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_report_priority(
  p_report_id uuid,
  p_new_priority text
)
RETURNS public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated public.reports;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update report priority.'
      USING ERRCODE = '42501';
  END IF;

  IF p_new_priority IS NULL
   OR p_new_priority NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid priority value: %', p_new_priority
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.reports
  SET priority = p_new_priority,
      updated_at = now()
  WHERE id = p_report_id
    AND deleted_at IS NULL
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.update_report_priority(uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_report_priority(uuid, text)
TO authenticated;