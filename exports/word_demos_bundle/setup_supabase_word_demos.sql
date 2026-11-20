-- Jalankan di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Membuat tabel URL publik + Public Bucket Storage untuk 8 animasi kosakata BISINDO

-- 1. Tabel public.bisindo_word_demos
create table if not exists public.bisindo_word_demos (
  word_id text primary key,
  title text not null,
  video_url text not null,
  mime_type text not null default 'video/mp4',
  storage_path text not null,
  updated_at timestamptz not null default now()
);

alter table public.bisindo_word_demos enable row level security;

drop policy if exists "Video demo kosakata BISINDO dapat dilihat publik" on public.bisindo_word_demos;
create policy "Video demo kosakata BISINDO dapat dilihat publik"
  on public.bisindo_word_demos
  for select
  to anon, authenticated
  using (true);

-- 2. Public Bucket bisindo-word-demos di Supabase Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bisindo-word-demos',
  'bisindo-word-demos',
  true,
  5242880,
  array['video/mp4', 'video/webm', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Aset animasi BISINDO publik dapat dibaca" on storage.objects;
create policy "Aset animasi BISINDO publik dapat dibaca"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'bisindo-word-demos');
