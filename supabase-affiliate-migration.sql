-- =====================================================
-- AFFILIATE SYSTEM - Supabase Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Affiliates table
create table if not exists affiliates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  affiliate_code text unique not null,
  payout_email text,
  commission_rate numeric default 30,
  status text default 'active' check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz default now()
);

-- Click tracking
create table if not exists affiliate_clicks (
  id uuid default gen_random_uuid() primary key,
  affiliate_id uuid references affiliates(id) on delete cascade,
  ip_address text,
  user_agent text,
  referrer text,
  country text,
  created_at timestamptz default now()
);

-- Conversions (sales)
create table if not exists affiliate_conversions (
  id uuid default gen_random_uuid() primary key,
  affiliate_id uuid references affiliates(id) on delete cascade,
  click_id uuid references affiliate_clicks(id) on delete set null,
  order_amount numeric not null,
  commission_amount numeric not null,
  status text default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  created_at timestamptz default now()
);

-- Payouts
create table if not exists affiliate_payouts (
  id uuid default gen_random_uuid() primary key,
  affiliate_id uuid references affiliates(id) on delete cascade,
  amount numeric not null,
  status text default 'pending' check (status in ('pending', 'paid', 'rejected')),
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Indexes for performance
create index if not exists idx_affiliate_clicks_affiliate_id on affiliate_clicks(affiliate_id);
create index if not exists idx_affiliate_clicks_created_at on affiliate_clicks(created_at);
create index if not exists idx_affiliate_conversions_affiliate_id on affiliate_conversions(affiliate_id);
create index if not exists idx_affiliate_conversions_status on affiliate_conversions(status);

-- Row Level Security (optional, enable if needed)
-- alter table affiliates enable row level security;
-- alter table affiliate_clicks enable row level security;
-- alter table affiliate_conversions enable row level security;
-- alter table affiliate_payouts enable row level security;
