# Daftar Tugas Optimasi Pemutaran Video Eksklusif

Berikut adalah daftar tugas untuk implementasi pemutar video dan navigasi eksklusif:

- [ ] **1. Buat Komponen Baru `YouTubeEmbed.tsx`**
  - [ ] Implementasi Intersection Observer (`rootMargin: '300px'`) untuk lazy-load
  - [ ] Implementasi state `imgSrc` untuk *multi-stage fallback* (`maxresdefault` ➔ `hqdefault` ➔ `sddefault`)
  - [ ] Implementasi status `isImgLoading` menggunakan event `onLoad` untuk skeleton loading yang riil
  - [ ] Rancang UI fallback lokal jika seluruh thumbnail gagal dimuat
  - [ ] Tambahkan fitur aksesibilitas/a11y (`role="button"`, `tabIndex`, keydown Enter)
  - [ ] Terapkan parameter pemutar YouTube optimal (`youtube-nocookie.com`, `autoplay=1`, `rel=0`, `playsinline=1`)

- [ ] **2. Integrasikan `YouTubeEmbed` di Halaman Artikel**
  - [ ] Tambahkan impor `YouTubeEmbed` di `apps/web/app/[site]/artikel/[slug]/page.tsx`
  - [ ] Ganti render `<iframe>` bawaan pada blok `embed` dengan komponen `<YouTubeEmbed>` yang baru

- [ ] **3. Perbaiki Navigasi Daftar Video di Halaman Utama**
  - [ ] Modifikasi `apps/web/components/pages/SiteHomePage.tsx`
  - [ ] Bungkus setiap kartu dalam `videoStories.map` menggunakan `<Link href={`/${siteParam}/artikel/${article.slug}`}>`

- [ ] **4. Verifikasi & Pengujian**
  - [ ] Jalankan pengecekan TypeScript tipe dan linter (`pnpm type-check` dan `pnpm lint`)
  - [ ] Uji coba fungsionalitas pemutaran video, kelancaran skeleton loading, fallback gambar, serta navigasi keyboard
