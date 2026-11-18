# IT RUSH 2026 — Web Development Competition (SIGNIFY)

Repository ini merupakan repository pengembangan proyek website **SIGNIFY** (platform belajar interaktif **BISINDO** dan **Braille** di peramban dengan dukungan privasi lokal *on-device*) untuk mengikuti kompetisi **IT RUSH 2026**.

## 👥 Anggota Tim

1. **Diayu Nur Aini**
2. **Bobby Rahman Hartanto**
3. **Hammam Muhammad Yazid**
4. **Mahardika Ramadhana**

## 🎯 Tentang Proyek

**SIGNIFY** menghadirkan solusi digital yang inklusif, fungsional, dan berdampak bagi pembelajaran komunikasi dua arah melalui aplikasi web:

- **Belajar & Praktik BISINDO (Alfabet):** Pengenalan 26 alfabet BISINDO (A–Z, 10 huruf 1 tangan & 16 huruf 2 tangan) secara *real-time* di browser. Fitur kamera alfabet saat ini masih dalam tahap placeholder (`CameraSlot`) — integrasi CV sedang dikerjakan.
- **Belajar Kata Dinamis BISINDO (WL-BISINDO):** Latihan 8 kata isyarat (air, belajar, hari, maaf, makan, saya, terima kasih, tuli) menggunakan kamera langsung atau simulasi rangka tangan & bahu. Komponen `WordCameraSlot` sudah **fully functional** dengan MediaPipe Hand + Pose Landmarker dan inferensi model Conformer langsung di browser.
- **Simulator & Kuis Braille 6-Titik:** Input sentuh/klik dan tata letak keyboard Perkins (`F-D-S` / `J-K-L`), 4 mode (Belajar, Baca, Tulis Huruf, Tulis Kata), **sudah sepenuhnya berjalan**.
- **Pelacakan Progres:** XP & huruf/kata yang dipelajari tersimpan di `localStorage` tanpa server.

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| On-Device AI (Browser) | `@mediapipe/tasks-vision` (Hand + Pose Landmarker, `numHands: 2`), Custom TF.js runner (tanpa `@tensorflow/tfjs` runtime) |
| AI/CV Pipeline (Python) | TensorFlow / Keras, MediaPipe, OpenCV, Scikit-Learn, NumPy, Pytest |
| Penyimpanan | `localStorage` (progres pengguna), tidak ada data yang dikirim ke server |

## 🚀 Menjalankan Proyek

### Prasyarat
- **Node.js 18+** — cek dengan `node -v`

### Langkah-langkah

```bash
# 1. Masuk ke direktori proyek
cd it-rush

# 2. Install dependencies
npm install

# 3. Jalankan dev server
npm run dev
```

Buka browser di **http://localhost:3000**

### Perintah lain

```bash
npm run build   # Build produksi
npm run start   # Jalankan hasil build
npm run lint    # Lint TypeScript & TSX
```

### Pipeline Python (Opsional — untuk training/fine-tuning model)

```bash
# Aktifkan virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -e ".[dev]"

# Fine-tuning model alfabet
python scripts/finetune_model.py

# Fine-tuning model kata dinamis
python scripts/finetune_word_model.py --video-dir data/raw_word_videos

# Training ulang dari nol
python scripts/train_model.py

# Uji webcam (alfabet & kata dinamis)
python scripts/infer_webcam.py
python scripts/infer_word_webcam.py

# Unit test Python
pytest --cov=bisindo --cov-report=term-missing
```

## 🤖 AI & Computer Vision

### Model Alfabet BISINDO (27 kelas: `A–Z` + `NOTHING`)
- **Input:** tensor `[1, 86]` (`float32`) — 42 dim tangan kiri + 42 dim tangan kanan (landmark 2D Boháček-normalized) + dx + dy
- **Output:** `[1, 27]` softmax
- **Inferensi browser:** custom runner TypeScript di [`lib/cv/alphabetClassifier.ts`](lib/cv/alphabetClassifier.ts) tanpa overhead runtime TF.js (<0.2 ms/frame)
- **Status:** model tersedia di `public/models/bisindo/`, **integrasi ke UI belum selesai** (`CameraSlot` masih placeholder)

### Model Kata Dinamis BISINDO / WL-BISINDO (8 kelas)
Kata: `air`, `belajar`, `hari`, `maaf`, `makan`, `saya`, `terima_kasih`, `tuli`
- **Input:** `[1, 30, 300]` (`float32`) — 30 frame temporal (posisi + kecepatan + percepatan dari Hand + Pose landmarks)
- **Inferensi browser:** [`lib/cv/wordClassifier.ts`](lib/cv/wordClassifier.ts)
- **Status:** ✅ **Fully integrated** di [`components/WordCameraSlot.tsx`](components/WordCameraSlot.tsx)

### Lokasi File Penting

```
public/models/bisindo/
├── model.json              # TF.js Layers — model alfabet
├── group1-shard1of1.bin    # Weights alfabet
├── labels.json             # Label 27 kelas alfabet
├── wl_model.json           # TF.js — model kata dinamis (WL-BISINDO)
├── wl_weights.bin          # Weights kata dinamis
├── bisindo_wl_labels.json  # Label 8 kata
└── bisindo_alphabet_model_f32.tflite

lib/cv/
├── alphabetClassifier.ts   # Runner MLP alfabet 86-dim
├── wordClassifier.ts       # Runner Conformer kata dinamis
├── handLandmarkerClient.ts # MediaPipe Hand Landmarker wrapper
├── poseLandmarkerClient.ts # MediaPipe Pose Landmarker wrapper
└── normalizeLandmarks.ts   # Ekstraksi fitur Boháček 2D (86-dim)

src/bisindo/                # Paket Python inti (training pipeline)
scripts/                    # CLI: dataset, webcam, training, ekspor
configs/config.yaml         # Konfigurasi pipeline Python
tests/                      # Unit test Python (pytest)
```

## 📌 Status Pengembangan

| Fitur | Status |
|-------|--------|
| Inisialisasi repository & konsep | ✅ Selesai |
| Dokumen perencanaan (`SIGNIFY_SRS.md`, `SIGNIFY_TEAM_AND_AI_ALIGNMENT.md`) | ✅ Selesai |
| Setup frontend (Next.js, Braille UI, landing page) | ✅ Selesai |
| Fitur Braille lengkap (Belajar, Baca, Tulis Huruf, Tulis Kata, Kuis) | ✅ Selesai |
| Persiapan model AI/CV BISINDO & konversi TF.js | ✅ Selesai |
| Normalisasi landmark TypeScript (`normalizeLandmarks.ts`) | ✅ Selesai |
| **WordCameraSlot** — kamera & simulasi kata BISINDO | ✅ Selesai |
| **CameraSlot** — kamera alfabet BISINDO (integrasi CV ke UI) | ⏳ Dalam proses |
| End-to-end testing & debugging | ⏳ Dalam proses |
| Deployment website | ⏳ Belum dimulai |
| Dokumentasi final | ⏳ Belum dimulai |

## 🙏 Atribusi Sumber Terbuka

Base model BISINDO (alfabet 86-dim Boháček 2D dan WL-BISINDO 8 kata) serta pendekatan normalisasi landmark mengadaptasi dan membangun di atas karya sumber terbuka dari proyek **[KawanIsyarat](https://github.com/haipradana/KawanIsyarat)** oleh **haipradana**, yang kemudian dikonversi ke format TensorFlow.js Layers dan disesuaikan untuk integrasi web Next.js pada platform SIGNIFY.

## 📄 Kompetisi

**IT RUSH 2026 — Web Development Competition**

Repository ini terus diperbarui selama proses pengembangan proyek hingga tahap final submission.

---

*Built with collaboration, creativity, and innovation.*
