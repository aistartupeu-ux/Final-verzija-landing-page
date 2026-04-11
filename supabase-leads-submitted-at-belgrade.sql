-- 1) Pokreni u Supabase SQL Editor.
-- 2) Na Vercelu: SUPABASE_ENABLE_SUBMITTED_AT_BELGRADE=1 (bez ovoga API ne šalje kolonu — insert radi i bez nje).
-- (Staro: SUPABASE_DISABLE_SUBMITTED_AT_BELGRADE=1 više nije potrebno ako ENABLE nije 1.)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submitted_at_belgrade text;
COMMENT ON COLUMN leads.submitted_at_belgrade IS 'Vreme prijave u Europe/Belgrade kao tekst (YYYY-MM-DD HH:mm:ss), upis iz /api/leads.';
