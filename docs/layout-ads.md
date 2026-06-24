# Layout Dashboard Advertiser — BeritaKarya

Dokumentasi layout dashboard khusus pengiklan (role `advertiser`).

---

## Struktur Sidebar

Sidebar advertiser menggunakan **icon-only mode** (72px) sebagai default. Bisa di-expand ke 256px.

### Collapsed (default, 72px)

```
┌───────────┐
│   [BK]    │
│───────────│
│           │
│  🏠       │  ← hover muncul tooltip "Beranda"
│  📢       │  ← hover muncul tooltip "Iklan Saya"
│  📋       │  ← hover muncul tooltip "Riwayat"
│  ❓       │  ← hover muncul tooltip "Bantuan"
│           │
│           │
│  [👤]     │
│  [⏻] [▶] │  ← keluar / expand sidebar
└───────────┘
```

### Expanded (256px)

```
┌──────────────────────────┐
│   [BK] BeritaKarya       │
│──────────────────────────│
│  Portal Pengiklan        │
│  🏠  Beranda              │
│  📢  Iklan Saya           │
│  📋  Riwayat              │
│  ❓  Bantuan (WhatsApp)   │
│                          │
│                          │
│  [👤] Nama User           │
│      Advertiser          │
│  [⏻ Keluar] [◀]        │
└──────────────────────────┘
```

| Menu | Link | Ikon | Keterangan |
|------|------|------|------------|
| Beranda | `/{site}/dashboard` | `LayoutDashboard` | Halaman utama advertiser |
| Iklan Saya | `/{site}/dashboard/ads` | `Megaphone` | Overview iklan & grafik |
| Riwayat | `/{site}/dashboard/ads/history` | `History` | Daftar booking & performa |
| Bantuan | `https://wa.me/628123456789` | `HelpCircle` | WhatsApp marketing (tab baru) |

**Behavior:**
- Default collapsed (72px), icon-only
- Hover icon → muncul tooltip nama menu
- Klik tombol [▶] / [◀] di bawah → expand/collapse
- State disimpan ke `localStorage` (`advertiser-sidebar-collapsed`)
- Mobile: hamburger overlay (tidak berubah)

---

## Header Bar

Header bar untuk advertiser **lebih minimalis** — tanpa search bar dan portal link:

```
┌──────────────────────────────────────────────┐
│                          [🌙] [🔔] [👤] [⏻] │
└──────────────────────────────────────────────┘
```

| Elemen | Keterangan |
|--------|-----------|
| Theme toggle | Dark/light mode |
| Notification Bell | Notifikasi status booking |
| User avatar | Identitas user |

---

## Halaman 1 — Beranda (`/{site}/dashboard`)

Komponen: `AdvertiserDashboardOverview`

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Selamat Pagi, Budi 👋                              │
│  Kelola iklan Anda di Pusat                         │
│                                                     │
│  ┌─────────────────────────┐ ┌─────────────────────┐│
│  │                         │ │                     ││
│  │    📢                   │ │    📊               ││
│  │                         │ │                     ││
│  │    Pasang Iklan Baru    │ │    Iklan Saya       ││
│  │                         │ │                     ││
│  │    Pilih paket & mulai  │ │    3 kampanye aktif ││
│  │    kampanye iklan Anda  │ │    Lihat performa   ││
│  │                         │ │    & riwayat        ││
│  │    [Mulai →]            │ │    [Lihat →]        ││
│  │                         │ │                     ││
│  └─────────────────────────┘ └─────────────────────┘│
│                                                     │
│  ┌─ Kampanye Aktif ──────────────────────────────┐  │
│  │                                               │  │
│  │  ● Leaderboard Pusat      12,450 imp         │  │
│  │  ● Banner Sidebar          8,200 imp         │  │
│  │                                               │  │
│  │  Total: 20,650 impresi dari 2 kampanye        │  │
│  │  [Lihat Semua →]                             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Butuh Bantuan? ──────────────────────────────┐  │
│  │  Hubungi tim marketing untuk paket khusus,    │  │
│  │  kerja sama tahunan, atau kendala booking.    │  │
│  │  [💬 Chat WhatsApp]                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Elemen utama:**
- Sapaan + nama user + nama site
- 2 kartu CTA besar: "Pasang Iklan Baru" (merah) dan "Iklan Saya" (putih)
- Section "Kampanye Aktif" — daftar booking aktif dengan impresi (muncul jika ada)
- Card "Butuh Bantuan?" — tombol WhatsApp langsung

---

## Halaman 2 — Ads Overview (`/{site}/dashboard/ads`)

Komponen: `AdvertiserAdsView`

```
┌─────────────────────────────────────────────────────┐
│  📢 Iklan Saya                                      │
│  pusat                                              │
│                                                     │
│  [Overview] [Riwayat]                               │
│  ─────────────────────                              │
│                                                     │
│  ┌─────────────────────────┐ ┌─────────────────────┐│
│  │  📢                     │ │  📊                 ││
│  │  Iklan Aktif            │ │  Total Impresi      ││
│  │                         │ │                     ││
│  │  3                      │ │  45,230             ││
│  │  kampanye sedang tayang │ │  tayangan keseluruhan││
│  └─────────────────────────┘ └─────────────────────┘│
│                                                     │
│  ┌─ Pesan Iklan Regional Baru ────────────────────┐ │
│  │ 🔴 Pilih paket, unggah materi, kirim bukti     │ │
│  │                               [Mulai →]        │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Performa Kampanye ─── [7h] [14h] [30h] ──────┐ │
│  │  ┌───────────────────────────────────────────┐ │ │
│  │  │  ╭─╮     ╭─╮                             │ │ │
│  │  │ ╭╯ ╰─╮╭─╯ ╰─╮  ← Impressi              │ │ │
│  │  │╭╯    ╰╯     ╰╮                           │ │ │
│  │  │╰──────╮       ╰── ← Klik                 │ │ │
│  │  │       ╰──────╮                             │ │ │
│  │  │              ╰──                           │ │ │
│  │  └───────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Perbandingan Kampanye ── CTR Rata: 4.2% ─────┐ │
│  │ Leaderboard    12,000 imp  480 click  4.0%     │ │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░ (imp)   │ │
│  │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (click) │ │
│  │                                                │ │
│  │ Banner         8,500 imp   320 click  3.8%     │ │
│  │ ██████████████░░░░░░░░░░░░░░░░░░░░░░░ (imp)   │ │
│  │ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (click) │ │
│  │ [■ Impressi] [■ Klik]                          │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Elemen utama:**
- 2 stat card besar: Iklan Aktif, Total Impresi
- CTA "Pesan Iklan Regional Baru"
- Grafik performa time-series dengan filter 7/14/30 hari
- Perbandingan Kampanye — bar chart horizontal dengan CTR

---

## Halaman 3 — Order Iklan (`/{site}/dashboard/ads/order`)

Flow wizard pemesanan 4 langkah.

```
┌─────────────────────────────────────────────────────┐
│  [← Kembali]                                        │
│                                                     │
│  ① Pilih Paket → ② Detail → ③ Upload → ④ Bayar    │
│     ● Aktif        ○          ○          ○          │
│                                                     │
│  ┌─ Pilih Paket Iklan ────────────────────────────┐ │
│  │ ┌─────────────────┐ ┌─────────────────┐        │ │
│  │ │ 🏆 Leaderboard  │ │ 🖼️ Banner        │        │ │
│  │ │ 728×90 px       │ │ 300×250 px       │        │ │
│  │ │ 30 hari         │ │ 14 hari          │        │ │
│  │ │ Rp 2.500.000    │ │ Rp 1.200.000     │        │ │
│  │ │ [Pilih →]       │ │ [Pilih →]        │        │ │
│  │ └─────────────────┘ └─────────────────┘        │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  Step 2: Nama Kampanye [____] URL [____]            │
│          Tipe: ○ Gambar  ○ Video                    │
│                                                     │
│  Step 3: ┌─ Upload Materi ───────────────────────┐  │
│          │ Desktop  [📁 Upload 728×90]           │  │
│          │ Tablet   [📁 Upload 768×102]          │  │
│          │ Mobile   [📁 Upload 320×50]           │  │
│          └───────────────────────────────────────┘  │
│                                                     │
│  Step 4: ┌─ Pembayaran ──────────────────────────┐  │
│          │ Transfer: BCA 1234567890 a.n. PT BK   │  │
│          │ [📷 Upload Bukti] [✅ Submit]           │  │
│          └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Halaman 4 — Riwayat Booking (`/{site}/dashboard/ads/history`)

```
┌─────────────────────────────────────────────────────┐
│  Riwayat Booking & Performa                   [🔄] │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Paket          │ Site  │ Status    │ Imp      │  │
│  │────────────────│───────│───────────│──────────│  │
│  │ Leaderboard    │ pusat │ ✅ PAID   │ 12,000   │  │
│  │ Banner 300     │ pusat │ 🔵 VERIF. │  8,500   │  │
│  │ Native Ad      │ pusat │ ✅ PAID   │  6,200   │  │
│  │ Interstitial   │ pusat │ 🟡 PENDING│      0   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Status: 🟢 PAID  🔵 VERIFYING  🟡 PENDING  🔴 REJECT │
└─────────────────────────────────────────────────────┘
```

---

## Sub-Navigation Ads

Untuk advertiser, hanya 2 tab:

| Tab | Keterangan |
|-----|-----------|
| Overview | Statistik & grafik performa |
| Riwayat | Daftar booking & status |

Tab **Slot Iklan**, **Paket**, dan **Booking** hanya untuk superadmin/wapimred.

"Pesan Baru" diakses dari sidebar atau CTA di beranda/overview.

---

## Halaman yang TIDAK Bisa Diakses Advertiser

| Halaman | Alasan |
|---------|--------|
| `/dashboard/articles` | Hanya untuk role editorial |
| `/dashboard/media` | Hanya untuk role editorial |
| `/dashboard/review` | Hanya superadmin & wapimred |
| `/dashboard/kyc` | Hanya role editorial |
| `/dashboard/categories` | Hanya superadmin |
| `/dashboard/comments` | Hanya superadmin & wapimred |
| `/dashboard/team` | Hanya superadmin & wapimred |
| `/dashboard/users` | Hanya superadmin & wapimred |
| `/dashboard/invitations` | Hanya superadmin & wapimred |
| `/dashboard/settings` | Hanya superadmin & wapimred |
| `/dashboard/audit` | Hanya superadmin |
| `/dashboard/admin` | Hanya superadmin |

---

## Referensi Kode

| Komponen | Path |
|----------|------|
| Dashboard Overview | `apps/web/components/dashboard/AdvertiserDashboardOverview.tsx` |
| Ads View | `apps/web/components/dashboard/ads/AdvertiserAdsView.tsx` |
| Performance Chart | `apps/web/components/dashboard/ads/AdPerformanceChart.tsx` |
| Order Page | `apps/web/app/[site]/dashboard/ads/order/page.tsx` |
| History Page | `apps/web/app/[site]/dashboard/ads/history/page.tsx` |
| Ads Overview Page | `apps/web/app/[site]/dashboard/ads/page.tsx` |
| Ads Sub Nav | `apps/web/components/dashboard/ads/AdsSubNav.tsx` |
| Ads Layout | `apps/web/app/[site]/dashboard/ads/layout.tsx` |
| Layout (sidebar) | `apps/web/app/[site]/dashboard/layout.tsx` |
| Role definitions | `packages/config/src/roles.ts` |
