-- ============================================================
-- No Code-AI — Supabase Schema
-- Run this in your Supabase project:
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- ── Profiles (one per client) ──────────────────────────────
create table if not exists profiles (
  id               uuid references auth.users on delete cascade primary key,
  created_at       timestamptz default now(),
  full_name        text,
  business_name    text,
  phone            text,
  plan             text default 'replace',  -- 'launch' | 'replace' | 'build'
  onboarded        boolean default false,
  notes            text
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'business_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Bot activity log ───────────────────────────────────────
create table if not exists bot_activity (
  id           uuid default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  user_id      uuid references auth.users on delete cascade,
  bot_name     text not null,                 -- felix | kerry | mia | brody
  action_type  text not null,                 -- reply | lead | appointment | email
  chat_id      text,
  message_id   text,
  content      text,
  metadata     jsonb default '{}'
);

-- Index for fast dashboard queries
create index if not exists bot_activity_user_time
  on bot_activity (user_id, created_at desc);

create index if not exists bot_activity_bot_name
  on bot_activity (bot_name, created_at desc);

-- ── Row Level Security ──────────────────────────────────────
alter table profiles     enable row level security;
alter table bot_activity enable row level security;

-- Users can only see their own data
create policy "Users see own profile"
  on profiles for all using (auth.uid() = id);

create policy "Users see own activity"
  on bot_activity for all using (auth.uid() = user_id);

-- Service role (used by bots) can insert activity
-- This is handled automatically by the service key bypass

-- ============================================================
-- Done! Now copy your Project URL and anon key from:
-- Settings → API → Project URL + anon public key
-- Paste them into login.html and dashboard.html
-- ============================================================
