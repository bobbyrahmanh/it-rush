param(
  [string]$EnvFile = "",
  [string]$Bucket = "bisindo-word-demos",
  [string]$Table = "bisindo_word_demos"
)

$ErrorActionPreference = "Stop"

# Pastikan TLS 1.2 aktif di Windows PowerShell 5.1 agar koneksi HTTPS ke Supabase lancar
try {
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor [System.Net.SecurityProtocolType]::Tls12
} catch {
  # Di PowerShell 7+ TLS 1.2/1.3 sudah otomatis aktif
}

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
  $scriptDir = (Get-Location).Path
}
$videoDir = Join-Path $scriptDir "videos"

# Cari file .env.local secara otomatis
$candidateEnvFiles = @()
if ($EnvFile) {
  $candidateEnvFiles += $EnvFile
} else {
  $candidateEnvFiles += (Join-Path $scriptDir ".env.local")
  $candidateEnvFiles += (Join-Path (Get-Location).Path ".env.local")
  $parent1 = Split-Path -Parent $scriptDir
  if ($parent1) {
    $candidateEnvFiles += (Join-Path $parent1 ".env.local")
    $parent2 = Split-Path -Parent $parent1
    if ($parent2) {
      $candidateEnvFiles += (Join-Path $parent2 ".env.local")
    }
  }
}

$resolvedEnvFile = $candidateEnvFiles | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
$envMap = @{}
if ($resolvedEnvFile) {
  Write-Host "Membaca kredensial dari: $resolvedEnvFile"
  Get-Content $resolvedEnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
      $parts = $line.Split("=", 2)
      $envMap[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
    }
  }
}

$supabaseUrl = ($envMap["SUPABASE_URL"], $envMap["NEXT_PUBLIC_SUPABASE_URL"], $env:SUPABASE_URL, $env:NEXT_PUBLIC_SUPABASE_URL | Where-Object { $_ } | Select-Object -First 1)
$serviceKey  = ($envMap["SUPABASE_SERVICE_ROLE_KEY"], $env:SUPABASE_SERVICE_ROLE_KEY | Where-Object { $_ } | Select-Object -First 1)

if (-not $supabaseUrl -or -not $serviceKey -or $supabaseUrl -like "*your-project-id*" -or $serviceKey -like "*your-service-role*") {
  throw "Kredensial Supabase belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local (lihat .env.local.example)."
}

$supabaseUrl = $supabaseUrl.TrimEnd("/")

$words = @(
  @{ word_id = "pantai";       title = "Pantai" },
  @{ word_id = "belajar";      title = "Belajar" },
  @{ word_id = "hari";         title = "Hari" },
  @{ word_id = "maaf";         title = "Maaf" },
  @{ word_id = "makan";        title = "Makan" },
  @{ word_id = "saya";         title = "Saya" },
  @{ word_id = "terima_kasih"; title = "Terima Kasih" },
  @{ word_id = "tuli";         title = "Tuli" }
)

$storageHeaders = @{
  "apikey"        = $serviceKey
  "Authorization" = "Bearer $serviceKey"
  "x-upsert"      = "true"
  "Cache-Control" = "public, max-age=31536000"
}

$rows = @()

Write-Host "Mengunggah 8 video animasi ke Supabase Storage bucket '$Bucket'..."
foreach ($w in $words) {
  $objectName = "$($w.word_id).mp4"
  $filePath = Join-Path $videoDir $objectName
  if (-not (Test-Path $filePath)) {
    throw "File video tidak ditemukan: $filePath"
  }

  $uploadUrl = "$supabaseUrl/storage/v1/object/$Bucket/$objectName"
  Invoke-RestMethod -Method Post -Uri $uploadUrl -Headers $storageHeaders -ContentType "video/mp4" -InFile $filePath | Out-Null

  $publicUrl = "$supabaseUrl/storage/v1/object/public/$Bucket/$objectName"
  Write-Host "  [OK] $objectName -> $publicUrl"

  $rows += @{
    word_id      = $w.word_id
    title        = $w.title
    video_url    = $publicUrl
    mime_type    = "video/mp4"
    storage_path = "$Bucket/$objectName"
  }
}

Write-Host "Menyimpan URL publik ke tabel public.$Table..."
$dbHeaders = @{
  "apikey"        = $serviceKey
  "Authorization" = "Bearer $serviceKey"
  "Prefer"        = "resolution=merge-duplicates,return=minimal"
}
$body = ConvertTo-Json -InputObject @($rows) -Depth 4
Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/${Table}?on_conflict=word_id" -Headers $dbHeaders -ContentType "application/json" -Body $body | Out-Null

Write-Host ""
Write-Host "SELESAI! $($rows.Count) video berhasil diunggah ke bucket '$Bucket' dan URL publiknya tersimpan di public.$Table."
