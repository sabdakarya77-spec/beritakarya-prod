# Audit Dead Code & Unused Files — BeritaKarya

> **Tanggal Audit:** 10 Oktober 2026  
> **Auditor:** Antigravity AI Code Auditor  
> **Scope:** Monorepo (`apps/api`, `apps/web`, `packages/*`, `scripts/*`)  
> **Metode Verifikasi:** AST & Cross-Reference Import Analysis di seluruh codebase

Dokumen ini memuat daftar file yang terdeteksi **sudah tidak digunakan (dead code / orphaned files)** untuk ditinjau dan dikoreksi oleh tim sebelum dilakukan tindakan pembersihan (*cleanup*).

---

## Ringkasan Eksekutif

| Kategori Temuan | Jumlah File | Estimasi Baris Kode | Tingkat Risiko Hapus |
|---|:---:|:---:|:---:|
| **Backend API (`apps/api`)** | 6 file | ~547 baris | 🟢 Sangat Rendah (0 import di codebase) |
| **Frontend Web (`apps/web`)** | 3 file | ~480 baris | 🟢 Sangat Rendah (0 import di codebase) |
| **Scratch Scripts (`scripts/`)** | 3 file | ~173 baris | 🟢 Aman (utilitas manual/satu kali) |
| **Build Artifacts di `packages/types/src/`** | 21 file | — | 🟢 Aman (file kompilasi lama, tertutup `.gitignore`) |
| **Dormant Component (Jangan Dihapus)** | 1 file | ~120 baris | 🟡 Tahan (primitif baru design system) |
| **Total Potensi Reduksi Kode Mati** | **12 file kode** | **~1.200 baris** | — |

---

## 1. Backend API (`apps/api`) — 6 File

File-file berikut sama sekali tidak di-import oleh controller, router, service, maupun script utama backend.

### 1.1 `apps/api/src/modules/kyc/kyc.repository.ts`
* **Ukuran:** 257 baris
* **Status:** 🔴 **Dead Code (Aman Dihapus)**
* **Fungsi Asal:** Abstraksi query helper Prisma untuk fitur KYC (`findKycUsers`, `findUserForKycDetail`, `updateKycSubmission`, `getKycStats`, dll).
* **Alasan Tidak Dipakai:** [`apps/api/src/modules/kyc/kyc.controller.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/kyc/kyc.controller.ts) memanggil `prisma.user.*`, `prisma.kYCViewLog.*`, dan `prisma.auditLog.*` secara langsung tanpa melewati repository ini. File ini ditinggalkan dan tidak pernah di-import oleh file mana pun.
* **Tindakan:** `DELETE`

---

### 1.2 `apps/api/src/modules/site/site-category.service.ts`
* **Ukuran:** 158 baris
* **Status:** 🔴 **Dead Code (Aman Dihapus)**
* **Fungsi Asal:** Kelas `SiteCategoryService` dan instance `siteCategoryService` untuk mengelola kaitan kategori dengan site (`getAssignedCategoryTree`, `assignCategories`, `ensureSiteExists`).
* **Alasan Tidak Dipakai:** Seluruh pengelolaan hierarki dan penetapan kategori site dikerjakan langsung oleh [`category.service.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/category/category.service.ts) dan [`site.service.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/site/site.service.ts). Tidak ada controller maupun service yang mengimpor `siteCategoryService`.
* **Tindakan:** `DELETE`

---

### 1.3 `apps/api/src/modules/invitation/invitation.repository.ts`
* **Ukuran:** 98 baris
* **Status:** 🔴 **Dead Code (Aman Dihapus)**
* **Fungsi Asal:** Abstraksi query helper Prisma untuk undangan admin/staf (`findInvitationByToken`, `findPendingInvitation`, `createInvitation`, dll).
* **Alasan Tidak Dipakai:** [`apps/api/src/modules/invitation/invitation.controller.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/invitation/invitation.controller.ts) mengeksekusi langsung `prisma.invitation.*` dan `prisma.user.*`. Repository ini tidak pernah digunakan.
* **Tindakan:** `DELETE`

---

### 1.4 `apps/api/src/scripts/seed-quotas.ts`
* **Ukuran:** 85 baris
* **Status:** 🔴 **Orphaned Script (Aman Dihapus / Konsolidasi)**
* **Fungsi Asal:** Script standalone untuk seeding kuota AI role default ke tabel `RoleQuota`.
* **Alasan Tidak Dipakai:** Script ini tidak terdaftar di `package.json`, tidak dipanggil oleh `src/db/seed.ts`, dan daftar rolenya sudah *outdated* (belum memuat role baru seperti `kaperwil`, `kabiro`, dan `korwil`).
* **Tindakan:** `DELETE` (atau satukan logikanya ke `src/db/seed.ts` jika ingin diotomasi).

---

### 1.5 `apps/api/src/ai/usage.service.ts`
* **Ukuran:** 30 baris
* **Status:** 🔴 **Dead Code (Aman Dihapus)**
* **Fungsi Asal:** Fungsi pembantu `logUsage()` dan `getUserUsageToday()`.
* **Alasan Tidak Dipakai:** Pencatatan penggunaan AI sudah ditangani langsung di [`apps/api/src/ai/base.service.ts:297`](file:///d:/beritakarya-v.0.1/apps/api/src/ai/base.service.ts#L297) menggunakan `prisma.aIUsage.create(...)`. File ini tidak lagi di-import oleh modul AI mana pun.
* **Tindakan:** `DELETE`

---

### 1.6 `apps/api/src/modules/kyc/kyc.router.ts`
* **Ukuran:** 4 baris
* **Status:** 🔴 **Redundant File (Aman Dihapus)**
* **Fungsi Asal:** Alias export `export const kycModuleRouter: Router = kycRouter`.
* **Alasan Tidak Dipakai:** Pada entry point [`apps/api/src/main.ts:22`](file:///d:/beritakarya-v.0.1/apps/api/src/main.ts#L22), router di-import langsung dari `kyc.controller`: `import { kycRouter } from './modules/kyc/kyc.controller'`. File ini redundan.
* **Tindakan:** `DELETE`

---

## 2. Frontend Web (`apps/web`) — 3 File

### 2.1 `apps/web/components/ui/AdImageCropper.tsx`
* **Ukuran:** 210 baris
* **Status:** 🔴 **Dead Code (Aman Dihapus)**
* **Fungsi Asal:** Modal cropping gambar iklan berbasis library `react-image-crop` (fitur upload mandiri pengiklan).
* **Alasan Tidak Dipakai:** Mengacu pada dokumen arsitektur [`SIMPLIFIKASI-IKLAN.md`](file:///d:/beritakarya-v.0.1/SIMPLIFIKASI-IKLAN.md), alur pemasangan iklan diubah di mana materi iklan dikirimkan langsung ke admin redaksi dan admin mengunggah file gambar yang sudah pas ukurannya tanpa cropping self-service. Komponen ini ditinggalkan dan memiliki 0 import.
* **Tindakan:** `DELETE`

---

### 2.2 `apps/web/components/layout/NavbarTicker.tsx`
* **Ukuran:** 202 baris
* **Status:** 🔴 **Unused Component (Aman Dihapus / Optional Backup)**
* **Fungsi Asal:** Running ticker bursa pasar modal (IHSG, USD/IDR, SGD/IDR, Emas) serta breaking news Antara RSS.
* **Alasan Tidak Dipakai:** Navigasi utama publik [`apps/web/components/layout/Navbar.tsx`](file:///d:/beritakarya-v.0.1/apps/web/components/layout/Navbar.tsx) tidak mengimpor komponen ini. Tampilan layout atas publik berfokus pada tanggal, search, dan kategori.
* **Tindakan:** `DELETE` (Kecuali redaksi berencana memasang kembali running ticker pasar modal di navbar).

---

### 2.3 `apps/web/components/dashboard/ads/AdsSubNav.tsx`
* **Ukuran:** 68 baris
* **Status:** 🔴 **Dead Code (Aman Dihapus)**
* **Fungsi Asal:** Bar navigasi sub-menu advertiser lama (`Overview`, `Slot Iklan`).
* **Alasan Tidak Dipakai:** Halaman manajemen iklan advertiser sudah dipindahkan/terintegrasi ke sidebar navigasi admin global. Komponen ini tidak pernah di-import oleh layout maupun page aktif.
* **Tindakan:** `DELETE`

---

## 3. Utilitas & Scratch Scripts di Root (`scripts/`) — 3 File

File di folder `scripts/` yang sifatnya scratch/one-off:

| # | File | Ukuran | Status & Keterangan | Rekomendasi |
|---|---|:---:|---|---|
| 1 | [`scripts/debug-categories.ts`](file:///d:/beritakarya-v.0.1/scripts/debug-categories.ts) | 53 baris | Scratch script untuk inspect manual data kategori di database lokal saat debugging. | `DELETE` (atau simpan di scratch jika masih butuh) |
| 2 | [`scripts/gen-font-data.js`](file:///d:/beritakarya-v.0.1/scripts/gen-font-data.js) | 38 baris | Script generator font data satu kali jalan. | `DELETE` |
| 3 | [`scripts/generate-watermark-assets.js`](file:///d:/beritakarya-v.0.1/scripts/generate-watermark-assets.js) | 82 baris | Generator aset SVG watermark kartu pers/KTP. Seluruh file SVG hasilnya sudah tersimpan di `apps/api/src/assets/`. | `DELETE` |

---

## 4. File Build Lama yang Mengotori `packages/types/src/` (21 File)

Di dalam folder [`packages/types/src/`](file:///d:/beritakarya-v.0.1/packages/types/src/), terdapat **21 file kompilasi lokal lama** yang tercipta saat perintah `tsc` dijalankan sebelum konfigurasi `outDir: "dist"` aktif:

```
packages/types/src/article.js
packages/types/src/article.js.map
packages/types/src/article.d.ts.map
packages/types/src/block.js
packages/types/src/block.js.map
packages/types/src/block.d.ts.map
packages/types/src/category.js
packages/types/src/category.js.map
packages/types/src/category.d.ts.map
packages/types/src/index.js
packages/types/src/index.js.map
packages/types/src/index.d.ts.map
packages/types/src/pagination.js
packages/types/src/pagination.js.map
packages/types/src/pagination.d.ts.map
packages/types/src/site.js
packages/types/src/site.js.map
packages/types/src/site.d.ts.map
packages/types/src/user.js
packages/types/src/user.js.map
packages/types/src/user.d.ts.map
```
* **Status:** File-file ini sudah tertutup oleh `.gitignore` sehingga tidak terlacak Git, tetapi keberadaannya di disk fisik redundan karena output build resmi berada di `packages/types/dist/`.
* **Tindakan:** Aman dihapus dari disk lokal.

---

## 5. Komponen Dormant (PENTING: JANGAN DIHAPUS)

| File | Ukuran | Status & Catatan Penting |
|---|:---:|---|
| [`apps/web/components/ui/Grid.tsx`](file:///d:/beritakarya-v.0.1/apps/web/components/ui/Grid.tsx) | ~120 baris | 🟡 **DORMANT DESIGN PRIMITIVE** — Berisi primitive layout `<Grid>`, `<Stack>`, dan `<Spacer>` yang baru dibuat pada upgrade Design System (Juli 2026). Meskipun saat ini belum di-import oleh halaman publik, komponen ini disiapkan sebagai fondasi layout masa depan. **Disarankan untuk dipertahankan.** |

---

## 6. Rencana Eksekusi Pembersihan (Bash / PowerShell)

Jika seluruh temuan di atas telah Anda koreksi dan disetujui, berikut perintah penghapusan yang dapat dijalankan secara bertahap:

### Langkah 1: Hapus Dead Code Backend & Frontend
```bash
# Backend (apps/api)
rm apps/api/src/modules/kyc/kyc.repository.ts
rm apps/api/src/modules/site/site-category.service.ts
rm apps/api/src/modules/invitation/invitation.repository.ts
rm apps/api/src/modules/kyc/kyc.router.ts
rm apps/api/src/ai/usage.service.ts
rm apps/api/src/scripts/seed-quotas.ts

# Frontend (apps/web)
rm apps/web/components/ui/AdImageCropper.tsx
rm apps/web/components/layout/NavbarTicker.tsx
rm apps/web/components/dashboard/ads/AdsSubNav.tsx

# Scripts (opsional)
rm scripts/debug-categories.ts
rm scripts/gen-font-data.js
rm scripts/generate-watermark-assets.js
```

### Langkah 2: Bersihkan Build Lama di `packages/types/src/`
```bash
rm packages/types/src/*.js
rm packages/types/src/*.map
```

### Langkah 3: Validasi Ulang
Setelah penghapusan dilakukan, pastikan monorepo tetap 100% sehat dengan menjalankan:
```bash
pnpm type-check
pnpm test
```
