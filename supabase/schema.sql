-- LG 승부예측 schema
-- Supabase Dashboard → SQL Editor → New query → 이 파일 전체 붙여넣고 Run

create extension if not exists pgcrypto;

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text not null,
  opponent text not null,
  status text not null check (status in ('scheduled', 'rain', 'final')),
  result text check (result is null or result in ('W', 'D', 'L')),
  created_at timestamptz not null default now(),
  constraint games_result_matches_status check (
    (status = 'final' and result is not null)
    or (status in ('scheduled', 'rain') and result is null)
  )
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  game_id uuid not null references games (id) on delete cascade,
  pick text not null check (pick in ('W', 'D', 'L')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, game_id)
);

create index if not exists games_date_idx on games (date desc, time desc);
create index if not exists predictions_member_id_idx on predictions (member_id);
create index if not exists predictions_game_id_idx on predictions (game_id);
