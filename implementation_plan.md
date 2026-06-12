## 🎯 Rencana Perbaikan: Menguatkan Pusat sebagai Single Source of Truth

Dengan konteks **Pusat mengontrol semua** untuk site daerah, berikut masalah yang harus diperbaiki dan bagaimana:

---

### 📋 MASALAH 1 (KRITIS): Media `siteId` Opsional di Schema

**Masalah:**
```prisma
model Media {
  siteId  String?   // ← Bisa NULL! Inkonsisten dengan konsep "semua terikat site"
  site    Site?     // ← Relasi opsional
}
```

Sedangkan Article punya `siteId String` (wajib).

**Dampak:**
- Media bisa "mengambang" tanpa konteks site — melanggar prinsip pusat
- `useMediaLibrary` di frontend mendefinisikan `siteId?: string` — opsional
- Repository `createMedia` menerima `siteId?: string` — opsional

**Solusi:**
1. Ubah Prisma schema: `siteId String` (wajib), `site Site` (wajib)
2. Buat migrasi: semua media yang `siteId` null di-assign ke `pusat`
3. Update repository: `siteId: string` (bukan `string?`)
4. Update frontend hook: `siteId: string` (bukan `string?`)
5. Update controller: eksplisit set `siteId: req.site` (sudah benar, tapi repository signature harus match)

**File yang diubah:**
- `apps/api/prisma/schema.prisma` — Media model
- `apps/api/src/modules/media/media.repository.ts` — type signature
- `apps/web/hooks/useMediaLibrary.ts` — MediaItem interface
- `apps/api/prisma/migrations/` — migrasi baru

---

### 📋 MASALAH 2 (KRITIS): Frontend `useMediaLibrary` Tidak Kirim Site Eksplisit

**Masalah:**
```typescript
const response = await api.get('/media', { params: { page: pageNum, limit: 30 } })
// Tidak ada params.site atau header X-Site-ID!
```

Hook ini bergantung pada cookie/JWT yang mungkin tidak selalu punya site context. API backend memerlukan `site` (dipaksa oleh `siteMiddleware`), tapi hook tidak mengirimkannya.

**Dampak:**
- Jika header `X-Site-ID` tidak diset oleh axios interceptor, request gagal dengan 400
- Perilaku tergantung pada side effect (interceptor) yang rapuh

**Solusi:**
1. Hook harus menerima `siteId` parameter dan mengirimkan sebagai query param atau header
2. Atau: hook membaca site dari `siteStore` (Zustand) secara reaktif
3. Atau: axios interceptor global yang Selalu menyertakan site context

**File yang diubah:**
- `apps/web/hooks/useMediaLibrary.ts` — tambah siteId param
- `apps/web/lib/api.ts` — kemungkinan tambah interceptor site
- Semua komponen yang memakai hook ini

---

### 📋 MASALAH 3 (SEDANG): Kategori Code Config vs Database Bisa Diverge

**Masalah:**
- `CATEGORY_TREE_CONFIG` di `packages/config/src/categories.ts` adalah hardcoded template
- `seedGlobalFromTemplate()` HANYA jalan kalau database belum punya kategori global
- Setelah seed, jika developer update config, database TIDAK ikut berubah
- `CATEGORY_NAV_CONFIG` dipakai frontend langsung dari config — bisa beda dengan database

**Dampak:**
- Site daerah mungkin punya kategori di nav yang tidak mereka miliki
- Superadmin edit kategori di database, tapi config di code tetap yang lama
- Deploy baru bisa "menyesatkan" kalau config dan DB tidak sinkron

**Solusi:**
1. ** Jadikan database sebagai satu-satunya source of truth untuk kategori runtime**
2. `CATEGORY_TREE_CONFIG` hanya dipakai untuk SEED awal — bukan untuk navigasi
3. Frontend harus fetch navigasi dari API (`/api/v1/categories/tree?site=...`), bukan dari config
4. Tambah endpoint `POST /api/v1/categories/sync-from-template` untuk re-sync (superadmin only)
5. `CATEGORY_NAV_CONFIG` di config package di-deprecate, diganti oleh API response

**File yang diubah:**
- `packages/config/src/categories.ts` — komentar deprecate `CATEGORY_NAV_CONFIG`
- `apps/web/components/layout/Navbar.tsx` — fetch dari API, bukan import config
- `apps/api/src/modules/category/category.service.ts` — tambah `syncFromTemplate()` method
- `apps/api/src/modules/category/category.controller.ts` — tambah sync endpoint

---

### 📋 MASALAH 4 (SEDANG): Media Tidak Ada Deduplikasi Per-Site

**Masalah:**
Tidak ada constraint unik di Media. File yang sama bisa diupload berkali-kali ke site yang sama.

**Dampak:**
- Storage boros (baya di S3/Supabase)
- Media library penuh duplikat
- Tidak ada cara melacak "siapa yang upload file ini pertama kali"

**Solusi:**
1. Hitung **hash SHA-256** dari buffer saat upload
2. Simpan hash di Media model sebagai field baru: `contentHash String?`
3. Sebelum upload, cek apakah hash+siteId sudah ada
4. Jika sudah ada: return media yang existing (reuse), bukan create baru
5. Tambah index: `@@index([siteId, contentHash])`

**File yang diubah:**
- `apps/api/prisma/schema.prisma` — tambah `contentHash` field
- `apps/api/src/modules/media/media.controller.ts` — hitung hash, cek duplikat
- `apps/api/src/modules/media/media.repository.ts` — tambah `findByContentHash()`

---

### 📋 MASALAH 5 (MINOR): Media Storage Path Tidak Site-Scoped

**Masalah:**
File key di S3 saat ini: `${id}.webp` atau `ads/${id}.webp` — tidak ada prefix site.

**Dampak:**
- Sulit mengelola storage per site (hapus semua media site tertentu)
- Jika ada sistem CDN caching per site, cache invalidation sulit

**Solusi:**
Ubah key pattern menjadi: `${siteId}/${id}.webp` dan `${siteId}/thumbs/${id}_thumb.webp`

Ini lebih konsisten dengan konsep "semua terikat site". Tapi ini **breaking change** untuk media yang sudah ada — perlu migrasi atau backward compatibility.

**Prioritas: Rendah** — bisa dilakukan bertahap saat ada media migration script.

---

### 📋 PRIORITAS PELAKSANAAN

| # | Perbaikan | Prioritas | Risiko | Effort |
|---|-----------|-----------|-------|--------|
| 1 | Media `siteId` wajib di schema | 🔴 Kritis | Rendah (migrasi aman) | Sedang |
| 2 | Frontend hook kirim siteId eksplisit | 🔴 Kritis | Rendah | Kecil |
| 3 | Kategori: DB sebagai truth, bukan config | 🟡 Sedang | Sedang (breaking UX nav) | Besar |
| 4 | Media deduplikasi via contentHash | 🟡 Sedang | Rendah | Sedang |
| 5 | Storage path site-scoped | 🟢 Minor | Tinggi (breaking existing URL) | Besar |

Saya sarankan mulai dari **#1 dan #2** dulu karena mereka yang paling melanggar prinsip "pusat sebagai pusat gravitasi" dan paling mudah diperbaiki.

---

Apakah Anda setuju dengan rencana ini? Jika ya, silakan **toggle to Act mode** agar saya bisa mulai implementasi perbaikan #1 dan #2. Atau apakah ada prioritas yang ingin diubah?