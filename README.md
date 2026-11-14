# IT RUSH 2026 — Web Development Competition (SIGNIFY)

Repository ini merupakan repository pengembangan proyek website **SIGNIFY** (platform belajar interaktif **BISINDO** dan **Braille** di peramban dengan dukungan privasi lokal *on-device*) untuk mengikuti kompetisi **IT RUSH 2026**.

## 👥 Team Members

Tim pengembang terdiri dari:

1. **Diayu Nur Aini**
2. **Bobby Rahman Hartanto**
3. **Hammam Muhammad Yazid**
4. **Mahardika Ramadhana**

## 🎯 About the Project

**SIGNIFY** dikembangkan sebagai bagian dari kompetisi IT RUSH 2026 dengan tujuan menghadirkan solusi digital yang inklusif, fungsional, dan berdampak bagi pembelajaran komunikasi dua arah melalui aplikasi web:

- **Belajar & Praktik BISINDO:** Pengenalan 26 alfabet BISINDO (A-Z, mendukung 10 huruf 1 tangan dan 16 huruf 2 tangan) secara *real-time* di browser maupun Mode Simulasi Video.
- **Simulator & Kuis Braille 6-Titik:** Input sentuh/klik dan tata letak keyboard Perkins (`F-D-S` / `J-K-L`).
- **Dokumen Rujukan Tim:** [SIGNIFY_SRS.md](SIGNIFY_SRS.md) dan [SIGNIFY_TEAM_AND_AI_ALIGNMENT.md](SIGNIFY_TEAM_AND_AI_ALIGNMENT.md).

## 🛠️ Tech Stack

- **Frontend Web:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **On-Device Web AI:** `@mediapipe/tasks-vision` (Hand Landmarker `numHands: 2`) + `@tensorflow/tfjs`
- **AI / Computer Vision Pipeline (Python):** TensorFlow / Keras, MediaPipe, OpenCV, Scikit-Learn, NumPy, Pytest

## 🤖 Artificial Intelligence & Computer Vision (BISINDO)

### Ringkasan Model
1. **Model Alfabet BISINDO (27 kelas: `A-Z` + `NOTHING`)**
   - Input tensor shape `[1, 86]` (`float32`):
     - `[0..41]`: Tangan kiri di layar (`mean_x` terkecil), 21 landmark 2D `(x, y)` dinormalisasi **Boháček bounding-box** `[0, 1]`.
     - `[42..83]`: Tangan kanan di layar (atau `0.0` jika hanya 1 tangan terdeteksi).
     - `[84]`: `dx = mean_x(kanan) - mean_x(kiri)` (`>= 0` untuk 2 tangan, `0.0` untuk 1 tangan).
     - `[85]`: `dy = mean_y(kanan) - mean_y(kiri)` (`0.0` untuk 1 tangan).
   - Output tensor shape `[1, 27]` (probabilitas softmax sesuai `labels.json`).
2. **Model Kata Dinamis BISINDO / WL-BISINDO (8 kelas: `air`, `belajar`, `hari`, `maaf`, `makan`, `saya`, `terima_kasih`, `tuli`)**
   - Input tensor shape `[1, 30, 300]` (`float32`), 30 frame temporal (posisi terpusat hidung + kecepatan + percepatan) dari Hand + Pose landmarks.

### Lokasi Berkas Penting
- `public/models/bisindo/`:
  - `model.json`, `group1-shard1of1.bin`, `labels.json` — Model TensorFlow.js Layers untuk inferensi langsung di browser Next.js.
  - `bisindo_alphabet_model_f32.tflite` — Model Float32 TFLite alfabet BISINDO.
  - `bisindo_wl_model.tflite` & `bisindo_wl_labels.json` — Model TFLite WL-BISINDO 8 kata dinamis.
- `lib/cv/normalizeLandmarks.ts` — Implementasi TypeScript ekstraksi fitur 86-dim Boháček 2D (`extractBisindo86Features`) dan validator tahan pose (`HoldPoseValidator`).
- `src/bisindo/` — Paket Python inti (`features.py`, `landmarks.py`, `dataset.py`, `model.py`, `train.py`, `word_level.py`).
- `scripts/` — Skrip CLI ekstraksi dataset, perekaman webcam, training & ekspor TF.js/TFLite, konversi model, serta uji webcam (`prepare_dataset.py`, `collect_webcam.py`, `train_model.py`, `convert_kawanisyarat_to_tfjs.py`, `infer_webcam.py`, `infer_word_webcam.py`).
- `configs/config.yaml` — Konfigurasi pipeline dataset, normalisasi, dan training.
- `tests/` — Unit test Python (`pytest`) untuk seluruh modul CV.
- `artifacts/` & `exports/ts/` — Artefak hasil konversi/ekspor dari pipeline Python.

### Alur Kerja Pipeline Python (Zsh)

Aktifkan virtual environment Python:
```zsh
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Ekstrak dataset, rekam tambahan, latih, atau uji model:
```zsh
# 1. Ekstrak landmark dari dataset gambar (mendukung fallback YOLO .txt & anti-leakage)
python scripts/prepare_dataset.py

# 2. Rekam dataset tambahan via webcam
python scripts/collect_webcam.py

# 3. Training & ekspor ke TFLite + TensorFlow.js
python scripts/train_model.py

# 4. Konversi cepat model TFLite KawanIsyarat ke TensorFlow.js
python scripts/convert_kawanisyarat_to_tfjs.py

# 5. Uji webcam real-time (alfabet & kata dinamis)
python scripts/infer_webcam.py
python scripts/infer_word_webcam.py

# 6. Jalankan unit test Python
pytest --cov=bisindo --cov-report=term-missing
```

## 🙏 Atribusi Sumber Terbuka

Base model BISINDO (alfabet 86-dim Boháček 2D dan WL-BISINDO 8 kata) serta pendekatan normalisasi landmark mengadaptasi dan membangun di atas karya sumber terbuka dari proyek **[KawanIsyarat](https://github.com/haipradana/KawanIsyarat)** oleh **haipradana**, yang kemudian dikonversi ke format TensorFlow.js Layers (`public/models/bisindo/`) dan disesuaikan untuk integrasi web Next.js pada platform **SIGNIFY**.

## 📌 Development Status

<details>
<summary>Project Progress</summary>

- [x] Repository initialization
- [x] Project concept and planning (`SIGNIFY_SRS.md`, `SIGNIFY_TEAM_AND_AI_ALIGNMENT.md`)
- [x] Frontend base setup (Next.js App Router, BISINDO & Braille UI)
- [x] AI/CV BISINDO model preparation, TF.js conversion, and TypeScript normalizer
- [ ] Full AI integration into frontend `CameraSlot` & Simulation Mode
- [ ] End-to-end testing and debugging
- [ ] Website deployment
- [ ] Final documentation

</details>

## 📄 Competition

**IT RUSH 2026 — Web Development Competition**

Repository ini akan terus diperbarui selama proses pengembangan proyek hingga tahap final submission.

---

*Built with collaboration, creativity, and innovation.*
