PANDUAN UPLOAD ANIMASI KOSAKATA BISINDO KE SUPABASE (WINDOWS POWERSHELL)
========================================================================

Isi folder ini:
- setup_supabase_word_demos.sql  : SQL untuk membuat tabel + public bucket Supabase Storage
- upload_word_demos.ps1          : Script PowerShell (tidak perlu Python atau FFmpeg)
- .env.local.example             : Contoh file kredensial Supabase
- videos/                        : 8 video MP4 ringan siap upload (total ~443 KB)

LANGKAH 1 — Jalankan SQL di Supabase
1. Buka Supabase Dashboard -> SQL Editor -> New Query.
2. Copy-paste seluruh isi file `setup_supabase_word_demos.sql`, lalu klik Run.

LANGKAH 2 — Siapkan Kredensial (.env.local)
1. Salin `.env.local.example` menjadi `.env.local` di dalam folder ini
   (atau gunakan `.env.local` yang sudah ada di root project SIGNIFY).
2. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`
   dari Supabase Dashboard -> Project Settings -> API.
   (Catatan: `SUPABASE_SERVICE_ROLE_KEY` hanya untuk upload lewat PowerShell, jangan di-commit ke Git.)

LANGKAH 3 — Jalankan Script PowerShell
Buka PowerShell di folder ini, lalu jalankan:

  powershell -ExecutionPolicy Bypass -File .\upload_word_demos.ps1

Atau jika ingin menunjuk file .env.local di lokasi tertentu:

  powershell -ExecutionPolicy Bypass -File .\upload_word_demos.ps1 -EnvFile "C:\path\ke\.env.local"

Setelah selesai, refresh halaman `/bisindo` pada aplikasi web (pastikan sudah `git pull origin main`)
dan klik salah satu kosakata (misalnya Pantai) untuk melihat video animasi berulangnya.
