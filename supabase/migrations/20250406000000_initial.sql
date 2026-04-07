-- 제이비스포츠 관리프로그램 — Supabase 초기 스키마
-- 대시보드 SQL 편집기 또는 supabase db push 로 적용하세요.

-- 프로필 (직원) — auth.users 와 1:1
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  phone text not null unique,
  name text not null,
  birth text default '',
  email text default '',
  position text default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 기존 localStorage 키를 JSON 그대로 옮긴 KV (직원만 읽기/쓰기)
create table if not exists public.app_kv (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.app_kv enable row level security;

create policy "app_kv_authenticated_all"
  on public.app_kv for all
  to authenticated
  using (true)
  with check (true);

-- 실시간 동기화: Supabase 대시보드 → Database → Replication 에서 app_kv 를 켜거나,
-- 아래 한 줄을 SQL에서 실행하세요(이미 등록돼 있으면 생략).
-- alter publication supabase_realtime add table public.app_kv;

-- 학부모 공개 셔틀 스냅샷 (익명 읽기 허용)
create table if not exists public.shuttle_public_snapshot (
  id int primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint shuttle_public_snapshot_single check (id = 1)
);

insert into public.shuttle_public_snapshot (id, payload)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.shuttle_public_snapshot enable row level security;

create policy "shuttle_public_snapshot_select_anon"
  on public.shuttle_public_snapshot for select
  to anon, authenticated
  using (true);

create policy "shuttle_public_snapshot_write_auth"
  on public.shuttle_public_snapshot for all
  to authenticated
  using (true)
  with check (true);
