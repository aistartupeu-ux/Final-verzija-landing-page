-- Add UTM and source tracking columns to leads (for analytics)
-- Run in Supabase SQL Editor if not already applied
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_tag text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS affiliate_code text;
CREATE INDEX IF NOT EXISTS idx_leads_source_tag ON leads(source_tag);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
