# Integrasi Google Analytics 4 — BeritaKarya CMS

Dokumen ini menjelaskan secara rinci perubahan yang dilakukan pada codebase `beritakarya-prod-main` untuk menambahkan Google Analytics 4 (gtag.js) ke situs publik, serta langkah-langkah untuk menerapkannya di produksi (`https://beritakarya.co`).

---

## 1. Latar Belakang

Codebase sebelumnya **sudah** memiliki integrasi GA4 **Data API** (`apps/api/src/services/google-analytics.service.ts`) yang menarik data laporan (trafik, sumber kunjungan, dsb) ke dashboard admin lewat field `ga4PropertyId`. Namun, **tidak ada** script pelacak (`gtag.js`) yang terpasang di halaman publik — artinya walau `ga4PropertyId` diisi, Google Analytics tidak menerima data kunjungan sama sekali karena tidak ada mekanisme pengiriman event dari browser pengunjung.

Dua hal ini berbeda dan saling melengkapi:

| | Property ID (`ga4PropertyId`) — sudah ada | Measurement ID (`gaMeasurementId`) — baru ditambahkan |
|---|---|---|
| Format | `properties/123456789` | `G-XXXXXXXXXX` |
| Fungsi | **Membaca** laporan GA4 lewat API (ditampilkan di dashboard admin) | **Mengirim** data kunjungan pengguna ke GA4 (tracking) |
| Kredensial | Perlu Service Account (client email + private key) | Tidak perlu, ID ini memang publik |
| Dipasang di | Backend (`google-analytics.service.ts`) | Halaman publik (`<head>` via script) |

Perubahan pada dokumen ini menambahkan bagian yang hilang: pemasangan `gtag.js` di halaman publik, dikontrol lewat CMS.

---

## 2. Daftar File yang Diubah/Ditambahkan

| # | File | Jenis |
|---|---|---|
| 1 | `apps/api/prisma/schema.prisma` | Diubah |
| 2 | `apps/api/prisma/migrations/20260710000000_add_ga_measurement_id/migration.sql` | Baru |
| 3 | `apps/api/src/modules/site/site.service.ts` | Diubah |
| 4 | `apps/api/src/modules/site/site.controller.ts` | Diubah |
| 5 | `apps/web/lib/siteSettings.ts` | Diubah |
| 6 | `apps/web/components/analytics/GoogleAnalytics.tsx` | Baru |
| 7 | `apps/web/app/[site]/layout.tsx` | Diubah |
| 8 | `apps/web/app/[site]/dashboard/(admin)/settings/page.tsx` | Diubah |

---

## 3. Rincian Perubahan per File

### 3.1 `apps/api/prisma/schema.prisma`

Menambahkan kolom baru pada model `Site`:

```prisma
model Site {
  ...
  ga4PropertyId        String?   // GA4 Data API (laporan dashboard admin) — sudah ada sebelumnya
  gaMeasurementId      String?   // BARU: "G-XXXXXXXXXX" - untuk gtag.js tracking script di halaman publik
  gscSiteUrl           String?
  ...
}
```

**Kenapa:** setiap site (tenant) di sistem multi-situs ini butuh menyimpan Measurement ID miliknya sendiri, sama seperti field Google lain yang sudah ada per-site.

---

### 3.2 `apps/api/prisma/migrations/20260710000000_add_ga_measurement_id/migration.sql` *(baru)*

```sql
-- AlterTable: Add Google Analytics gtag.js Measurement ID (public tracking script)
-- Berbeda dari ga4PropertyId yang dipakai untuk GA4 Data API (laporan di dashboard)
ALTER TABLE "Site" ADD COLUMN "gaMeasurementId" TEXT;
```

**Kenapa:** perubahan `schema.prisma` saja tidak otomatis mengubah database yang sudah berjalan. File migrasi ini yang dieksekusi Prisma untuk benar-benar menambahkan kolom di database produksi.

---

### 3.3 `apps/api/src/modules/site/site.service.ts`

**Perubahan A — fungsi `getSiteSettings()`:**

```ts
return {
  ...
  ga4PropertyId: site.ga4PropertyId,
  gaMeasurementId: site.gaMeasurementId,   // BARU
  gscSiteUrl: site.gscSiteUrl,
  ...
}
```
Membuat nilai `gaMeasurementId` ikut dikembalikan setiap kali endpoint `/api/v1/sites/settings` dipanggil — baik oleh form admin maupun oleh halaman publik yang perlu tahu Measurement ID untuk dipasang.

**Perubahan B — fungsi `updateSiteSettings()`:**

```ts
const allowedFields = [
  ...,
  'googleIndexingConfig', 'ga4PropertyId', 'gaMeasurementId', 'gscSiteUrl',   // gaMeasurementId BARU
  ...
]
```
Ini whitelist field yang boleh diubah lewat `PATCH /sites/settings`. Tanpa baris ini, walau form admin mengirim `gaMeasurementId`, backend akan **mengabaikannya diam-diam** (silent drop) karena tidak dikenali.

---

### 3.4 `apps/api/src/modules/site/site.controller.ts`

```ts
const SUPERADMIN_ONLY_FIELDS = [
  ...,
  'ga4PropertyId',
  'gaMeasurementId',   // BARU
  'gscSiteUrl',
  ...
]
```
Field ini dimasukkan ke daftar yang **hanya bisa diubah superadmin** — mengikuti pola field Google lain yang sudah ada. Kalau role `wapimred` mencoba mengirim field ini lewat API, backend otomatis membuangnya sebelum disimpan, dan mencatat percobaan itu di log (`[SECURITY] wapimred userId=... coba update field superadmin-only`).

---

### 3.5 `apps/web/lib/siteSettings.ts`

**Perubahan A — tipe data:**
```ts
export type PublicSiteConfig = {
  ...
  trendingTopics?: unknown[]
  gaMeasurementId?: string | null   // BARU
  aboutUs?: string | null
  ...
}
```

**Perubahan B — fungsi `buildPublicSiteConfig()`:**
```ts
return {
  ...
  trendingTopics: (siteSettings?.trendingTopics as unknown[]) || [],
  gaMeasurementId: (siteSettings?.gaMeasurementId as string) || null,   // BARU
  ...
}
```
File ini adalah "jembatan" antara respons API (JSON mentah) dan komponen React (yang butuh tipe data jelas). Perubahan ini memastikan nilai `gaMeasurementId` bisa dipakai dengan aman di seluruh frontend.

---

### 3.6 `apps/web/components/analytics/GoogleAnalytics.tsx` *(file baru)*

```tsx
import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId?: string | null
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId) return null   // tidak render apa pun kalau kosong

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
```

**Kenapa seperti ini:**
- Menggunakan `next/script` (bukan tag `<script>` biasa) — komponen resmi Next.js yang mengatur *kapan* dan *bagaimana* script dimuat agar tidak memperlambat render halaman.
- `strategy="afterInteractive"` — script dimuat setelah halaman selesai jadi interaktif, praktik standar untuk skrip analitik/marketing.
- Guard `if (!measurementId) return null` — kalau sebuah site belum mengisi Measurement ID di CMS, komponen ini tidak melakukan apa-apa (aman dipasang secara global tanpa syarat tambahan).

---

### 3.7 `apps/web/app/[site]/layout.tsx` *(perubahan inti — titik penyambung)*

**Sebelum:**
```tsx
export default async function SiteLayout({ children, params }) {
  const resolvedParams = await params
  const site = (resolvedParams?.site || 'pusat').toLowerCase()
  ...
  return (
    <>
      <SwRegister site={site} />
      {children}
      <PWAInstallPrompt site={site} siteName={displayName} />
    </>
  )
}
```

**Sesudah:**
```tsx
import GoogleAnalytics from '../../components/analytics/GoogleAnalytics'
import { fetchSiteSettings } from '../../lib/siteSettings'

export default async function SiteLayout({ children, params }) {
  const resolvedParams = await params
  const site = (resolvedParams?.site || 'pusat').toLowerCase()
  ...
  const siteSettings = await fetchSiteSettings(site)
  const gaMeasurementId = (siteSettings?.gaMeasurementId as string | null) || null

  return (
    <>
      <GoogleAnalytics measurementId={gaMeasurementId} />
      <SwRegister site={site} />
      {children}
      <PWAInstallPrompt site={site} siteName={displayName} />
    </>
  )
}
```

**Kenapa di sini:** `[site]/layout.tsx` adalah *layout* yang membungkus **seluruh halaman** di bawah route dinamis `[site]/...` (beranda, artikel, kategori, penulis, dsb). Karena sistem ini multi-tenant (satu instance melayani banyak domain/subdomain berbeda), memasang komponen di titik ini membuat:
- Setiap tenant otomatis memuat Measurement ID **miliknya sendiri** (di-resolve dari parameter `site` di URL).
- Tidak perlu menyentuh setiap halaman satu per satu — cukup satu titik pemasangan.

---

### 3.8 `apps/web/app/[site]/dashboard/(admin)/settings/page.tsx`

Empat titik perubahan pada halaman admin **Dashboard → Pengaturan Situs**:

**A. State awal form:**
```ts
const [settings, setSettings] = useState({
  ...,
  ga4PropertyId: '',
  gaMeasurementId: '',   // BARU
  gscSiteUrl: ''
})
```

**B. Saat memuat data dari API (mapping response ke state):**
```ts
const mappedSettings = {
  ...,
  ga4PropertyId: data.data.ga4PropertyId || '',
  gaMeasurementId: data.data.gaMeasurementId || '',   // BARU
  gscSiteUrl: data.data.gscSiteUrl || ''
}
```

**C. Input field baru di UI** (diletakkan tepat di bawah input "GA4 Property ID" yang sudah ada):
```tsx
<div className="space-y-3">
  <label htmlFor="settings-ga-measurement-id">GA4 Measurement ID (Tracking Script)</label>
  <input
    id="settings-ga-measurement-id"
    type="text"
    value={settings.gaMeasurementId}
    onChange={(e) => setSettings({ ...settings, gaMeasurementId: e.target.value })}
    placeholder="G-XXXXXXXXXX"
  />
  <p className="text-xs text-gray-500">
    Ditemukan di Google Analytics → Admin → Data Streams → pilih stream situs Anda → Measurement ID.
    Isian ini yang benar-benar memasang script pelacak (gtag.js) di halaman publik situs,
    terpisah dari Property ID di atas yang hanya dipakai untuk laporan di dashboard.
  </p>
</div>
```

**D. Fungsi `handleSave()`** — **tidak perlu diubah**, karena sudah mengirim seluruh objek `settings` ke `PATCH /sites/settings`:
```ts
const { data } = await api.patch('/sites/settings', finalSettings)
```
Field baru otomatis ikut terkirim karena sudah menjadi bagian dari state `settings`.

---

## 4. Alur Kerja Setelah Perubahan (End-to-End)

```
Admin isi Measurement ID di form Pengaturan Situs
        ↓
PATCH /api/v1/sites/settings  (hanya superadmin)
        ↓
site.controller.ts → cek role → site.service.ts → simpan ke kolom gaMeasurementId di DB
        ↓
Pengunjung membuka halaman publik (mis. beritakarya.co/artikel/judul-berita)
        ↓
[site]/layout.tsx dijalankan (server component) → fetchSiteSettings(site)
        ↓
gaMeasurementId diteruskan ke komponen <GoogleAnalytics />
        ↓
Kalau ada isinya → gtag.js dimuat di browser pengunjung → data kunjungan terkirim ke GA4
```

---

## 5. Langkah Deploy ke Produksi (`beritakarya.co`)

### Langkah A — Siapkan Measurement ID di Google Analytics
1. Login ke [analytics.google.com](https://analytics.google.com).
2. Buat Property baru (atau pakai yang sudah ada) untuk BeritaKarya, set zona waktu Indonesia & mata uang IDR.
3. Di property tersebut, buka **Admin → Data Streams → Add stream → Web**, isi URL `https://beritakarya.co`.
4. Salin **Measurement ID** yang muncul (format `G-XXXXXXXXXX`).

### Langkah B — Terapkan Perubahan Kode
1. Merge/terapkan 8 file di atas ke repo produksi.
2. Masuk ke folder `apps/api`, jalankan:
   ```bash
   npx prisma migrate deploy
   ```
   untuk menambahkan kolom `gaMeasurementId` ke database produksi.
3. Deploy ulang `apps/api` dan `apps/web` seperti biasa (CI/CD atau manual).

### Langkah C — Isi Measurement ID lewat CMS
1. Login ke CMS sebagai **superadmin**.
2. Buka **Dashboard → Pengaturan Situs** untuk site `pusat` (beritakarya.co).
3. Scroll ke bagian **"Google Analytics & Search Console"**.
4. Isi kolom baru **"GA4 Measurement ID (Tracking Script)"** dengan Measurement ID dari Langkah A.
5. Klik **Simpan**.
6. Jika ada sub-situs daerah lain (mis. `jombang.beritakarya.co`), ulangi Langkah A–C untuk masing-masing site dengan property GA4 terpisah, supaya trafik tiap edisi daerah tidak tercampur.

### Langkah D — Verifikasi
1. Buka `https://beritakarya.co`, klik kanan → **View Page Source**, cari teks `googletagmanager.com/gtag/js?id=G-`. Jika muncul, script sudah aktif.
2. Buka GA4 → **Laporan → Real-time**, kunjungi situsmu di tab lain — harusnya muncul minimal 1 pengguna aktif dalam beberapa detik.

---

## 6. Catatan Penting: Keamanan (Belum Diperbaiki)

Ditemukan saat analisis: endpoint `GET /api/v1/sites/settings` bersifat **publik tanpa autentikasi**, namun saat ini juga mengembalikan field `googleIndexingConfig` yang berisi `privateKey` service account Google secara utuh. Siapa pun yang mengakses `GET /api/v1/sites/settings?site=pusat` bisa mendapatkan private key tersebut.

**Rekomendasi:** field sensitif seperti `privateKey` sebaiknya di-strip dari response endpoint publik ini, dan hanya dikembalikan lewat endpoint yang mewajibkan autentikasi admin. Perubahan `gaMeasurementId` pada dokumen ini **aman** untuk tetap publik (Measurement ID memang dirancang untuk terlihat di source code halaman), tapi `privateKey` tidak seharusnya ikut terekspos.

Perbaikan ini belum dilakukan pada perubahan di atas — perlu keputusan/konfirmasi terpisah sebelum diterapkan, karena berpotensi mempengaruhi fungsi yang sudah berjalan (form admin saat ini membaca `privateKey` dari endpoint yang sama untuk ditampilkan kembali di form edit).
