# Audit Report — `apps/web/components/`

**Tanggal:** 5 Juli 2026
**Scope:** Seluruh file `.tsx` di `apps/web/components/` (178 file)
**Metode:** Cross-reference import analysis — setiap file dicek apakah di-import oleh file lain.

---

## 1. Dead Code (15 file)

File yang **tidak di-import oleh file lain** di seluruh codebase.

### 1.1 `components/berita/` — 4 file

| # | File | Export | Terakhir Diubah | Keterangan |
|---|------|--------|-----------------|------------|
| 1 | `ArticleGalleryViewer.tsx` | `ArticleGalleryViewer` (named + default) | 6 Jun 2025 | Gallery viewer untuk artikel. Tidak ada yang import. |
| 2 | `MagazineBentoHero.tsx` | `MagazineBentoHero` (named) | 4 Jul 2025 | Bento hero layout. Tidak ada yang import. |
| 3 | `PremiumHero.tsx` | `PremiumHero` (named) | 22 Jun 2025 | Premium hero layout. Tidak ada yang import. |
| 4 | `ShareButtons.tsx` | `ShareButtons` (default) | 6 Jun 2025 | Share buttons. Digantikan oleh `ui/ArticleShareActions.tsx` yang aktif dipakai. |

### 1.2 `components/ui/` — 4 file

| # | File | Export | Terakhir Diubah | Keterangan |
|---|------|--------|-----------------|------------|
| 5 | `ArticleActions.tsx` | `ArticleActions` (default) | — | Article action buttons. Digantikan oleh `ArticleShareActions.tsx` yang dipakai di `MobileArticleTools` dan `ArticleFloatingTools`. |
| 6 | `FontSizeControl.tsx` | `FontSizeControl` (default) | — | Font size control widget. Tidak ada yang import. |
| 7 | `DateTimeWeather.tsx` | `DateTimeWeather` (default) | — | DateTime + weather widget. Tidak ada yang import. |
| 8 | `NewsletterForm.tsx` | `NewsletterForm` (default) | — | Newsletter subscription form. Tidak ada yang import. |
| 9 | `AuthorCard.tsx` | `AuthorCard` (default) | — | Author card component. Tidak ada yang import. |

### 1.3 `components/dashboard/ads/` — SKIP

Folder ini masih dalam pengembangan (belum 100% dikerjakan). Tidak di-sentuh dalam cleanup ini.

**Catatan:** Beberapa file di `studio/` (AdSmartPreview, StudioControls, StudioPreview, StudioSidebar, SectionHeader) dan `AdsSubNav.tsx` terdeteksi tidak di-import, tapi di-skip karena folder masih aktin dikerjakan.

---

## 2. Duplicate Functionality (1 pasang)

| File A | File B | Fungsi | Status |
|--------|--------|--------|--------|
| ~~`ui/ScrollAnimate.tsx`~~ | `ui/FadeInOnScroll.tsx` | Scroll-based fade-in animation | ✅ **Sudah dikonsolidasi** |

**Yang dilakukan:**
- 5 homepage files di-update: `ScrollAnimate` → `FadeInOnScroll`
- `ScrollAnimate.tsx` dihapus
- `FadeInOnScroll` dipakai oleh: 5 homepage files + AnimateGrid

### Alasan konsolidasi:

| Aspek | ScrollAnimate | FadeInOnScroll |
|-------|---------------|----------------|
| `prefers-reduced-motion` | ❌ | ✅ |
| `jsReady` hydration guard | ❌ | ✅ |
| Fallback check already visible | ❌ | ✅ |

---

## 3. Re-Export Pattern (Bukan Duplikat)

| File | Target | Keterangan |
|------|--------|------------|
| `pages/home/hero/MagazineCoverHero.tsx` | `berita/MagazineCoverHero.tsx` | Re-export satu baris. Pattern benar — hero folder punya wrapper untuk organisasi template. |

---

## 4. New Files (Belum Di-Integrasi)

File yang baru dibuat sebagai bagian dari design system upgrade, belum di-import oleh file lain.

| # | File | Fungsi | Siap Pakai |
|---|------|--------|------------|
| 1 | `ui/Typography.tsx` | 8 typography primitives (SectionTitle, SectionEyebrow, dll) | ✅ |
| 2 | `ui/Button.tsx` | 5 button variants (primary, secondary, dark, dashboard, dashboard-secondary) | ✅ |
| 3 | `ui/Grid.tsx` | Grid + Stack + Spacer layout primitives | ✅ |
| 4 | `ui/AnimateGrid.tsx` | Staggered entrance animation wrapper | ✅ |

---

## 5. Struktur Folder Summary

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

### File count by status:

| Status | Jumlah |
|--------|--------|
| ✅ Aktif dipakai | 155 |
| 🔴 Dead code (berita/ + ui/) | 9 ← dihapus |
| ⏭️ Skip (dashboard/ads/) | 6 ← tidak di-sentuh |
| 🟡 Duplicate functionality | ~~2 (1 pasang)~~ → ✅ dikonsolidasi |
| 🟢 New (belum integrasi) | 4 |
| **Total** | **176** → **165** (setelah cleanup) |

---

## 6. Rekomendasi Aksi

### Langsung (Safe to delete):

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

### Skip (masih dalam pengembangan):

- `dashboard/ads/` — tidak di-sentuh (6 file terdeteksi dead tapi folder belum selesai)

### Opsional (Perlu testing):

Konsolidasi `ScrollAnimate` → `FadeInOnScroll`:

1. Update 5 import di `pages/home/` files
2. Hapus `ui/ScrollAnimate.tsx`
3. Test homepage templates (A-F) untuk memastikan animasi tetap jalan

---

*Dokumen ini di-generate otomatis oleh audit pada 5 Juli 2026.*
