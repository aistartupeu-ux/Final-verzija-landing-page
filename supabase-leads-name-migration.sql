-- Add name column to leads (for Join page)
-- Run in Supabase SQL Editor if not already applied
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;
