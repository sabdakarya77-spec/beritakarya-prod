# Saran Peningkatan Homepage BeritaKarya: UI/UX Berbasis NYT  

## Tujuan  
Menyusun ulang homepage agar memiliki hierarki visual yang jelas, tata letak yang rapi, dan pengalaman membaca yang mendalam — meniru pendekatan editorial The New York Times (NYT) yang mengutamakan *clarity*, *authority*, dan *focus*.

---

## 1. Penataan Ulang Tata Letak Visual  

### **Prinsip NYT**:  
- Ruang putih (white space) sebagai elemen desain aktif  
- Grid terstruktur, konsisten, dan modular  
- Alignment vertikal dan horizontal ketat  

### **Saran Implementasi**:  
- **Kurangi padding/margin yang tidak konsisten** di semua section. Gunakan sistem grid 12-kolom yang konsisten (misal: `lg:grid-cols-12`).  
- **Jarak antar section**: Gunakan jarak `120px` antara section utama (hero → fokus → trending → feed → editorial), bukan `60px` atau variatif.  
- **Proporsi kartu**:  
  - Kartu besar (hero/fokus): 16:9 → tetap  
  - Kartu medium: 4:3 → ubah dari 16:9 agar lebih “membaca”  
  - Kartu portrait (editor choice): tetap 3:4  
- **Align semua headline ke kiri** — hindari teks tengah kecuali untuk hero atau judul section.  
- **Gunakan grid yang terpisah per section**, bukan satu grid besar — memudahkan perubahan modular di masa depan.  

---

## 2. Penyederhanaan Jumlah Elemen per Section  

### **Masalah Saat Ini**:  
- Terlalu banyak elemen dalam satu section (terutama sidebar dan feed utama).  
- Elemen seperti “Info Pasar”, “Foto Jurnalistik”, dan “Video Eksklusif” bersaing untuk perhatian.  

### **Saran Implementasi**:  
- **Sidebar**:  
  - Hapus “Foto Jurnalistik” dari sidebar — pindahkan ke **section editorial bawah** sebagai bagian dari “Laporan Visual”.  
  - Hapus “Video Eksklusif” dari sidebar — pindahkan ke **section editorial bawah** sebagai bagian dari “Laporan Visual”.  
  - Pertahankan hanya:  
    1. Akses Redaksi  
    2. Terbaru  
    3. Info Pasar  
  - Jika ingin menambahkan elemen baru, gunakan **toggle** (misal: “Lihat lebih banyak” di bawah Terbaru).  

- **Feed Utama**:  
  - Kurangi dari 8 artikel menjadi **6 artikel utama**: 2 besar + 4 medium.  
  - Hapus `HOME_FEED_2` — cukup 1 iklan inline setelah 2 kartu besar.  
  - “Berita Lainnya” → ubah menjadi **“Berita Pilihan”** untuk memberi nuansa editorial, bukan sekadar feed.  

- **Trending Topics**:  
  - Kurangi dari 5 menjadi **3 item** — agar tidak terlalu “ramai”.  
  - Gunakan font yang lebih ringan (`font-medium`) bukan `font-black`.  

---

## 3. Penguatan Hierarki Visual  

### **Prinsip NYT**:  
- Headline sebagai fokus utama  
- Metadata sebagai pendukung, bukan pengganggu  
- Kontras warna dan bobot tipografi yang jelas  

### **Saran Implementasi**:  
- **Headline (H2/H3)**:  
  - Gunakan font `font-serif` (misal: `Cormorant Garamond` atau `Playfair Display`) untuk headline section dan artikel — menambah kesan editorial.  
  - Ukuran:  
    - Hero: `text-3xl md:text-4xl`  
    - Fokus Redaksi: `text-2xl md:text-3xl`  
    - Berita Pilihan: `text-xl md:text-2xl`  
- **Metadata**:  
  - Gunakan warna `text-gray-500` (bukan `text-brand-text-muted`) — lebih netral dan elegan.  
  - Hapus `font-bold` dari nama penulis — cukup `font-normal`.  
  - Waktu baca: pindahkan ke bawah judul, bukan di samping.  
- **Warna**:  
  - Gunakan warna merah (`#e11d48`) **hanya untuk** ikon, tombol, dan highlight editorial — jangan digunakan untuk semua teks.  
  - Gunakan warna abu-abu gelap (`#111827`) untuk teks utama — lebih mendalam dari `#000`.  

---

## 4. Penambahan Elemen Baru  

### **Prinsip NYT**:  
- “Editor’s Pick” di atas fold  
- “The Daily Briefing” sebagai elemen khas  
- “Most Read” sebagai pengingat sosial  

### **Saran Implementasi**:  
- **Tambahkan “Pilihan Editor” di atas fold**:  
  - Setelah hero, sebelum “Fokus Redaksi”  
  - 3 kartu portrait (3:4) — tanpa judul section, hanya gambar + headline + nama penulis  
  - Label kecil di sudut kanan atas: “Pilihan Editor”  
  - Efek hover: sedikit zoom dan blur pada gambar  

- **Tambahkan “Breaking News” sebagai banner di bawah navbar**:  
  - Gunakan warna `bg-red-500` dengan teks putih  
  - Tampilkan 1 artikel terbaru yang sangat penting (misal: bencana, kebijakan nasional)  
  - Gunakan ikon `Flash` dan animasi “pulsing” halus  
  - Tidak muncul jika tidak ada artikel dengan label “urgent”  

- **Tambahkan “Baca Juga” di bawah setiap artikel**:  
  - Di akhir feed utama, tambahkan section kecil:  
    ```  
    Baca Juga  
    • [Artikel 1]  
    • [Artikel 2]  
    • [Artikel 3]  
    ```  
  - Dengan 3 artikel terkait berdasarkan kategori — ini meningkatkan waktu tinggal.  

---

## 5. Kombinasi Semua Poin — Hasil Akhir yang Diinginkan  

### **Struktur Homepage Baru (Dari Atas ke Bawah)**  
1. **Breaking News Banner** (baru, di bawah navbar)  
2. **Hero** (4 artikel, slider otomatis)  
3. **Pilihan Editor** (3 kartu portrait, tanpa judul section)  
4. **Fokus Redaksi** (2 kartu besar + 2 horizontal)  
5. **Trending Topics** (3 item, sederhana)  
6. **Berita Pilihan** (2 besar + 4 medium) → *dengan 1 iklan di antaranya*  
7. **Sidebar (4 Kolom)**:  
   - Akses Redaksi  
   - Terbaru (5 artikel)  
   - Info Pasar  
8. **Editorial Extras (Full-width)**:  
   - Opini & Analisis (3 artikel)  
   - Laporan Visual (Foto Jurnalistik + Video Eksklusif, di satu section)  
9. **Baca Juga** (3 artikel terkait di bawah editorial extras)  

### **Hasil yang Diharapkan**:  
- Lebih tenang, lebih elegan, lebih editorial  
- Pengguna tidak terganggu oleh kekacauan visual  
- Fokus pada cerita, bukan elemen  
- Meningkatkan kepercayaan pengguna terhadap kredibilitas media  

---

## Langkah Selanjutnya  
1. Buat desain wireframe (Figma/Sketch) berdasarkan struktur di atas  
2. Uji dengan pengguna (usability test) — lihat di mana mereka menghabiskan waktu  
3. Implementasikan secara bertahap — mulai dari “Pilihan Editor” dan “Breaking News”  
4. Pantau metrik:  
   - Time-on-page (naik?)  
   - Scroll depth (apakah mereka mencapai editorial extras?)  
   - Click-through rate ke artikel  

> **Catatan**: NYT tidak menampilkan 15+ elemen di homepage. Mereka menampilkan 3-5 cerita besar, dan membiarkan ruang bernapas. **Kurangi untuk lebih banyak dampak.**