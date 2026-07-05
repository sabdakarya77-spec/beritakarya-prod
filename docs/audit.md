# Audit Reports — BeritaKarya

> Kumpulan audit codebase BeritaKarya.

---

## 1. Audit Advertiser Dashboard

> Tanggal verifikasi: 2026-07-01  
> Status: ✅ Terverifikasi langsung dari kode

---

### RINGKASAN: Mana yang BENAR, SEBAGIAN BENAR, dan SALAH

| # | Temuan Dokumen | Status Verifikasi | Catatan |
|---|---|---|---|
| 1 | Midtrans Sandbox hardcoded | ✅ BENAR | Line 61: `https://app.sandbox.midtrans.com/snap/snap.js` hardcoded |
| 2 | HOME_TOP Logo Upload Broken | ✅ BENAR | Line 250: `bookingPayload.logoUrl = null; // TODO: upload logo terpisah` |
| 3 | QRIS Placeholder | ✅ BENAR | Line 199–203: hanya render `<QrCode>` icon, tidak ada QR image nyata |
| 4 | History Page Raw Status | ⚠️ SEBAGIAN BENAR | Badge sudah berwarna tapi masih render `{b.status}` mentah (bukan label Indonesia) |
| 5 | Tidak Ada Cancel Booking | ✅ BENAR | Grep: tidak ada route `/cancel` di ad.controller.ts |
| 6 | Tidak Ada Edit Kreatif | ✅ BENAR | Grep: tidak ada route `/creative` PATCH di ad.controller.ts |
| 7 | Tidak Ada Invoice/Receipt PDF | ✅ BENAR | Tidak ada endpoint generate PDF di seluruh controller |
| 8 | Upgrade Advertiser Tanpa Approval | ✅ BENAR | Line 169–171: langsung `data: { role: 'advertiser' }` tanpa approval |
| 9 | Link Bantuan Nomor Palsu | ✅ BENAR | Line 318 & 487: `https://wa.me/628123456789` di dua tempat (desktop + mobile) |
| 10 | Sidebar Collapse Inconsistency | ✅ BENAR | Line 56: default `true` (collapsed). Sub-menu hanya muncul saat `!isSidebarCollapsed` |
| 11 | Stats Hanya ACTIVE Booking | ✅ BENAR | Line 45: `activeBookings = bookings.filter(b => b.status === 'ACTIVE')` |
| 12 | Duplikasi Admin/Advertiser Pages | ✅ BENAR | Dua path berbeda ada di filesystem |

---

### Detail Temuan yang BENAR

#### 🔴 #1 — Midtrans Sandbox Hardcoded
**File**: [`bookings/page.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/bookings/page.tsx#L61)
```typescript
// Line 61 — HARDCODED
script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
```
Tidak ada conditional berdasarkan `NODE_ENV`. Selalu sandbox.

---

#### 🔴 #2 — HOME_TOP Logo Upload Broken
**File**: [`StudioContext.tsx`](file:///d:/beritakarya-v.0.1/apps/web/components/dashboard/ads/studio/StudioContext.tsx#L250)
```typescript
// Line 250
bookingPayload.logoUrl = null; // TODO: upload logo terpisah
bookingPayload.fotoUrl = v.desktop?.url || null;
```
State `initialData` hanya punya satu field `adFile`. Tidak ada `logoFile` terpisah.

---

#### 🟡 #3 — QRIS Placeholder
**File**: [`bookings/page.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/bookings/page.tsx#L199)
```tsx
// Line 199–203 — Hanya ikon, bukan QR image
<div className="w-full aspect-square ...">
  <QrCode size={64} className="text-gray-300 mx-auto mb-2" />
  <p>Scan untuk membayar</p>
</div>
```

---

#### ⚠️ #4 — History Page Status — SEBAGIAN BENAR
**File**: [`history/page.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/history/page.tsx#L104)

Badge sudah punya warna (amber/green/red) **tapi teks masih raw**:
```tsx
// Line 110 — render raw enum string
<span className={cn(...)}>{b.status}</span>  // "PENDING_REVIEW", bukan "Menunggu Review"
// Line 119
<span className={cn(...)}>{b.paymentStatus}</span>  // "VERIFYING", bukan "Menunggu Verifikasi"
```
Kolom `COMPLETED` juga tidak punya warna (fallback gray).

---

#### 🟡 #5 — Tidak Ada Cancel Booking
Grep di `ad.controller.ts` → **0 hasil** untuk route `/cancel`.
Tidak ada endpoint `POST /ads/bookings/:id/cancel`.

---

#### 🟡 #6 — Tidak Ada Edit Kreatif
Grep di `ad.controller.ts` → **0 hasil** untuk route `/creative` PATCH.
Tidak ada endpoint `PATCH /ads/bookings/:id/creative`.

---

#### 🟡 #8 — Upgrade Advertiser Tanpa Approval
**File**: [`auth.controller.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/auth/auth.controller.ts#L158)
```typescript
// Line 169–171 — Langsung update role tanpa approval
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { role: 'advertiser' },  // Langsung, tanpa review
})
```

---

#### 🟡 #9 — Link Bantuan Nomor Palsu
**File**: [`layout.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/layout.tsx#L318)
- Line 318: desktop sidebar
- Line 487: mobile menu overlay
Keduanya pakai `https://wa.me/628123456789`.

---

#### 🟢 #10 — Sidebar Collapse Default True
**File**: [`layout.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/layout.tsx#L56)
```typescript
// Line 56: default collapsed = true
return saved !== null ? saved === 'true' : true
```
Sub-menu "Iklan Saya" hanya render saat `!isSidebarCollapsed && isExpanded` (line 230).

---

#### 🟢 #11 — Stats Hanya ACTIVE
**File**: [`AdvertiserAdsView.tsx`](file:///d:/beritakarya-v.0.1/apps/web/components/dashboard/ads/AdvertiserAdsView.tsx#L45)
```typescript
// Line 45
const activeBookings = bookings.filter(b => b.status === 'ACTIVE');

// Line 49: hanya fetch stats untuk active bookings
if (activeBookings.length === 0) return;
```
Booking `COMPLETED` tidak di-fetch stats-nya.

---

### Temuan Tambahan (Tidak ada di Dokumen)

#### ⚠️ BARU — `bookings/pay` Hanya Accept `PENDING`
**File**: [`ad.controller.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/ad/ad.controller.ts#L409)
```typescript
// Line 409
if (existing.paymentStatus !== 'PENDING') {
  return res.status(400).json({ ... 'Bukti bayar sudah diupload atau booking sudah diproses' })
}
```
Frontend menampilkan tombol upload untuk status `REJECTED` juga (line 280 bookings/page.tsx), tapi backend **menolak** request jika bukan `PENDING`. Ini bug mismatch FE ↔ BE.

---

### Prioritas Perbaikan (Final)

#### 🔴 HIGH (Fix sekarang)
1. **Midtrans sandbox URL** → gunakan env var
2. **HOME_TOP logoUrl = null** → pisahkan state & upload logo
3. **FE/BE mismatch `pay` endpoint** → BE perlu accept `REJECTED` juga (atau FE hapus tombol untuk REJECTED)

#### 🟡 MEDIUM
4. **QRIS placeholder** → tampilkan QR image statis atau dari env
5. **History status raw string** → tambah label Indonesia
6. **Cancel booking endpoint** → backend + frontend
7. **Nomor WA palsu** → ganti dengan nomor nyata dari config
8. **Upgrade tanpa approval** → tambah flow review

#### 🟢 LOW
9. **Sidebar default expanded** → ubah default ke `false` (collapsed)
10. **Stats include COMPLETED** → ubah filter di AdvertiserAdsView
11. **Edit kreatif post-submit** → endpoint baru
12. **Invoice PDF** → generate di backend

---

## 2. Audit apps/web Components

**Tanggal:** 5 Juli 2026
**Scope:** Seluruh file `.tsx` di `apps/web/components/` (178 file)
**Metode:** Cross-reference import analysis — setiap file dicek apakah di-import oleh file lain.

---

### 2.1 Dead Code (15 file)

File yang **tidak di-import oleh file lain** di seluruh codebase.

#### `components/berita/` — 4 file

| # | File | Export | Terakhir Diubah | Keterangan |
|---|------|--------|-----------------|------------|
| 1 | `ArticleGalleryViewer.tsx` | `ArticleGalleryViewer` (named + default) | 6 Jun 2025 | Gallery viewer untuk artikel. Tidak ada yang import. |
| 2 | `MagazineBentoHero.tsx` | `MagazineBentoHero` (named) | 4 Jul 2025 | Bento hero layout. Tidak ada yang import. |
| 3 | `PremiumHero.tsx` | `PremiumHero` (named) | 22 Jun 2025 | Premium hero layout. Tidak ada yang import. |
| 4 | `ShareButtons.tsx` | `ShareButtons` (default) | 6 Jun 2025 | Share buttons. Digantikan oleh `ui/ArticleShareActions.tsx` yang aktif dipakai. |

#### `components/ui/` — 4 file

| # | File | Export | Terakhir Diubah | Keterangan |
|---|------|--------|-----------------|------------|
| 5 | `ArticleActions.tsx` | `ArticleActions` (default) | — | Article action buttons. Digantikan oleh `ArticleShareActions.tsx` yang dipakai di `MobileArticleTools` dan `ArticleFloatingTools`. |
| 6 | `FontSizeControl.tsx` | `FontSizeControl` (default) | — | Font size control widget. Tidak ada yang import. |
| 7 | `DateTimeWeather.tsx` | `DateTimeWeather` (default) | — | DateTime + weather widget. Tidak ada yang import. |
| 8 | `NewsletterForm.tsx` | `NewsletterForm` (default) | — | Newsletter subscription form. Tidak ada yang import. |
| 9 | `AuthorCard.tsx` | `AuthorCard` (default) | — | Author card component. Tidak ada yang import. |

#### `components/dashboard/ads/` — SKIP

Folder ini masih dalam pengembangan (belum 100% dikerjakan). Tidak di-sentuh dalam cleanup ini.

**Catatan:** Beberapa file di `studio/` (AdSmartPreview, StudioControls, StudioPreview, StudioSidebar, SectionHeader) dan `AdsSubNav.tsx` terdeteksi tidak di-import, tapi di-skip karena folder masih aktin dikerjakan.

---

### 2.2 Duplicate Functionality (1 pasang)

| File A | File B | Fungsi | Status |
|--------|--------|--------|--------|
| ~~`ui/ScrollAnimate.tsx`~~ | `ui/FadeInOnScroll.tsx` | Scroll-based fade-in animation | ✅ **Sudah dikonsolidasi** |

**Yang dilakukan:**
- 5 homepage files di-update: `ScrollAnimate` → `FadeInOnScroll`
- `ScrollAnimate.tsx` dihapus
- `FadeInOnScroll` dipakai oleh: 5 homepage files + AnimateGrid

#### Alasan konsolidasi:

| Aspek | ScrollAnimate | FadeInOnScroll |
|-------|---------------|----------------|
| `prefers-reduced-motion` | ❌ | ✅ |
| `jsReady` hydration guard | ❌ | ✅ |
| Fallback check already visible | ❌ | ✅ |

---

### 2.3 Re-Export Pattern (Bukan Duplikat)

| File | Target | Keterangan |
|------|--------|------------|
| `pages/home/hero/MagazineCoverHero.tsx` | `berita/MagazineCoverHero.tsx` | Re-export satu baris. Pattern benar — hero folder punya wrapper untuk organisasi template. |

---

### 2.4 New Files (Belum Di-Integrasi)

File yang baru dibuat sebagai bagian dari design system upgrade, belum di-import oleh file lain.

| # | File | Fungsi | Siap Pakai |
|---|------|--------|------------|
| 1 | `ui/Typography.tsx` | 8 typography primitives (SectionTitle, SectionEyebrow, dll) | ✅ |
| 2 | `ui/Button.tsx` | 5 button variants (primary, secondary, dark, dashboard, dashboard-secondary) | ✅ |
| 3 | `ui/Grid.tsx` | Grid + Stack + Spacer layout primitives | ✅ |
| 4 | `ui/AnimateGrid.tsx` | Staggered entrance animation wrapper | ✅ |

---

### 2.5 Struktur Folder Summary

```
components/
├── admin/           → 1 file (AIDashboard) ✅ dipakai
├── AuthInit.tsx     → ✅ dipakai (app/layout + dashboard/layout)
├── berita/          → 5 file, 4 DEAD ❌
├── dashboard/       → ~40 file, 6 DEAD ❌ (ads/studio/)
├── editor/          → ~25 file ✅ semua dipakai
├── layout/          → 9 file ✅ semua dipakai
├── legal/           → 4 file ✅ semua dipakai
├── marketing/       → 1 file ✅ dipakai
├── pages/home/      → ~30 file ✅ semua dipakai
├── pwa/             → 1 file ✅ dipakai
└── ui/              → 40+ file, 5 DEAD ❌
```

#### File count by status:

| Status | Jumlah |
|--------|--------|
| ✅ Aktif dipakai | 155 |
| 🔴 Dead code (berita/ + ui/) | 9 ← dihapus |
| ⏭️ Skip (dashboard/ads/) | 6 ← tidak di-sentuh |
| 🟡 Duplicate functionality | ~~2 (1 pasang)~~ → ✅ dikonsolidasi |
| 🟢 New (belum integrasi) | 4 |
| **Total** | **176** → **165** (setelah cleanup) |

---

### 2.6 Rekomendasi Aksi

#### Langsung (Safe to delete):

Hapus 9 dead code files (berita/ + ui/):

```bash
# berita/ — 4 file
rm components/berita/ArticleGalleryViewer.tsx
rm components/berita/MagazineBentoHero.tsx
rm components/berita/PremiumHero.tsx
rm components/berita/ShareButtons.tsx

# ui/ — 5 file
rm components/ui/ArticleActions.tsx
rm components/ui/FontSizeControl.tsx
rm components/ui/DateTimeWeather.tsx
rm components/ui/NewsletterForm.tsx
rm components/ui/AuthorCard.tsx
```

#### Skip (masih dalam pengembangan):

- `dashboard/ads/` — tidak di-sentuh (6 file terdeteksi dead tapi folder belum selesai)

#### Opsional (Perlu testing):

Konsolidasi `ScrollAnimate` → `FadeInOnScroll`:

1. Update 5 import di `pages/home/` files
2. Hapus `ui/ScrollAnimate.tsx`
3. Test homepage templates (A-F) untuk memastikan animasi tetap jalan

---

*Dokumen ini di-generate otomatis oleh audit pada 5 Juli 2026.*
