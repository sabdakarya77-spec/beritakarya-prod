# Optimasi Pemutaran Video Eksklusif (YouTubeEmbed)

Penerapan komponen pemutar video YouTube yang dioptimalkan untuk performa Core Web Vitals maksimal dan aksesibilitas (a11y), serta perbaikan alur navigasi dari daftar video eksklusif di halaman utama ke detail artikel.

## User Review Required

Ada beberapa poin yang perlu ditinjau sebelum pelaksanaan:

> [!IMPORTANT]
> **Integrasi Tag `<img>` Native vs Config Next.js**:
> Rencana ini menggunakan tag `<img>` HTML biasa untuk thumbnail YouTube guna menghindari overhead server Next.js (image optimization) serta menghindari keharusan mengubah `next.config.mjs`.

> [!NOTE]
> **Homepage Navigation**:
> Elemen video eksklusif di halaman depan saat ini tidak dapat diklik. Kami akan menambahkan pembungkus `<Link>` Next.js agar mengarah ke artikel detail sehingga pengguna dapat menonton video tersebut di halaman artikel menggunakan komponen pemutar yang baru.

## Open Questions

Tidak ada pertanyaan terbuka saat ini karena rancangan komponen pemutar video (`YouTubeEmbed`) telah diselaraskan dengan kebutuhan UX dan performa terbaik pada percakapan sebelumnya.

---

## Proposed Changes

### Web Application Frontend

#### [NEW] [YouTubeEmbed.tsx](file:///d:/beritakarya-v.0.1/apps/web/components/ui/YouTubeEmbed.tsx)
- Membuat komponen client (`'use client'`) berkinerja tinggi.
- Menggunakan **Intersection Observer** (`rootMargin: '300px'`) untuk memicu loading asset gambar thumbnail hanya saat mendekati viewport.
- Mengimplementasikan **real network load state** dengan event `onLoad` pada gambar untuk memicu skeleton loading selama gambar diunduh dari jaringan.
- Menerapkan **multi-stage fallback** untuk thumbnail: `maxresdefault` ➔ `hqdefault` ➔ `sddefault` ➔ fallback placeholder lokal.
- Mengamankan video eksklusif dengan ikon control play premium, status penayangan yang bersahabat, parameter privasi (`youtube-nocookie.com`, `rel=0`), serta `playsinline=1` untuk browser iOS.
- Mendukung a11y (aksesibilitas keyboard) dengan `role="button"`, `tabIndex={0}`, dan event `onKeyDown` (tombol Enter).

#### [MODIFY] [page.tsx](file:///d:/beritakarya-v.0.1/apps/web/app/%5Bsite%5D/artikel/%5Bslug%5D/page.tsx)
- Mengimpor komponen `YouTubeEmbed` dari `../../../../components/ui/YouTubeEmbed`.
- Menggantikan kode render `<iframe>` YouTube langsung pada `case 'embed'` dengan komponen `<YouTubeEmbed url={block.url} title={block.title} />`.

#### [MODIFY] [SiteHomePage.tsx](file:///d:/beritakarya-v.0.1/apps/web/components/pages/SiteHomePage.tsx)
- Membungkus kartu video eksklusif (`videoStories.map`) dengan komponen `<Link href={`/${siteParam}/artikel/${article.slug}`}>` agar kartu dapat diklik dan mengarahkan pengguna ke halaman artikel detail.

---

## Verification Plan

### Automated Tests
- Menjalankan linting dan pengecekan tipe TypeScript untuk memastikan tidak ada kesalahan kompilasi:
  ```bash
  pnpm --filter web typecheck
  pnpm --filter web lint
  ```

### Manual Verification
1. **Verifikasi Performa**:
   - Memastikan tidak ada script pihak ketiga YouTube yang dimuat sebelum pengguna mengklik tombol putar atau scroll mendekati video.
2. **Uji Coba Fallback Thumbnail**:
   - Mencoba memuat URL video yang tidak memiliki gambar `maxresdefault` dan memastikan sistem beralih ke `hqdefault` secara halus.
3. **Uji Coba Navigasi**:
   - Membuka halaman depan dan memastikan bahwa setiap item di daftar "Laporan Video Eksklusif" dapat diklik dan mengarahkan ke artikel detail yang bersangkutan.
4. **Uji Coba Aksesibilitas**:
   - Memastikan tombol pemutaran dapat fokus menggunakan tombol `Tab` dan dapat diaktifkan menggunakan tombol `Enter` pada keyboard.
