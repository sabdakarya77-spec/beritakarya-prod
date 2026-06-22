# Implementasi Plan — Kategori Site View Berdiri Sendiri

## Tujuan

Site View menampilkan kategori lokal yang berdiri sendiri (tidak terikat global). Global = master, dipakai sebagai template saat create website baru. Sync dari Global = Add Only.

---

## Checklist Pengerjaan

### Phase 0: Migrasi Data Existing (Pusat + Nganjuk)

> **WAJIB dijalankan pertama kali sebelum phase lain.** Sekali jalan.

- [ ] **0.1** `apps/api/src/modules/category/category.service.ts` — Tambah method `migrateGlobalToLocal(siteId)`
  - Ambil **full tree** kategori global (top-level + sub + sub-sub)
  - Copy sebagai kategori lokal (`siteId=<siteId>`, `isGlobal=false`)
  - Pertahankan hierarki: mapping `globalId → localId` untuk reconnect `parentId`
  - Copy field: `name`, `slug`, `description`, `order`, `color`
  - Return mapping: `Map<globalId, localId>`

- [ ] **0.2** `apps/api/src/modules/category/category.service.ts` — Tambah method `remapArticleCategories(siteId, idMapping)`
  - Ambil semua `ArticleCategory` untuk artikel di `siteId`
  - Cek apakah `categoryId` ada di `idMapping` (artinya merujuk ke global)
  - Update `categoryId` ke lokal ID yang baru
  - Skip yang sudah merujuk ke lokal (tidak diubah)

- [ ] **0.3** `apps/api/src/modules/category/category.controller.ts` — Tambah endpoint `POST /categories/migrate-to-local`
  - Body: `{ siteId: string }` (opsional, default: jalankan untuk semua site)
  - Auth: superadmin only
  - Logic:
    1. Jalankan `migrateGlobalToLocal(siteId)` → dapat mapping
    2. Jalankan `remapArticleCategories(siteId, mapping)` → reassign artikel
    3. Return summary: jumlah kategori lokal dibuat, jumlah artikel di-remap

- [ ] **0.4** `apps/web/app/[site]/dashboard/categories/page.tsx` — Tambah tombol "Migrasi ke Lokal"
  - Tampilkan hanya di Global View (superadmin only)
  - Konfirmasi: "Ini akan copy semua kategori global ke lokal untuk setiap site dan re-map artikel. Lanjutkan?"
  - Panggil `POST /categories/migrate-to-local`
  - Tampilkan toast hasil migrasi

- [ ] **0.5** Verifikasi setelah migrasi
  - Cek kategori lokal pusat: punya full tree (top-level + sub + sub-sub)
  - Cek kategori lokal nganjuk: punya full tree (top-level + sub + sub-sub)
  - Cek artikel pusat: `ArticleCategory.categoryId` merujuk ke kategori lokal pusat
  - Cek artikel nganjuk: `ArticleCategory.categoryId` merujuk ke kategori lokal nganjuk
  - Cek tidak ada `ArticleCategory` yang masih merujuk ke kategori global

- [ ] **0.6** Backup database sebelum migrasi (precaution)

---

### Phase 1: API — Create Site Auto-Copy Global

- [x] **1.1** `apps/api/src/modules/site/site.service.ts` — Tambah method `copyGlobalToLocal(siteId)`
  - Ambil semua kategori global (`isGlobal: true`, `deletedAt: null`)
  - Copy sebagai kategori lokal (`siteId=<siteId>`, `isGlobal: false`)
  - Pertahankan hierarki (parent → sub → sub-sub)
  - Mapping `globalId → localId` untuk reconnect parentId
  - Copy field: `name`, `slug`, `description`, `order`, `color`

- [x] **1.2** `apps/api/src/modules/site/site.service.ts` — Panggil `copyGlobalToLocal` di `createSite`
  - Setelah `tx.site.create`, jalankan copy dalam transaksi yang sama
  - Pastikan kalau global kosong, site tetap terbuat (tidak error)

- [ ] **1.3** Test: create site baru via API → cek kategori lokal ter-copy dengan benar

---

### Phase 2: API — Site View Hanya Kategori Lokal

- [x] **2.1** `apps/api/src/modules/category/category.service.ts` — Ubah `findCategoriesForSite`
  - Sebelum: `OR: [{ siteId }, { isGlobal: true }]`
  - Sesudah: `{ siteId }`
  - Hapus logika `SiteCategory` assignment (Path A dan Path B)

- [x] **2.2** `apps/api/src/modules/category/category.service.ts` — Ubah `getCategoryTree`
  - Pastikan hanya return kategori lokal untuk site tersebut
  - Tidak ada global yang masuk

- [x] **2.3** `apps/api/src/modules/category/category.controller.ts` — Ubah `getCategoryTree` endpoint
  - Parameter `?site=<siteId>` → return lokal saja
  - Parameter `?view=global` → return global saja (superadmin only)
  - Parameter `?view=all` → return semua (superadmin only)

- [x] **2.4** `apps/api/src/modules/article/article.repository.ts` — Ubah `findArticlesBySite` category filter
  - Sebelum: `OR: [{ siteId }, { isGlobal: true }]`
  - Sesudah: `{ siteId }`

- [x] **2.5** `apps/api/src/modules/article/article.service.ts` — Ubah `resolveCategoryIds` slug resolution
  - Sebelum: `OR: [{ siteId }, { isGlobal: true }]`
  - Sesudah: `{ siteId }`

- [ ] **2.6** Test: fetch `/categories/tree?site=pusat` → hanya kategori lokal pusat, tidak ada global

---

### Phase 3: API — Sync dari Global (Add Only)

- [x] **3.1** `apps/api/src/modules/category/category.service.ts` — Tambah method `syncGlobalToLocal(siteId)`
  - Ambil kategori global, ambil kategori lokal site
  - Bandingkan by slug — yang belum ada di lokal, tambahkan
  - Yang sudah ada di lokal → biarkan (tidak diubah)
  - Pertahankan hierarki saat copy

- [x] **3.2** `apps/api/src/modules/category/category.controller.ts` — Tambah endpoint `POST /categories/sync-from-global`
  - Body: `{ siteId: string }`
  - Auth: superadmin only
  - Panggil `syncGlobalToLocal(siteId)`
  - Return: jumlah kategori yang di-add

- [ ] **3.3** Test: sync dari global → kategori baru di global masuk ke lokal, kategori lokal yang sudah ada tidak berubah

---

### Phase 4: API — Delete Aman (Otomatis)

- [x] **4.1** Verifikasi `deleteCategory` — tambah proteksi defense in depth
  - Site View hanya menampilkan kategori lokal → delete otomatis aman
  - Tambah check `isGlobal` → tolak hapus kategori global dari Site View
  - Parameter `allowGlobal` → Global View tetap bisa hapus global

- [ ] **4.2** Test: hapus sub-kategori di Site View pusat → kategori lokal pusat yang terhapus, global tidak terpengaruh
- [ ] **4.3** Test: hapus sub-kategori di Site View nganjuk → kategori lokal nganjuk yang terhapus, pusat tidak terpengaruh

---

### Phase 5: API — Global View CRUD

- [x] **5.1** Verifikasi `createCategory` — Global View bisa buat kategori global
  - Parameter `siteId: null` → `isGlobal: true`
  - Tidak masalah karena Global View terpisah dari Site View

- [x] **5.2** Verifikasi `updateCategory` — Global View bisa edit kategori global

- [x] **5.3** Verifikasi `deleteCategory` — Global View bisa hapus kategori global
  - Hapus kategori global di Global View = aman (tidak ada site yang pakai baris global)
  - Site sudah pakai kategori lokal masing-masing
  - Controller pass `allowGlobal=true` dari `?view=global`

- [ ] **5.4** Test: CRUD di Global View → kategori global berubah, kategori lokal site tidak terpengaruh

---

### Phase 6: Frontend — Site View Hanya Kategori Lokal

- [x] **6.1** `apps/web/app/[site]/dashboard/categories/page.tsx` — Pastikan fetch benar
  - Site View: `?site=<siteId>` → hanya kategori lokal
  - Global View: `?view=global` → hanya global
  - Sudah benar dari commit 311e442, pastikan tidak ada perubahan yang rusak

- [x] **6.2** Badge — pastikan Site View menampilkan nama site (bukan "GLOBAL")
  - Sudah benar dari commit 311e442
  - Karena sekarang yang tampil pasti lokal, badge otomatis benar

- [ ] **6.3** Test: buka Site View pusat → hanya kategori lokal pusat, badge "PUSAT"
- [ ] **6.4** Test: buka Site View nganjuk → hanya kategori lokal nganjuk, badge "NGANJUK"

---

### Phase 7: Frontend — Editor dan Public Navbar

- [x] **7.1** `apps/web/components/editor/tabs/TabSettings.tsx` — Verifikasi editor
  - Fetch `GET /categories/tree?site=<siteId>` → sudah return lokal saja
  - Dropdown kategori menampilkan kategori lokal site tersebut
  - Pastikan artikel lama yang sudah di-remap (Phase 0) tetap ter-assign dengan benar

- [x] **7.2** `apps/web/components/layout/PublicSiteLayout.tsx` — Verifikasi public navbar
  - Fetch `GET /categories/tree?site=<siteId>` → sudah return lokal saja
  - Chipcard/navbar menampilkan kategori lokal site tersebut
  - Filter artikel by slug → tetap berfungsi (slug lokal = slug global)

- [ ] **7.3** Test: editor nganjuk → dropdown tampil kategori lokal nganjuk
- [ ] **7.4** Test: public nganjuk → chipcard tampil kategori lokal nganjuk
- [ ] **7.5** Test: klik kategori di public → filter artikel tetap berfungsi

---

### Phase 8: Frontend — Tombol Sync dari Global

- [x] **8.1** `apps/web/app/[site]/dashboard/categories/page.tsx` — Tambah tombol "Sync dari Global"
  - Tampilkan di Site View (bukan Global View)
  - Posisi: di header area, sebelah "Muat Default"
  - Icon: 🔄 refresh
  - Konfirmasi sebelum sync: "Tambah kategori baru dari global? Kategori yang sudah ada tidak diubah."

- [x] **8.2** Handler sync
  - Panggil `POST /categories/sync-from-global` dengan `{ siteId }`
  - Tampilkan toast hasil: "X kategori baru ditambahkan dari global"
  - Refresh daftar kategori setelah sync

- [ ] **8.3** Test: klik Sync dari Global → kategori baru dari global masuk ke lokal

---

### Phase 9: Frontend — SiteCategoriesDialog Ubah Fungsi

- [x] **9.1** Evaluasi SiteCategoriesDialog
  - Dialog tidak diperlukan lagi — sync sudah ada di categories page
  - Hapus dialog dan tombol "Kategori" dari admin page

- [x] **9.2** Cleanup admin page
  - Hapus import SiteCategoriesDialog, Tags
  - Hapus state categoriesSite
  - Hapus tombol "Kategori" di tabel site
  - Hapus <SiteCategoriesDialog /> dari JSX

---

### Phase 10: Cleanup — SiteCategory Table

- [x] **10.1** Evaluasi tabel `site_categories`
  - Kategori lokal sudah punya baris sendiri → junction table tidak diperlukan
  - File `site-category.service.ts` dan `site-category.utils.ts` masih ada (bisa dihapus di migrasi berikutnya)
  - Route dan handler di controller sudah dihapus

- [x] **10.2** `apps/api/src/modules/site/site.controller.ts` — Cleanup
  - Hapus import `siteCategoryService`
  - Hapus route `GET/PUT /:siteId/category-assignments`
  - Hapus handler `getSiteCategoryAssignments` dan `updateSiteCategoryAssignments`

- [x] **10.3** Cleanup code yang pakai `SiteCategory`
  - `category.service.ts` → sudah dihapus import `getSiteAssignmentFilter` (Phase 2)
  - `site.controller.ts` → sudah dihapus route dan handler
  - File `site-category.service.ts` dan `site-category.utils.ts` → masih ada, bisa dihapus di migrasi Prisma berikutnya

---

### Phase 11: E2E Test

- [ ] **11.1** Test flow: Migrasi → kategori lokal terbuat, artikel di-remap
- [ ] **11.2** Test flow: Create site baru → global ter-copy ke lokal
- [ ] **11.3** Test flow: Tambah sub-kategori di Site View → tidak muncul di site lain
- [ ] **11.4** Test flow: Hapus sub-kategori di Site View → tidak hilang di site lain
- [ ] **11.5** Test flow: Sync dari Global → kategori baru masuk, lama tetap
- [ ] **11.6** Test flow: CRUD di Global View → tidak berdampak ke kategori lokal
- [ ] **11.7** Test flow: Editor tampil kategori lokal yang benar
- [ ] **11.8** Test flow: Public navbar tampil kategori lokal yang benar
- [ ] **11.9** Test flow: Filter artikel by kategori tetap berfungsi

---

## Urutan Pengerjaan

```
Phase 0 (Migrasi Data Existing) ← WAJIB PERTAMA
    ↓
Phase 1 (Create Site Auto-Copy)
    ↓
Phase 2 (Site View Hanya Lokal + Article Filter)
    ↓
Phase 3 (Sync Add Only)
    ↓
Phase 4 (Verifikasi Delete Aman)
    ↓
Phase 5 (Verifikasi Global View CRUD)
    ↓
Phase 6 (Frontend Site View)
    ↓
Phase 7 (Frontend Editor + Public Navbar)
    ↓
Phase 8 (Frontend Tombol Sync)
    ↓
Phase 9 (SiteCategoriesDialog)
    ↓
Phase 10 (Cleanup SiteCategory)
    ↓
Phase 11 (E2E Test)
```

---

## Status

| Phase | Status | Catatan |
|---|---|---|
| 0. Migrasi Data Existing | ⏳ Belum | **WAJIB pertama kali** |
| 1. Create Site Auto-Copy | ✅ Selesai | 1.1 + 1.2 done, 1.3 perlu test manual |
| 2. Site View Hanya Lokal | ✅ Selesai | 2.1-2.5 done, 2.6 perlu test manual |
| 3. Sync Add Only | ✅ Selesai | 3.1 + 3.2 done, 3.3 perlu test manual |
| 4. Delete Aman | ✅ Selesai | Defense in depth + allowGlobal param |
| 5. Global View CRUD | ✅ Selesai | Verifikasi CRUD berfungsi |
| 6. Frontend Site View | ✅ Selesai | Fetch + badge verified, 6.3-6.4 perlu test manual |
| 7. Frontend Editor + Public | ✅ Selesai | Verifikasi fetch + filter, 7.3-7.5 perlu test manual |
| 8. Frontend Tombol Sync | ✅ Selesai | 8.1 + 8.2 done, 8.3 perlu test manual |
| 9. SiteCategoriesDialog | ✅ Selesai | Dialog dihapus, sync di categories page |
| 10. Cleanup SiteCategory | ✅ Selesai | Route + handler dihapus, file service/utils masih ada |
| 11. E2E Test | ⏳ Belum | |
