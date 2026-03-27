-- ============================================================
-- Kroot Online Rooms — Supabase SQL Migration
-- Run this in the Supabase SQL Editor to create the rooms table
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) not null unique,
  slug varchar(50) not null,
  host_id varchar(64) not null,
  status varchar(20) not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished')),
  game_config jsonb not null default '{}',
  game_state jsonb not null default '{}',
  players jsonb not null default '[]',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

-- Index for fast code lookups
create index if not exists idx_rooms_code on rooms (code);

-- Index for cleanup queries
create index if not exists idx_rooms_expires_at on rooms (expires_at);

-- Row Level Security
alter table rooms enable row level security;

-- Anyone can read rooms (needed for joining)
create policy "Rooms are readable by everyone"
  on rooms for select
  using (true);

-- Anyone can insert rooms (creating a room)
create policy "Anyone can create rooms"
  on rooms for insert
  with check (true);

-- Anyone can update rooms (game state updates)
-- In production, you'd restrict this to the host_id or use Edge Functions
create policy "Anyone can update rooms"
  on rooms for update
  using (true);

-- Enable Realtime for the rooms table
alter publication supabase_realtime add table rooms;

-- ============================================================
-- Optional: Auto-cleanup expired rooms (run as pg_cron job)
-- Schedule: every 30 minutes
-- SELECT cron.schedule('cleanup-expired-rooms', '*/30 * * * *',
--   $$DELETE FROM rooms WHERE expires_at < now()$$
-- );
-- ============================================================
