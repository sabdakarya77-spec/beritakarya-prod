# Homepage BeritaKarya - Laporan Analisis

## Arsitektur & Struktur
Homepage dibangun menggunakan Next.js (app router) dengan arsitektur modular dan terpisah antara:
- **Halaman**: `app/page.tsx` sebagai entry point
- **Komponen UI**: Terorganisir di `components/` dengan struktur berbasis fungsionalitas (ui/, berita/, layout/, dll)
- **Lib**: Logika bisnis dan fetch data di `lib/`
- **State**: Store dengan Zustand di `store/`
- **Konfigurasi**: Site-specific config di `packages/config`

## Fungsi Utama Homepage
Homepage berfungsi sebagai portal utama untuk `siteParam=pusat` dengan struktur dinamis:

### 1. Zona Hero (Full-width)
- Menampilkan 4 artikel terbaru sebagai slider otomatis
- Menggunakan komponen `MagazineBentoHero`
- Dinamis: Jumlah artikel berkurang jika data terbatas (2 artikel jika <15 total artikel)

### 2. Fokus Redaksi
- 2-4 artikel prioritas berdasarkan `isFeatured` atau `isExclusive`
- Layout asimetris: 1 kartu besar (kolom-2) + 2 kartu horizontal (kolom-1)
- Beri dampak visual dengan ikon Zap dan judul “Fokus Redaksi”

### 3. Trending Topics
- Menampilkan 5 artikel terpopuler berdasarkan views
- Tampilan horizontal strip dengan nomor urutan dan waktu baca
- Data diambil dari `getTrendingArticles()` (sort by views)

### 4. Feed Utama (8 Kolom)
- **2 Kartu Horizontal Besar**: Artikel terbaru setelah hero/fokus
- **Iklan Inline**: `HOME_FEED_1` setelah 2 kartu besar
- **6 Kartu Medium 2-Kolom**: “Berita Lainnya” dengan tautan “Lihat Arsip”
- **Iklan Inline**: `HOME_FEED_2` setelah feed utama
- **Load More**: Pagination otomatis untuk halaman berikutnya

### 5. Sidebar (4 Kolom)
- **Akses Redaksi**: Tiga tombol interaktif:
  - WhatsApp (dibangun dari nomor telepon situs)
  - Telegram (dari konfigurasi sosial)
  - Email (mailto: dengan subjek otomatis)
- **Terbaru**: 5 artikel non-hero dan non-trending, ditampilkan dengan nomor urutan
- **Info Pasar**: Widget dinamis dari `getMarketSnapshot()`
- **Foto Jurnalistik**: Rotasi otomatis 5 detik (3 artikel dengan kategori `foto-jurnalistik`)
- **Video Eksklusif**: Jika ada `siteSettings.featuredVideo`, ditampilkan dengan tombol play overlay

### 6. Editorial Extras (Full-width)
- **Pilihan Editor**: 3 kartu portrait (aspek 3:4) dari artikel `isFeatured`
- **Opini & Analisis**: 3 artikel dengan kategori `opini`, `kolom-esai`, `analisis` — tampilan teks dominan
- **Laporan Video Eksklusif**: 3 video dengan thumbnail dari YouTube (diproses dengan regex) dan overlay play button

## Fitur Dinamis & Logika
- **Distribusi Artikel**: Fungsi `distributeArticles()` mendistribusikan artikel secara deterministik ke zona berbeda tanpa duplikasi
- **Penanganan Kategori**:
  - `terbaru` → homepage utama
  - `tersimpan` → menampilkan `SavedArticlesFeed`
  - Kategori lain → menampilkan feed berdasarkan kategori
- **Fallback dan Error Handling**:
  - Jika data API gagal → tampilkan placeholder atau state kosong
  - Jika situs tidak dikenal → `notFound()` (Next.js)
- **Optimasi Performa**:
  - `next: { revalidate: 60 }` untuk caching data API
  - `SmartImage` untuk optimasi gambar
  - Lazy load dan skeleton loading implisit

## Teknologi & Stack
- **Frontend**: Next.js 14, React Server Components, TypeScript
- **Styling**: Tailwind CSS (utility-first)
- **Icons**: Lucide React + custom SocialIcons (SiTelegram, SiWhatsapp)
- **State**: Zustand (`store/`)
- **API**: Fetch dari `/api/v1/articles/public`, `/api/v1/categories/tree`, dll
- **SEO**: Metadata dinamis via `constructMetadata()`

## Pengalaman Pengguna (UX)
- **Responsif**: Desain mobile-first, layout berubah dari 1 kolom ke 12 kolom di desktop
- **Aksesibilitas**: Skip-to-content link, `aria-label`, kontras warna
- **Visual Hierarchy**: Penggunaan warna merah (`#e11d48`) sebagai highlight utama
- **Interaktivitas**: Hover effects, transisi halus, animasi scroll

## Kesimpulan
Homepage BeritaKarya adalah implementasi maju dari portal berita modern, menggabungkan:
- Struktur editorial yang jelas (hero → fokus → trending → feed → editorial)
- Personalisasi berbasis konten (kategori, simpan, video, opini)
- Monetisasi terintegrasi (iklan inline di posisi strategis)
- Kinerja tinggi dengan caching dan optimasi gambar
- Desain yang konsisten dan mudah dipelihara

Sistem ini dirancang untuk skala tinggi, mempertahankan kualitas editorial sambil menyediakan pengalaman pengguna yang dinamis dan responsif.