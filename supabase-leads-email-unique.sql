-- Optional: one row per normalized email (stops double insert under concurrent requests).
-- If this fails, remove duplicate emails in `leads` first (same lower(trim(email))).
create unique index if not exists leads_email_lower_unique on leads (lower(trim(email)));
