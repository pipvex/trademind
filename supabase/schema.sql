-- TradeMind database. Run this whole file ONCE in Supabase -> SQL Editor -> New query -> Run.
-- It is safe to run again later (it will not delete data).

-- 1) One table holds every kind of journal entry (trades, daily checks, reviews, weekly checks,
--    screenshot records and each user's settings/trading plan). Each row belongs to ONE user.
create table if not exists public.records (
  id                uuid primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  kind              text not null,
  data              jsonb not null default '{}'::jsonb,
  deleted           boolean not null default false,
  client_updated_at timestamptz not null default now(),
  updated_at        timestamptz not null default clock_timestamp()
);
create index if not exists records_user_updated_idx on public.records (user_id, updated_at);
create index if not exists records_user_kind_idx    on public.records (user_id, kind);

-- 2) Row Level Security: a signed-in user can only see and change their OWN rows.
alter table public.records enable row level security;
drop policy if exists "owner records" on public.records;
create policy "owner records" on public.records
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Server-side guard: an older edit can never overwrite a newer one, and updated_at is
--    always set by the server (devices use it to know what changed).
create or replace function public.records_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.client_updated_at < old.client_updated_at then
    return null;               -- ignore stale edit
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists records_guard_trg on public.records;
create trigger records_guard_trg before insert or update on public.records
  for each row execute function public.records_guard();

-- 4) Private bucket for trade screenshots AND screen recordings / voice notes (cloud option).
--    Per-file size limit is set in Supabase -> Storage -> Settings (free plan: 50 MB). Each user can only touch files inside their own folder.
insert into storage.buckets (id, name, public)
values ('trade-media', 'trade-media', false)
on conflict (id) do nothing;

drop policy if exists "tm media insert" on storage.objects;
drop policy if exists "tm media select" on storage.objects;
drop policy if exists "tm media update" on storage.objects;
drop policy if exists "tm media delete" on storage.objects;
create policy "tm media insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tm media select" on storage.objects for select to authenticated
  using (bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tm media update" on storage.objects for update to authenticated
  using (bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tm media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text);
