# Saran Peningkatan Homepage BeritaKarya: UI/UX Berbasis Kompas.id

## Tujuan
Menyusun ulang homepage agar lebih dinamis, padat, dan visual — meniru pendekatan Kompas.id yang mengutamakan *density*, *visual impact*, dan *real-time update*. Kompas.id menampilkan banyak konten di atas fold tanpa terasa penuh, dengan hierarki jelas dan navigasi cepat.

---

## 1. Tampilan Ringkas dan Padat — Lebih Banyak Konten di Atas Fold

### **Prinsip Kompas.id**:
- Tidak ada "ruang kosong" yang tidak bermakna
- Konten utama muncul secepat mungkin di atas fold
- Semua section berkontribusi pada informasi, bukan dekorasi

### **Saran Implementasi**:
- **Hapus "Hero" sebagai slider** — ganti dengan **1 kartu besar (cover image)** sebagai headline utama, diikuti oleh 3–4 artikel kecil di sampingnya (layout 1+3).
- **Pindahkan "Fokus Redaksi" ke bawah headline utama**, jadikan sebagai grid 2x2 (4 artikel) — tanpa judul section, cukup dengan garis pemisah tipis.
- **Trending Topics** → ubah menjadi **"Terpopuler"** dan tampilkan sebagai **list horizontal 6 item** di bawah Fokus Redaksi.
- **Feed Utama** → tetap 6 artikel, tapi ubah menjadi **grid 3x2** — lebih padat dan efisien.
- **Sidebar** → pertahankan hanya 2 widget:
  1. Terbaru (5 artikel)
  2. Terpopuler (5 artikel, versi berbeda dari trending)
- Jangan tampilkan Info Pasar di sidebar, pindahkan ke bawah.
- **Hapus "Pilihan Editor" dari atas fold** — gantikan dengan **"Baca Lagi"** (3 artikel) di bawah feed utama.

---

## 2. Penekanan pada Foto Besar dan Visual Kuat

### **Prinsip Kompas.id**:
- Cover image sebagai "pintu masuk" cerita
- Gambar besar, tajam, dan bermakna — bukan sekadar dekorasi

### **Saran Implementasi**:
- **Headline utama**: Gunakan gambar **1200x800px** dengan overlay teks putih minimalis:
  - Judul besar: `font-serif, text-3xl md:text-4xl`
  - Subjudul kecil: `font-normal, text-sm`
  - Tidak ada tombol "Baca" — klik gambar langsung membuka artikel
- **Kartu artikel lainnya**:
  - Gunakan gambar **600x400px** dengan border 1px ringan — tidak ada shadow
  - Hapus teks di atas gambar — judul hanya muncul saat hover atau di bawah gambar
  - Gunakan **effect zoom-on-hover** ringan: `transform: scale(1.02)` — memberi kesan hidup tanpa gangguan.

---

## 3. Integrasi Video dan Multimedia Langsung

### **Prinsip Kompas.id**:
- Video bukan "widget tambahan" — tapi bagian dari alur berita
- Multimedia ditampilkan secara organik, bukan terpisah

### **Saran Implementasi**:
- **Pindahkan "Video Eksklusif" dan "Foto Jurnalistik" ke dalam feed utama** sebagai **kartu khusus**:
  - Kartu video: tampilkan thumbnail dengan ikon play, durasi, dan judul — klik langsung buka video embed
  - Kartu foto jurnalistik: tampilkan 2–3 foto dalam satu kartu (carousel kecil)
- **Tambahkan "Multimedia" sebagai section baru** di bawah feed utama:
  - 3 item: 1 video, 1 foto jurnalistik, 1 infografik
  - Tampilkan label kecil: "Video", "Foto", "Infografik" di pojok kanan atas
  - Tidak memakan ruang besar — ukuran kartu sama seperti artikel biasa

---

## 4. Kategori sebagai Navigasi Utama (Horizontal Banner)

### **Prinsip Kompas.id**:
- Kategori bukan hanya menu — tapi navigasi utama yang aktif
- Tampilan horizontal, padat, dan bisa scroll jika banyak

### **Saran Implementasi**:
- **Ganti menu navigasi sidebar** dengan **horizontal banner kategori di bawah navbar**
- Tampilkan 8 kategori utama:
  - Berita
  - Politik
  - Ekonomi
  - Hukum
  - Olahraga
  - Hiburan
  - Teknologi
  - Kesehatan
- Gunakan font `font-medium`, ukuran `text-sm`, padding 8px
- Tambahkan **scroll horizontal** jika lebih dari 8 kategori
- Setiap kategori bisa diklik → langsung filter feed utama (tanpa halaman baru)
- Tambahkan ikon kecil di samping:
  - 🔴 untuk "Berita Terkini"
  - 🎥 untuk "Video"
  - 📸 untuk "Foto"
  - 📊 untuk "Infografik"

---

## 5. Widget Dinamis — "Terpopuler", "Terbaru", "Baca Lagi"

### **Prinsip Kompas.id**:
- Widget bukan pengisi ruang — tapi alat untuk mempertahankan perhatian
- Ditampilkan di lokasi strategis: samping, bawah, dan akhir halaman

### **Saran Implementasi**:
- **Sidebar**:
  - Terbaru (5 artikel) — update real-time
  - Terpopuler (5 artikel) — berdasarkan klik dan waktu baca
- **Bawah halaman**:
  - **Baca Lagi**: 3 artikel dari kategori yang sama dengan artikel terakhir yang dibaca
  - **Komentar Terbaru**: 3 komentar terbaru (jika fitur komentar aktif)
  - **Berita Lainnya**: 3 artikel dari kategori serupa, tapi tidak tampil di feed utama
- **Widget Info Pasar** → pindahkan ke bawah halaman, bukan sidebar — ukuran lebih kecil, 1 kolom, teks kecil.

---

## 6. Kombinasi Semua Poin — Hasil Akhir yang Diinginkan

### **Struktur Homepage Baru (Dari Atas ke Bawah)**
1. **Breaking News Banner** (opsional — jika ada berita penting)
2. **Headline Utama** (1 kartu besar + 3 kartu kecil di samping)
3. **Horizontal Kategori Banner** (scrollable, 8–12 kategori)
4. **Fokus Redaksi** (grid 2x2)
5. **Terpopuler** (horizontal scroll, 6 item)
6. **Feed Utama** (grid 3x2, 6 artikel)
7. **Multimedia** (3 kartu: video, foto jurnalistik, infografik)
8. **Sidebar (4 Kolom)**:
   - Terbaru (5 artikel)
   - Terpopuler (5 artikel)
9. **Baca Lagi** (3 artikel terkait)
10. **Komentar Terbaru** (3 komentar)
11. **Berita Lainnya** (3 artikel)
12. **Info Pasar** (widget kecil, 1 kolom)
13. **Footer**

### **Hasil yang Diharapkan**:
- Lebih padat, lebih cepat, lebih dinamis
- Pengguna tidak perlu scroll jauh untuk menemukan konten baru
- Gambar besar dan visual kuat meningkatkan engagement
- Navigasi kategori mempercepat eksplorasi
- Widget dinamis menjaga pengguna tetap di halaman

---

## Langkah Selanjutnya
1. Buat wireframe Figma/Sketch dengan dua versi:
   - Versi NYT (untuk editorial berat)
   - Versi Kompas.id (untuk berita cepat dan visual)
2. A/B test di tim internal — lihat mana yang lebih mudah dipahami dan lebih banyak diklik
3. Implementasikan bertahap:
   - Mulai dari **horizontal kategori banner** dan **headline utama**
4. Pantau metrik:
   - Time-on-page (naik?)
   - Scroll depth (apakah mereka sampai ke bawah?)
   - CTR ke artikel (naik?)
   - Return rate (pengguna kembali?)

> **Catatan**: Kompas.id tidak "menghargai ruang kosong" — mereka menghargai *informasi*. Jika ada 10 artikel penting, tampilkan 10. Jangan biarkan ruang kosong menggantikan konten. **Lebih banyak konten = lebih banyak nilai.**
