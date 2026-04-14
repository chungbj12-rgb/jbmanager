-- app_kv + shuttle_public_snapshot for jbmanager remote sync (idempotent)

create table if not exists public.app_kv (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.app_kv enable row level security;

do $$
begin
  create policy "app_kv_authenticated_all"
    on public.app_kv for all
    to authenticated
    using (true)
    with check (true);
exception
  when duplicate_object then null;
end $$;

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

do $$
begin
  create policy "shuttle_public_snapshot_select_anon"
    on public.shuttle_public_snapshot for select
    to anon, authenticated
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "shuttle_public_snapshot_write_auth"
    on public.shuttle_public_snapshot for all
    to authenticated
    using (true)
    with check (true);
exception
  when duplicate_object then null;
end $$;
