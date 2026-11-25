
-- CivicFix M4.2: Public analytics summary RPC.
-- Returns aggregate counts only. No personal or private report data.

CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total', (
      SELECT count(*)::int
      FROM public.reports
      WHERE deleted_at IS NULL
    ),
    'by_status', COALESCE((
      SELECT json_object_agg(status, cnt)
      FROM (
        SELECT status, count(*)::int AS cnt
        FROM public.reports
        WHERE deleted_at IS NULL
        GROUP BY status
      ) AS s
    ), '{}'::json),
    'by_category', COALESCE((
      SELECT json_object_agg(category, cnt)
      FROM (
        SELECT category, count(*)::int AS cnt
        FROM public.reports
        WHERE deleted_at IS NULL
        GROUP BY category
      ) AS c
    ), '{}'::json),
    'daily_counts', COALESCE((
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT
          to_char(created_at::date, 'YYYY-MM-DD') AS report_date,
          count(*)::int AS count
        FROM public.reports
        WHERE deleted_at IS NULL
          AND created_at >= now() - interval '30 days'
          AND created_at <= now()
        GROUP BY created_at::date
        ORDER BY created_at::date
      ) AS d
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Allow public execution of aggregate analytics.
REVOKE ALL ON FUNCTION public.get_analytics_summary()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_analytics_summary()
TO anon, authenticated;
