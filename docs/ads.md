# Dokumentasi Iklan (Ads) – BeritaKarya

Dokumen ini merangkum cara kerja **slot iklan** pada BeritaKarya, khususnya
slot **leaderboard** yang berada di bagian atas homepage. Semua komponen dan
API yang terlibat dijelaskan di bawah ini sehingga tim pengembang maupun
pengelola konten dapat memahami, men‑custom, atau men‑extend fungsionalitas
iklan.

---

## 1. Ringkasan Fungsionalitas

| Fitur | Penjelasan |
|------|------------|
| **AdSpace** (frontend) | Komponen React yang men‑fetch iklan publik dari API, men‑render iklan berupa **banner gambar**, **video**, atau **script HTML**. Menyediakan carousel bila ada lebih dari satu iklan dan melacak impresi serta klik. |
| **BillboardShowcase** (fallback) | Menampilkan contoh iklan statis ketika tidak ada iklan aktif. Sekarang mendukung **gambar** maupun **video** melalui properti `mediaType`/`mediaUrl`. |
| **Responsive height** | Tinggi slot leaderboard responsif: `120px` pada mobile dan `250px` pada desktop. |
| **Impresi per slide** | Impresi tercatat setiap kali slide menjadi aktif (satu kali per iklan ID) tanpa `IntersectionObserver`. |
| **CMS‑configurable fallback** | Endpoint API `/api/v1/ads/fallback` yang mengembalikan data fallback (gambar/video) yang dapat dikelola melalui CMS. Front‑end `AdSpace` men‑fetch fallback ketika tidak ada iklan publik. |

---

## 2. Komponen Front‑end

### 2.1 `AdSpace`

File: `apps/web/components/ui/AdSpace.tsx`

* Props
  ```tsx
  type: 'leaderboard' | 'rectangle' | 'rectangle_secondary' | 'in-feed'
  slot?: string
  label?: string
  className?: string
  ```
* Pengambilan iklan
  ```ts
  GET /api/v1/ads/public?site=<siteId>
  // filter by slot (`slotName`) di sisi client
  ```
* **Carousel** – otomatis berputar tiap 7 detik bila ada lebih dari satu iklan.
* **Impresi** – tercatat dengan:
  ```ts
  POST /api/v1/ads/track/<id>?action=impression
  ```
* **Klik** – tercatat dengan `action=click` yang menggunakan `navigator.sendBeacon` bila tersedia.
* **Fallback handling** – bila `ads.length === 0` dan `type === 'leaderboard'` maka:
  1. Front‑end memanggil endpoint `/api/v1/ads/fallback?slot=leaderboard`.
  2. Jika data ada, ditampilkan dengan media (gambar atau video) beserta headline.
  3. Jika tidak ada, menampilkan komponen `BillboardShowcase` (static).

### 2.2 `BillboardShowcase`

File: `apps/web/components/ui/BillboardShowcase.tsx`

* Menyimpan contoh iklan pada konstanta `CATEGORY_ADS`.
* Interface `CategoryAd` kini memiliki:
  ```ts
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  ```
* Rendering video bila `mediaType === 'video'`.
* Rotasi otomatis tiap 8 detik antar contoh.

---

## 3. API Backend

### 3.1 Endpoint publik

* **GET `/api/v1/ads/public?site=<siteId>`** – Mengembalikan semua iklan aktif untuk *site* tertentu. Struktur data (`AdItem`):
  ```ts
  interface AdItem {
    id: string;
    slot: string;
    code: string | null;      // script HTML
    imageUrl: string | null; // gambar atau video URL
    linkUrl: string | null;
    isActive: boolean;
    order: number;
  }
  ```
* **POST `/api/v1/ads/track/:id?action=impression|click`** – Mencatat impresi atau klik. Dilindungi rate‑limiter (`adTrackingLimiter`).

### 3.2 Fallback endpoint (baru)

* **GET `/api/v1/ads/fallback?slot=leaderboard`** – Mengembalikan contoh iklan yang dapat dikonfigurasi melalui CMS. Contoh respons saat ini (hard‑coded):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "fallback-1",
        "slot": "leaderboard",
        "mediaType": "image",
        "mediaUrl": "/public/fallbacks/leaderboard.jpg",
        "headline": "Contoh Iklan Fallback",
        "subheadline": "Ini contoh iklan fallback untuk slot leaderboard"
      }
    ]
  }
  ```
  *Catatan:* Endpoint dapat digantikan dengan panggilan ke CMS yang meng‑return struktur serupa.

### 3.3 Pengelolaan iklan (admin)

Endpoint‑endpoint berikut berada di file `apps/api/src/modules/ad/ad.controller.ts` dan dilindungi otorisasi (`requireAuth`, `requireRole`). Mereka meliputi:

* `GET /api/v1/ads/` – pagination list semua iklan.
* `POST /api/v1/ads/` – buat iklan baru (slot, kode, gambar, link).
* `PATCH /api/v1/ads/:id` – update iklan.
* `DELETE /api/v1/ads/:id` – hapus iklan.
* `PATCH /api/v1/ads/reorder` – ubah urutan iklan dalam slot.
* Endpoint paket & booking (tidak dibahas detail di sini).

---

## 4. Cara Menambahkan Iklan Video ke Fallback

1. Simpan file video di folder publik proyek, mis. `public/fallbacks/leaderboard-demo.mp4`.
2. Tambahkan entry baru ke `CATEGORY_ADS` dalam `BillboardShowcase.tsx`:
   ```tsx
   {
     id: 'video_demo',
     headline: 'Video Demo Billboard',
     subheadline: 'Contoh iklan video pada slot leaderboard',
     category: 'Demo Video',
     accentFrom: 'from-pink-600',
     accentTo: 'to-rose-800',
     ctaText: 'Lihat Demo',
     icon: <YourIcon />, // optional
     mediaType: 'video',
     mediaUrl: '/videos/leaderboard-demo.mp4',
   }
   ```
3. Pastikan path `mediaUrl` dapat di‑akses secara publik.

---

## 5. Responsifitas & Styling

* **Responsive height** – Ditetapkan di `AdSpace.tsx` pada objek `styles`:
  ```ts
  leaderboard: "w-full h-[120px] md:h-[250px] mb-6",
  ```
  `h-[120px]` berlaku pada breakpoint mobile, `md:h-[250px]` pada desktop.
* **Tailwind utilities** – Semua styling menggunakan Tailwind, sehingga penyesuaian dapat dilakukan melalui konfigurasi `tailwind.config.ts` bila diperlukan.

---

## 6. Pengujian & Build

Setelah melakukan perubahan, jalankan:

```bash
pnpm --filter @beritakarya/web type-check   # memastikan TypeScript lolos
pnpm --filter @beritakarya/web build        # membangun proyek (next build)
```

Jika tidak ada error, proses telah selesai.

---

## 7. Catatan Pengembangan Selanjutnya

* **Integrasi CMS** – Ganti implementasi hard‑coded pada endpoint `/fallback` dengan pemanggilan ke layanan CMS (mis. Strapi, Contentful) yang mengembalikan data dengan struktur yang sama.
* **Pengujian unit** – Tambahkan tes untuk memastikan fallback ditampilkan ketika tidak ada iklan publik dan bahwa impresi tercatat per‑slide.
* **Pengaturan slot lain** – Saat ini fallback hanya diimplementasikan untuk `leaderboard`. Jika diperlukan, dapat menambah parameter `slot` pada endpoint fallback untuk `rectangle`, `in-feed`, dll.

---

*Dokumentasi ini dibuat pada 21 Juni 2026 oleh Cline – virtual software engineer.*
