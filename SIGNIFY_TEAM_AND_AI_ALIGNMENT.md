# SIGNIFY: Dokumen Penyelarasan Tim & Konteks Lengkap AI Agent

> **Tujuan Dokumen Ini:**  
> Dokumen ini dirancang sebagai **pegangan utama (onboarding & alignment bible)** untuk seluruh anggota tim pengembang SIGNIFY **serta untuk diberikan sebagai konteks awal kepada AI Coding Agent** masing-masing anggota tim.  
> Berbeda dengan dokumen [SIGNIFY_SRS.md](file:///C:/Kuliah/Competition/ITRUSH/SIGNIFY_SRS.md) yang berisi daftar spesifikasi formal, dokumen ini menjelaskan **latar belakang pemikiran, alasan di balik setiap keputusan, gambaran isi tiap halaman beserta draf teks edukasinya, temuan krusial dari dataset, hingga larangan teknis** agar tidak terjadi salah paham selama pengerjaan.

---

## DAFTAR ISI
1. [Konteks Lomba & Filosofi Produk](#1-konteks-lomba--filosofi-produk)
2. [Keputusan Kunci yang Sudah Dikunci (Beserta Alasannya)](#2-keputusan-kunci-yang-sudah-dikunci-beserta-alasannya)
3. [Temuan Krusial Dataset & Arsitektur AI BISINDO](#3-temuan-krusial-dataset--arsitektur-ai-bisindo)
4. [Gambaran Lengkap Halaman, Fitur & Contoh Teks (Copywriting)](#4-gambaran-lengkap-halaman-fitur--contoh-teks-copywriting)
5. [Kontrak Teknis Antar-Modul & Saran Pembagian Tim](#5-kontrak-teknis-antar-modul--saran-pembagian-tim)
6. [Instruksi & Guardrails Wajib untuk AI Coding Agent Tim](#6-instruksi--guardrails-wajib-untuk-ai-coding-agent-tim)

---

## 1. Konteks Lomba & Filosofi Produk

### 1.1 Fakta Kompetisi (IT RUSH 2026 - Web Development)
* **Subtema yang Dipilih:** Subtema 5 (*Pendidikan, Tata Kelola, dan Teknologi Inklusif*).
* **Syarat Wajib Teknis:** Website wajib mengintegrasikan teknologi *Artificial Intelligence* (AI) di dalam fiturnya, sudah di-deploy ke publik (misal Vercel), dan aktif setidaknya hingga lewat **30 November 2026**.
* **Batas Akhir Pengumpulan:** **20 November 2026 pukul 23.59 WIB** (termasuk Link Live Web, Repo GitHub Publik, Video Demo 3-5 menit YouTube Unlisted, Proposal PDF, dan Surat Pernyataan Orisinalitas & AI).
* **Mekanisme Penjurian (Sangat Penting!):**
  * Penilaian dilakukan **100% daring dan asinkron tanpa sesi presentasi**.
  * Artinya, **bukan kita** yang mendemokan kamera di depan juri, melainkan **juri sendiri yang membuka website kita di perangkat mereka masing-masing**! Seluruh keputusan UX kita harus mengantisipasi kondisi juri (misal: PC juri tidak punya webcam, ruangan juri redup, atau juri sama sekali belum hafal bentuk jari BISINDO).
* **Bobot Penilaian Juri:**
  1. Fungsionalitas & Kualitas Teknis Website: **25%**
  2. Inovasi & Ketepatan Solusi: **20%**
  3. Relevansi Tema & Dampak: **15%**
  4. Desain Antarmuka (UI) & Pengalaman Pengguna (UX): **15%**
  5. Kualitas Source Code & Riwayat Commit Git: **15%** *(Riwayat commit tidak boleh dihapus/dimanipulasi!)*
  6. Dokumentasi Karya (Proposal, Video Demo, README): **10%** *(Seluruh library, dataset open-source, dan penggunaan AI coding assistant wajib dicantumkan jujur di Proposal dan README).*

### 1.2 Filosofi Produk SIGNIFY
* **Nama Sementara:** **SIGNIFY**
* **Sudut Pandang Utama (Komunikasi Dua Arah):** SIGNIFY **bukan** dibuat khusus untuk penyandang disabilitas semata (apalagi layar laptop/HP tidak memiliki tonjolan fisik untuk diraba tunanetra). Sebaliknya, SIGNIFY hadir untuk **masyarakat umum, teman, anggota keluarga, relawan, guru, dan mahasiswa** yang ingin belajar berkomunikasi dengan teman Tuli (melalui BISINDO) serta memahami logika pola baca-tulis teman Tunanetra (melalui simulasi Braille). Inklusivitas sejati terjadi ketika kedua belah pihak saling memahami bahasa satu sama lain.

---

## 2. Keputusan Kunci yang Sudah Dikunci (Beserta Alasannya)

Jangan mengubah keputusan di bawah ini tanpa diskusi tim, karena semuanya saling berkaitan dengan aturan lomba dan kondisi teknis:

### Keputusan 1: Tanpa Login di MVP, Tapi Siap Upgrade (Arsitektur Satu Pintu)
* **Apa yang diputuskan:** Pada tahap MVP ini, **tidak ada halaman Login/Register**. Semua fitur termasuk progres belajar, XP, dan *Daily Streak* disimpan di browser lokal (`localStorage`).
* **Mengapa:**
  1. Waktu pengerjaan sangat singkat (deadline 20 November). Fokus utama adalah fungsionalitas inti (25%) dan inovasi AI (20%).
  2. Guidebook Pasal V.6 menyebutkan *"Apabila website memiliki fitur login, peserta wajib menyertakan akun demo"*. Kata *"Apabila"* memastikan bahwa tanpa login 100% sah, bahkan menguntungkan karena juri bisa langsung mencoba semua fitur dalam 1 klik tanpa repot memasukkan akun.
* **Syarat Kode Wajib:** Komponen UI **dilarang keras** memanggil `localStorage.getItem/setItem` secara langsung! Semua baca-tulis progres wajib melewati satu modul/abstraksi bernama `ProgressRepository` (dan hook `useProgress()`). Dengan cara ini, **setelah core development selesai**, jika waktu masih cukup dan tim ingin menambahkan fitur Login (misal: aplikasi bisa dicoba gratis tapi *streak/XP* disimpan ke akun Supabase), kita tinggal mengganti isi `ProgressRepository` tanpa merombak komponen UI!

### Keputusan 2: Wajib Ada "Mode Simulasi Kamera" (*Judge Testing Mode*)
* **Apa yang diputuskan:** Di setiap halaman yang memakai kamera AI, di sebelah tombol *"Nyalakan Kamera"*, wajib ada tombol **"Gunakan Video Simulasi (Tanpa Webcam)"**.
* **Mengapa:** Jika juri membuka web dari PC meja tanpa webcam atau di ruangan gelap, fitur utama AI kita tidak akan bisa dinilai jika hanya mengandalkan webcam.
* **Cara Kerjanya:**
  * Saat tombol simulasi dipilih, sistem memutar video rekaman tangan asli kita (misal video tangan membentuk huruf A, B, C, dst.).
  * **PENTING:** Video simulasi tersebut **tetap dikirim masuk ke MediaPipe dan model TensorFlow.js secara *live* di browser**! Titik-titik kerangka jari (*hand landmarks*) tetap digambar secara *real-time* di atas video simulasi, lalu model menebak hurufnya. Jadi ini bukan animasi palsu, melainkan pembuktian nyata bahwa mesin AI kita bekerja memproses aliran video.
  * Video simulasi **wajib direkam menggunakan tangan asli manusia** (bukan hasil AI video generator, karena AI generator sering salah menggambar anatomi jumlah/lekukan jari sehingga gagal dideteksi MediaPipe dan berisiko mengajarkan isyarat BISINDO yang salah).

### Keputusan 3: Semua Materi Terbuka Sejak Awal + Urutan yang Disarankan
* **Apa yang diputuskan:** Seluruh 26 huruf A-Z (baik di BISINDO maupun Braille) **langsung terbuka dan bisa diklik kapan saja**, tidak dikunci seperti game yang mengharuskan tamat Level 1 dulu baru Level 2 terbuka.
* **Mengapa:** Karena tidak ada akun demo yang sudah tamat, juri akan masuk dari nol. Kalau materi dikunci, juri tidak bisa bebas menguji huruf-huruf unik di unit akhir. Untuk tetap menjaga alur belajar yang terarah bagi pengguna baru, huruf-huruf tersebut tetap dikelompokkan dalam **Unit 1 s.d. Unit 4** lengkap dengan tanda centang huruf yang sudah dipelajari.

### Keputusan 4: Input Keyboard Braille Memakai Sistem "Toggle + Konfirmasi"
* **Apa yang diputuskan:** Selain bisa diklik di layar, sel 6-titik Braille bisa diketik memakai tombol keyboard **`F, D, S`** (Titik 1, 2, 3 di kolom kiri) dan **`J, K, L`** (Titik 4, 5, 6 di kolom kanan) dengan sistem **Toggle** (tekan sekali nyala, tekan lagi mati) dan tombol **`Space` / `Enter`** untuk mengirim/mengonfirmasi jawaban pada kuis (`Backspace` untuk reset semua titik).
* **Mengapa:**
  1. Mesin tik fisik *Perkins Brailler* asli mengharuskan penekanan beberapa tombol secara bersamaan (*chord*). Namun, banyak keyboard laptop standar mengalami *key ghosting* (gagal membaca 4-5 tombol berdekatan yang ditekan serentak), dan pemula sering kaku menekan banyak tombol sekaligus.
  2. Kalau memakai jeda waktu otomatis (*timer*), pemula akan panik karena huruf keburu terkirim saat masih berpikir mencari tombol.
  3. Dengan **Toggle + Konfirmasi**, pengguna pemula bisa menekan tombol satu per satu dengan tenang, pengguna mahir tetap bisa menekan bersamaan lalu tekan `Space`, dan 100% bebas masalah hardware keyboard murah!

### Keputusan 5: Hold Time Kamera Berbasis Waktu Detik (`ms`), Bukan Hitungan Frame
* **Apa yang diputuskan:**
  * **Mode Belajar BISINDO:** Tahan pose benar selama **1,5 detik** (`confidence >= 75%`, minimal terbaca di 5 frame) agar otot jari pengguna mengingat bentuk pose (*muscle memory*), ditemani animasi lingkaran progres (*progress ring*).
  * **Mode Latihan BISINDO:** Tahan pose benar selama **1,0 detik** agar terasa responsif seperti game, dilengkapi tombol *"Lihat Petunjuk" (Toggle Hint)* jika pengguna/juri lupa bentuk jarinya.
  * **Mode Eksplorasi BISINDO:** **Instan (0 detik)** tanpa tahan waktu, cukup dirata-rata (*smoothing*) dari 4 frame terakhir agar teks tidak berkedip, dan menampilkan **Top-3 prediksi huruf beserta persentasenya**.
* **Mengapa pakai milidetik (`performance.now()`), bukan jumlah frame?** Kalau kita mematok "harus benar 45 frame", di kamera bagus (30 FPS) itu 1,5 detik, tetapi di webcam laptop lambat/gelap (10 FPS) itu molor menjadi **4,5 detik**! Dengan patokan milidetik + minimal 5 frame, durasi tunggu terasa sama nyamannya di semua laptop.

### Keputusan 6: Cakupan MVP Hanya Level Alfabet Statis (Kata Masuk Roadmap Masa Depan)
* **Mengapa belum level kata?** Mayoritas kata dalam BISINDO bersifat **dinamis** (melibatkan gerakan perpindahan tangan dari satu titik ke titik lain dan ekspresi wajah), yang membutuhkan dataset video dan arsitektur model sekuensial (*LSTM / Pose Transformer*) serta pendeteksian kapan sebuah kata dimulai dan selesai. Untuk MVP lomba 13 hari, mengunci cakupan pada **26 huruf alfabet (A-Z)** memastikan akurasi tinggi, inferensi super ringan di browser, dan produk yang benar-benar tuntas (*polished*).

---

## 3. Temuan Krusial Dataset & Arsitektur AI BISINDO

> [!WARNING]
> **PERHATIAN UNTUK ANGGOTA TIM PENGEMBANG AI & FRONTEND CV:**  
> Banyak artikel/tutorial bahasa isyarat di internet membahas ASL (Amerika) atau SIBI yang hanya memakai **1 tangan**. Setelah kita memeriksa langsung seluruh foto A sampai Z pada kedua dataset BISINDO di folder `training/datasets/`, **BISINDO asli menggunakan 1 tangan DAN 2 tangan!**

### 3.1 Peta Jumlah Tangan Alfabet BISINDO (Wajib Diketahui!)
* **10 Huruf Memakai 1 Tangan:** `C, E, I, J, L, O, R, U, V, Z`
* **16 Huruf Memakai 2 Tangan:** `A, B, D, F, G, H, K, M, N, P, Q, S, T, W, X, Y`
* **Fakta Penting Huruf `J` dan `Z`:** Di kedua dataset BISINDO kita, baik `J` (kelingking mengarah ke samping/bawah dengan punggung tangan menghadap kamera, berbeda orientasi dari `I` yang tegak ke atas) maupun `Z` (tekukan siku-pergelangan-telapak membentuk siluet huruf Z) **direpresentasikan sebagai pose statis yang konsisten** (~450 foto per huruf). Karena itu, **seluruh 26 huruf A-Z masuk ke dalam deteksi kamera AI!**

### 3.2 Konsekuensi Wajib pada Kode MediaPipe & Model
1. Setelan MediaPipe `HandLandmarker` **wajib `numHands: 2`** (di Python `max_num_hands=2`). Jangan pernah diset `1`!
2. Input ke model klasifikasi neural network kita adalah **86 angka** (`2 tangan x 21 titik x 2 koordinat x,y + 2 offset dx,dy`), **bukan 126 angka dan tanpa koordinat z** (karena estimasi kedalaman `z` pada webcam 2D sangat *noisy* saat pencahayaan/jarak berubah):
   * Jika hanya **1 tangan** terdeteksi di kamera: masukkan 42 angka tangan tersebut (dinormalisasi **Boháček bounding-box** ke `[0, 1]`) di urutan pertama (`indeks 0..41`), lalu isi `indeks 42..85` dengan angka `0.0`.
   * Jika **2 tangan** terdeteksi di kamera: urutkan dulu kedua tangan berdasarkan posisi horizontal rata-rata (`mean_x` terkecil di `0..41`, terbesar di `42..83`), normalisasi masing-masing secara independen dengan Boháček `[0, 1]` agar lekukan jari tidak terkompresi ketika jarak antar-tangan berubah, lalu simpan offset relatif pusat tangan pada `indeks 84..85` (`dx = cx_kanan - cx_kiri >= 0`, `dy = cy_kanan - cy_kiri`)!

### 3.3 Pembagian Peran 2 Dataset Kaggle (Awas *Data Leakage*!)
Di folder `C:\Kuliah\Competition\ITRUSH\training\datasets\` terdapat dua dataset yang sudah dianalisis:
1. **`Indonesian Sign Language BISINDO - Agung Ma'ruf` (11.470 foto + 11.470 file `.txt` YOLO bounding box):**
   * **Peran:** **Satu-satunya Dataset Pelatihan Model AI.** Setiap huruf A-Z punya ~440 foto seimbang dari berbagai relawan dengan framing setengah badan/depan dada persis webcam laptop, sudah mencakup variasi tangan kiri/kanan (`flip`) dan kemiringan (`rotate`). Kotak anotasi YOLO di folder `labels/` dapat dipakai skrip ekstraksi untuk memotong fokus area tangan jika MediaPipe gagal mendeteksi tangan pada gambar utuh.
   * **Catatan Anti-Leakage:** Saat membagi *train* dan *test/val*, pastikan foto asli dan hasil *flip/rotate*-nya tidak terpisah menyeberang antara *train* dan *test* agar skor akurasi kita benar-benar murni.
2. **`Alfabet BISINDO - Achmad Noer` (312 foto, hanya 12 foto per huruf):**
   * **Temuan Penting:** Sebanyak **288 dari 312 foto di dataset ini ternyata sudah dimasukkan ke dalam dataset `Agung Ma'ruf`!**
   * **Peran:** **JANGAN digabungkan lagi ke training** (agar tidak duplikat) dan **JANGAN dijadikan data uji eksternal** (karena bocor dengan data latih). Gunakan foto-foto `Achmad Noer` ini khusus sebagai **aset gambar panduan/referensi bersih (rasio 1:1)** di tampilan UI Mode Belajar dan soal *Guess the Sign*!

---

## 4. Gambaran Lengkap Halaman, Fitur & Contoh Teks (Copywriting)

Bagian ini mendefinisikan struktur tiap halaman serta **contoh draf kalimat/teks (copy)** yang ingin kita tampilkan kepada pengguna agar bernilai edukasi dan empati tinggi. *(Catatan gaya bahasa: lugas, hangat, edukatif, tanpa kata klise promosi AI berlebihan, dan tanpa tanda baca em-dash).*

---

### Halaman 1: Landing Page (`/`)
**Tujuan:** Memberi kesan pertama yang kuat, menjelaskan misi komunikasi dua arah, dan mengajak pengguna/juri langsung mencoba fitur tanpa daftar akun.

* **Section 1 - Navbar:**
  * Logo teks `SIGNIFY`, menu navigasi (`Beranda`, `Belajar BISINDO`, `Belajar Braille`, `Guess the Sign`, `Progres Saya`), serta tombol ikon *Suara Aktif/Bisu (Mute Toggle)*.
* **Section 2 - Hero Section:**
  * Fokus pada ajakan belajar bahasa inklusif langsung dari browser.
  * *Contoh Draf Teks Hero:*
    > **Judul:** Komunikasi Inklusif Dimulai dari Dua Arah.  
    > **Subjudul:** Pelajari alfabet Bahasa Isyarat Indonesia (BISINDO) menggunakan deteksi tangan *real-time* di kamera perangkatmu, dan pahami logika pola tulis Braille secara interaktif. Tanpa instalasi, tanpa perlu mendaftar akun.  
    > **Tombol Utama:** `Mulai Praktik BISINDO` | **Tombol Kedua:** `Coba Simulator Braille`
* **Section 3 - Mengapa BISINDO & Braille untuk Semua Orang?**
  * Menjelaskan bahwa jembatan komunikasi tidak seharusnya hanya dibebankan kepada penyandang disabilitas.
  * *Contoh Draf Teks Konteks:*
    > **Judul:** Mengapa Kita Juga Perlu Belajar?  
    > **Isi:** Selama ini, beban beradaptasi dalam komunikasi sehari-hari lebih sering berada di pundak teman-teman Tuli dan Tunanetra. Ketika masyarakat umum turut mengenal dasar isyarat BISINDO dan memahami cara kerja sistem sel Braille, ruang publik, kampus, dan lingkungan pertemanan menjadi jauh lebih ramah dan setara.
* **Section 4 - Ringkasan Fitur Utama (Bukan Grid Kartu Seragam):**
  * Menampilkan blok interaktif/visual terpisah untuk:
    1. **Praktik BISINDO Berbasis Computer Vision:** Mendukung deteksi isyarat 1 tangan maupun 2 tangan untuk 26 huruf A-Z, lengkap dengan *Mode Simulasi Video* jika perangkat sedang tidak memiliki kamera.
    2. **Simulator Sel Braille 6-Titik & Ketikan Perkins:** Belajar membaca dan menyusun pola titik Braille menggunakan layar sentuh, klik mouse, atau papan ketik `F-D-S` dan `J-K-L`.
    3. **Kuis Interaktif & Guess the Sign:** Uji daya ingat membaca isyarat tangan dan merangkai titik Braille sambil mengumpulkan poin latihan harian.
* **Section 5 - Jaminan Privasi Kamera (Penting untuk Kepercayaan Pengguna):**
  * *Contoh Draf Teks Privasi:*
    > **Kamera Anda Sepenuhnya Milik Anda:** Seluruh deteksi titik jari dijalankan langsung di dalam peramban perangkat Anda menggunakan WebAssembly dan TensorFlow.js. Tidak ada satu pun foto atau rekaman video wajah maupun tangan Anda yang dikirim atau disimpan ke server mana pun.
* **Section 6 - Footer:**
  * Navigasi cepat ke semua modul dan keterangan atribusi singkat sumber terbuka (IT RUSH 2026).

---

### Halaman 2: Modul BISINDO (`/bisindo`)
Memiliki pemilih sub-mode yang jelas: **Kurikulum & Belajar**, **Mode Latihan**, dan **Mode Eksplorasi**.

* **Section Konteks Edukasi BISINDO ("Tahukah Kamu?"):**
  * Ditempatkan sebagai panel informasi ringkas yang bisa dibaca pengguna sebelum mulai praktik.
  * *Contoh Draf Teks "Tahukah Kamu?" (BISINDO):*
    > **Tahukah Kamu? Mengapa Banyak Huruf BISINDO Memakai Dua Tangan?**  
    > Di Indonesia terdapat dua sistem isyarat yang dikenal publik: SIBI dan BISINDO. Berbeda dengan SIBI yang mengadaptasi isyarat satu tangan dari Amerika, **BISINDO (Bahasa Isyarat Indonesia)** tumbuh secara alami dari komunitas Tuli di Indonesia.  
    > Dalam alfabet BISINDO, **16 huruf dibentuk menggunakan dua tangan** (seperti huruf A, B, D, M, hingga Y) agar menyerupai bentuk visual huruf Latinnya sehingga lebih intuitif dipahami, sedangkan **10 huruf lainnya menggunakan satu tangan** (C, E, I, J, L, O, R, U, V, dan Z).
* **Sub-Halaman A: Kurikulum & Mode Belajar (`/bisindo/learn`)**
  * Menampilkan daftar 26 huruf terbuka semua, dibagi dalam 4 kelompok belajar yang disarankan:
    * *Unit 1 (Vokal):* `A, E, I, O, U`
    * *Unit 2 (Isyarat 1 Tangan):* `C, J, L, R, V, Z`
    * *Unit 3 (Isyarat 2 Tangan Dasar):* `B, D, F, H, K, T, W, X`
    * *Unit 4 (Isyarat 2 Tangan Lanjutan):* `G, M, N, P, Q, S, Y`
  * Saat satu huruf dibuka:
    * **Kiri:** Foto panduan bersih (dari dataset Achmad Noer), label badge `1 Tangan` atau `2 Tangan`, petunjuk posisi jari singkat, tombol ikon speaker untuk dengar pelafalan, dan catatan khusus untuk huruf gerak.
      * *Contoh Catatan Khusus pada Huruf J:* *"Catatan Praktik: Dalam percakapan sehari-hari, huruf J digerakkan melengkung di udara membentuk kait huruf J menggunakan jari kelingking. Untuk latihan kamera ini, tahan pose akhir jari kelingking mengarah ke samping seperti pada foto contoh."*
    * **Kanan:** Layar Kamera / Video Simulasi + pilihan klip simulasi + tombol *Tampilkan Titik Kerangka Jari* + indikator *Hold Progress Ring* (penuh dalam **1,5 detik** saat akurasi $\ge 75\%$).
* **Sub-Halaman B: Mode Latihan (`/bisindo/practice`)**
  * Menampilkan tantangan per sesi (misal 5 soal): *"Tunjukkan isyarat untuk huruf: **K** (2 Tangan)"*.
  * Gambar jawaban disembunyikan secara bawaan, namun wajib ada tombol **"Lihat Petunjuk Gambar"** (*Toggle Hint*) agar pengguna/juri yang lupa bentuk tangan bisa mengintip contohnya, serta tombol **"Lewati"** dan **"Gunakan Video Simulasi"**.
  * Waktu tahan pose: **1,0 detik**.
* **Sub-Halaman C: Mode Eksplorasi (`/bisindo/explore`)**
  * Pengguna bebas mencoba gerakan tangan apa saja di depan kamera (atau memutar video simulasi).
  * Layar langsung menerjemahkan pose ke huruf teratas secara instan tanpa perlu ditahan lama, disertai **3 Bar Probabilitas Teratas** (misal: `D (88%)`, `P (8%)`, `B (3%)`) agar pengguna melihat cara kerja AI secara transparan.

---

### Halaman 3: Mini-Game "Guess the Sign" (`/games/guess-the-sign`)
* Kuis tebak gambar isyarat BISINDO berisi 10 pertanyaan pilihan ganda (4 tombol huruf per soal).
* Tidak membutuhkan kamera sama sekali (nyaman dimainkan sambil santai di HP maupun laptop).
* Setiap memilih jawaban, langsung muncul warna hijau/merah, suara konfirmasi, dan tombol lanjut. Di akhir 10 soal muncul ringkasan skor dan tambahan `+20 XP`.

---

### Halaman 4: Modul Braille (`/braille`)
Memiliki pemilih sub-mode: **Belajar & Simulator**, **Quiz Baca Pola (Pola ke Huruf)**, dan **Quiz Susun Titik (Huruf ke Pola)**.

* **Komponen Utama Sel 6-Titik:**
  * Enam tombol bulat besar tersusun 2 kolom x 3 baris:
    * Kolom Kiri: Titik `1` (`[F]`), Titik `2` (`[D]`), Titik `3` (`[S]`)
    * Kolom Kanan: Titik `4` (`[J]`), Titik `5` (`[K]`), Titik `6` (`[L]`)
  * Titik yang aktif tampak timbul jelas dengan warna kontras tinggi; titik nonaktif tampak sebagai lingkaran garis tepi.
  * Di bawahnya terdapat petunjuk jelas: *"Klik lingkaran titik atau tekan tombol F-D-S dan J-K-L pada keyboard untuk menyalakan/mematikan titik. Tekan Backspace untuk mengosongkan."*
* **Section Wajib Edukasi Kontekstual ("Tahukah Kamu?"): Bagaimana Teman Tunanetra Mengetik?**
  * *Contoh Draf Teks "Tahukah Kamu?" (Braille & Keyboard Perkins):*
    > **Tahukah Kamu? Begini Cara Teman Tunanetra Mengetik Pesan dengan Cepat**  
    > Saat menulis Braille, teman-teman Tunanetra tidak menusuk titik satu per satu secara lambat. Pada mesin tik fisik **Perkins Brailler** maupun fitur **Braille Screen Input** di layar ponsel pintar (iOS dan Android), enam jari diletakkan sejajar pada enam tombol titik.  
    > Di simulator ini, kamu bisa merasakan tata letak jari yang sama menggunakan papan ketik laptopmu:  
    > • **Tangan Kiri:** Jari telunjuk di **`F`** (Titik 1), jari tengah di **`D`** (Titik 2), jari manis di **`S`** (Titik 3).  
    > • **Tangan Kanan:** Jari telunjuk di **`J`** (Titik 4), jari tengah di **`K`** (Titik 5), jari manis di **`L`** (Titik 6).  
    > Mengapa urutannya `F-D-S` dan bukan `S-D-F`? Karena jari telunjuk manusia adalah jari yang paling kuat dan lincah, sehingga selalu ditugaskan memegang titik paling atas (Titik 1 dan Titik 4)!
  * *Contoh Draf Teks Tambahan "Rahasia Pola 10 Huruf Braille":*
    > **Tips Cepat Menghafal Braille:** Louis Braille merancang pola ini secara sistematis, bukan acak!  
    > 1. Huruf **A sampai J** hanya memakai 4 titik bagian atas (Titik 1, 2, 4, 5).  
    > 2. Huruf **K sampai T** punya bentuk persis sama dengan A sampai J, hanya ditambah **Titik 3** di kiri bawah! (Contoh: A = Titik 1, maka K = Titik 1 + 3).  
    > 3. Huruf **U, V, X, Y, Z** melanjutkan pola yang sama dengan tambahan **Titik 3 dan Titik 6** di kedua sudut bawah (kecuali **W** yang unik karena huruf W belum dipakai dalam abjad Prancis saat Braille diciptakan).
* **Sub-Mode A: Belajar & Simulator Eksplorasi**
  * Klik huruf mana saja dari daftar A-Z untuk menyalakan polanya di sel 6-titik dan mendengar suaranya, atau tekan-tekan sendiri kombinasi titiknya untuk melihat huruf apa yang terbentuk secara *live*.
* **Sub-Mode B: Quiz Baca Pola (Pola ke Huruf)**
  * Sel 6-titik menyala menampilkan satu pola soal -> pengguna menebak huruf Latinnya.
* **Sub-Mode C: Quiz Susun Titik (Huruf ke Pola)**
  * Layar menampilkan target huruf (misal: *"Susun huruf **M**"*). Pengguna menyalakan titik-titik yang diperlukan (bisa diketik santai satu per satu lewat `F-D-S / J-K-L` atau diklik), lalu menekan **`Space` / `Enter`** atau klik tombol **"Periksa Jawaban"** untuk mengunci dan menilai jawabannya.

---

### Halaman 5: Dashboard Progres Saya (`/progress`)
* Menampilkan **Streak Belajar Harian**, **Total XP & Level**, jumlah huruf BISINDO dikuasai (`X/26`), jumlah huruf Braille dikuasai (`X/26`), serta peta grid 26 huruf yang memberi warna berbeda antara huruf yang sudah dipelajari dan yang belum.
* Menampilkan catatan jujur: *"Progres belajar Anda saat ini disimpan secara lokal pada peramban perangkat ini"* beserta tombol *Reset Data Belajar* (dengan konfirmasi).

---

## 5. Kontrak Teknis Antar-Modul & Saran Pembagian Tim

Agar anggota tim bisa bekerja secara paralel tanpa konflik kode, patuhi **3 Kontrak Teknis** berikut:

### Kontrak 1: Format Ekspor Model AI (`training/` -> `public/models/bisindo/`)
Tim AI menyerahkan 3 komponen di dalam folder `public/models/bisindo/`:
1. `model.json` & file bobot `group1-shard1of1.bin` (format TensorFlow.js Layers Model, menerima input tensor shape `[1, 86]` bertipe `float32`, mengeluarkan output `[1, 26]` atau `[1, 27]` probabilitas softmax).
2. `labels.json`: pemetaan indeks kelas berurutan (`"A"` s.d. `"Z"`, atau termasuk `"NOTHING"` jika tersedia).
3. Dokumentasi & implementasi fungsi normalisasi 86 fitur (wajib identik di Python `src/bisindo/features.py` saat training dan di `lib/cv/normalizeLandmarks.ts` pada web).

### Kontrak 2: Antarmuka `VideoInputProvider`
Komponen kamera frontend harus memisahkan *pengambil gambar* dari *pendeteksi AI*:
* Sumber input bisa berupa `HTMLVideoElement` dari `getUserMedia` (webcam) maupun `HTMLVideoElement` dari file `/videos/samples/{letter}.mp4` (video simulasi).
* Fungsi deteksi `detectFrame(videoElement, timestampMs)` menerima elemen `<video>` manapun tanpa peduli asalnya dari kamera asli atau file simulasi.

### Kontrak 3: Antarmuka `ProgressRepository`
Seluruh fitur yang menambah XP, mencatat huruf selesai, atau mengecek pengaturan audio wajib memanggil hook `useProgress()` dari satu modul terpusat (`lib/storage/progressRepository.ts`), menggunakan skema `signify_progress_v1` sebagaimana tertulis di Bab 4.1 dokumen SRS.

### Saran Pembagian Peran Tim (Jika 2-4 Orang)
* **Role 1 (AI & Computer Vision Engineer):** Mengelola folder `training/`, ekstraksi landmark MediaPipe 2-tangan dari dataset `Agung Ma'ruf`, training & evaluasi model, ekspor ke TF.js, perekaman klip video simulasi tangan asli, dan pembuatan modul `lib/cv/` di web.
* **Role 2 (Frontend BISINDO & Camera UX):** Membangun halaman Mode Belajar, Mode Latihan, Mode Eksplorasi BISINDO, kanvas penggambaran kerangka tangan (*landmark overlay*), timer tahan pose (`Hold Time`), dan *Judge Testing Mode* switcher.
* **Role 3 (Frontend Braille, Mini-Game & Gamification):** Membangun komponen Sel 6-Titik + event listener keyboard `F-D-S / J-K-L` (Toggle + Confirm), kedua mode Quiz Braille, Mini-Game *Guess the Sign*, Web Speech audio helper, serta `ProgressRepository` & halaman Dashboard Progres.
* **Role 4 (UI/UX System, Landing Page, Proposal & Video Demo):** Menyusun identitas visual (`DESIGN.md`), Landing Page, responsivitas mobile, audit aksesibilitas kontras & keyboard, penulisan Proposal IT RUSH 2026, README, serta perekaman Video Demo 3-5 menit.

---

## 6. Instruksi & Guardrails Wajib untuk AI Coding Agent Tim

> **Cara Pakai Bagian Ini:**  
> Setiap anggota tim yang menggunakan bantuan AI Coding Agent (Antigravity, Cursor, Claude Code, GitHub Copilot, dsb.) **wajib meminta AI mereka membaca dokumen ini dan `SIGNIFY_SRS.md` sebelum menulis kode**.

### Aturan Keras (Hard Rules) untuk AI Agent:
1. **JANGAN gunakan `numHands: 1` pada MediaPipe.** BISINDO memiliki 16 huruf 2-tangan dan 10 huruf 1-tangan. Selalu gunakan `numHands: 2` dengan vektor input `86` fitur (2D Boháček + `dx, dy`).
2. **JANGAN panggil `localStorage` langsung di komponen React.** Gunakan abstraksi `ProgressRepository` tunggal agar fitur autentikasi cloud dapat ditambahkan di masa depan tanpa refactor UI.
3. **JANGAN gunakan hitungan jumlah frame murni untuk *Hold Time* pose.** Gunakan selisih waktu `performance.now()` (`1500ms` di Mode Belajar, `1000ms` di Mode Latihan) ditambah syarat minimal `5 frame` valid agar kecepatan di kamera FPS rendah tetap konsisten.
4. **JANGAN terapkan sistem tekan bersamaan murni (*strict chord*) pada keyboard Braille.** Gunakan mekanisme **Toggle** pada tombol `F, D, S, J, K, L`, `Backspace` untuk reset, dan `Space`/`Enter` untuk submit jawaban di kuis.
5. **JANGAN membuat klaim atau data palsu di UI.** Dilarang menulis angka statistik karangan (seperti *"10.000+ pengguna aktif"* atau *"Akurasi 99,9%"* tanpa dasar uji), testimoni fiktif, atau menaruh tombol/tautan navbar yang tidak berfungsi (*dead links/buttons*).
6. **JANGAN gunakan karakter em-dash (`—`) pada teks antarmuka web.** Gunakan tanda titik dua (`:`), koma (`,`), titik (`.`), atau tanda kurung `()` agar teks bahasa Indonesia terasa alami.
7. **WAJIB sediakan seluruh UI State secara utuh:** *Loading state* (saat model AI dimuat), *Empty state* (saat belum ada progres), dan *Error/Fallback state* (terutama mengarahkan ke **Mode Simulasi Video** ketika izin kamera ditolak atau tidak ada webcam).
8. **WAJIB patuhi standar aksesibilitas:** Kontras teks minimal **WCAG AA (4.5:1)**, semua kontrol interaktif bisa diakses penuh memakai tombol `Tab` dengan garis fokus (*focus indicator*) yang terlihat jelas, dan ukuran tombol di layar mobile minimal `44x44 px` tanpa *horizontal overflow*.
9. **WAJIB tetapkan arah desain visual (`DESIGN.md`) sebelum membangun komponen UI** agar tampilan produk memiliki karakter identitas yang kuat, hidup, dan tidak terlihat seperti *template* generik buatan AI (hindari gradien ungu-biru generik tanpa tujuan, *glassmorphism* berlebihan di semua elemen, atau susunan kartu identik yang monoton).
10. **JANGAN menghapus atau memanipulasi riwayat *commit* Git (`git push --force` / rebase destruktif)** karena juri IT RUSH 2026 memeriksa keaslian riwayat *commit* repository publik.
