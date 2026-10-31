-- Run this in Supabase SQL Editor.
-- Enable Row Level Security and restrict every record to its authenticated owner.
create table if not exists public.trades (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz default now()
);
create table if not exists public.emotions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz default now()
);
create table if not exists public.life_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz default now()
);
create table if not exists public.media (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);
alter table public.trades enable row level security;
alter table public.emotions enable row level security;
alter table public.life_entries enable row level security;
alter table public.media enable row level security;
create policy "owner trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner emotions" on public.emotions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner life" on public.life_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner media rows" on public.media for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a PRIVATE Storage bucket named trade-media in the Supabase dashboard.
-- Storage object policies:
create policy "user can upload own trade media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "user can read own trade media" on storage.objects
for select to authenticated using (
  bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "user can update own trade media" on storage.objects
for update to authenticated using (
  bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "user can delete own trade media" on storage.objects
for delete to authenticated using (
  bucket_id = 'trade-media' and (storage.foldername(name))[1] = auth.uid()::text
);
