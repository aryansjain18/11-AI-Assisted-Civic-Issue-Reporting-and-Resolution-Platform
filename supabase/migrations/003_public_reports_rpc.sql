
-- CivicFix M4.1: Limited public report summaries.
-- Public coordinates are approximate (rounded to two decimal places).
-- Original titles, descriptions, reporter IDs, and photo paths are not exposed.

DROP FUNCTION IF EXISTS public.get_public_reports();

CREATE FUNCTION public.get_public_reports()
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  status text,
  priority text,
  location_text text,
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    r.id,
    initcap(replace(r.category::text, '_', ' ')) || ' report',
    r.category::text,
    r.status,
    r.priority,
    'Approximate area'::text,
    round(r.location_lat::numeric, 2),
    round(r.location_lng::numeric, 2),
    r.created_at
  FROM public.reports AS r
  WHERE r.deleted_at IS NULL
    AND r.status <> 'rejected'
  ORDER BY r.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.get_public_reports()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_reports()
TO anon, authenticated;
