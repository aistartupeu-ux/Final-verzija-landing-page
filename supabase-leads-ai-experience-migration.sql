-- Thank-you forma: nivo upoznatosti sa AI tehnologijom
-- Pokreni u Supabase SQL Editor ako kolona još ne postoji.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_experience text;
