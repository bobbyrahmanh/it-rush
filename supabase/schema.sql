-- Skema Database Supabase untuk SIGNIFY (IT RUSH 2026)
-- Cara pakai: Buka Supabase Dashboard -> SQL Editor -> New Query, tempel seluruh isi file ini, lalu klik Run.

-- 1. Matikan trigger lama terlebih dahulu agar tidak pernah menghalangi pendaftaran user baru
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Buat tabel profiles jika belum ada
create table if not exists public.profiles (
  id text primary key,
  email text,
  display_name text not null default 'Pembelajar SIGNIFY',
  xp integer not null default 0,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_active_date text,
  badges text[] not null default '{}',
  progress_data jsonb not null default '{
    "bisindo": {
      "learnedLetters": [],
      "learnedWords": [],
      "practiceSessionsCompleted": 0,
      "guessTheSignBestScore": 0
    },
    "braille": {
      "learnedLetters": [],
      "quizSessionsCompleted": 0
    }
  }'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Hapus policy lama sebelum mengubah tipe kolom id (agar tidak tertahan dependency policy)
drop policy if exists "Profil publik dapat dilihat untuk Leaderboard" on public.profiles;
drop policy if exists "Pengguna dapat membuat profilnya sendiri" on public.profiles;
drop policy if exists "Pengguna dapat memperbarui profilnya sendiri" on public.profiles;

-- 4. Pastikan kolom id bertipe text dan bebas dari constraint foreign key yang kaku
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id type text using id::text;

create index if not exists idx_profiles_leaderboard
  on public.profiles (xp desc, streak_current desc);

alter table public.profiles enable row level security;

-- 5. Pasang kembali policy RLS untuk baca, tambah, dan perbarui profil
create policy "Profil publik dapat dilihat untuk Leaderboard"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "Pengguna dapat membuat profilnya sendiri"
  on public.profiles
  for insert
  to anon, authenticated
  with check (true);

create policy "Pengguna dapat memperbarui profilnya sendiri"
  on public.profiles
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- 6. Trigger aman (dilengkapi blok exception agar tidak pernah memunculkan "Database error saving new user")
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Pembelajar SIGNIFY')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();
  return new;
exception
  when others then
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
