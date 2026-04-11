-- Jedan upit umesto paginacije kroz leads u /api/admin/google-analytics (konverzije po danu).
-- Pokreni u Supabase SQL Editor-u (jednom po projektu).

CREATE OR REPLACE FUNCTION public.admin_lead_conversions_by_day(p_gte timestamptz, p_lte timestamptz)
RETURNS TABLE (day text, conversions bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    to_char((l.created_at AT TIME ZONE 'Europe/Belgrade')::date, 'YYYY-MM-DD') AS day,
    count(DISTINCT lower(trim(l.email)))::bigint AS conversions
  FROM public.leads l
  WHERE l.created_at >= p_gte
    AND l.created_at <= p_lte
    AND l.email IS NOT NULL
    AND length(trim(l.email)) > 0
  GROUP BY (l.created_at AT TIME ZONE 'Europe/Belgrade')::date
  ORDER BY 1;
$$;

COMMENT ON FUNCTION public.admin_lead_conversions_by_day(timestamptz, timestamptz) IS
  'Admin GA4 grafikon: jedinstveni email po kalendarskom danu (Europe/Belgrade).';

GRANT EXECUTE ON FUNCTION public.admin_lead_conversions_by_day(timestamptz, timestamptz) TO service_role;
