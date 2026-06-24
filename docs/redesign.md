# Redesign Dashboard Advertiser — BeritaKarya

Dokumentasi lengkap perubahan desain dashboard advertiser: sidebar, beranda, halaman iklan.

---

## Masalah Desain Lama

1. **Sidebar terlalu besar** — 256px untuk cuma 2 menu. Buang tempat.
2. **Beranda terlalu banyak teks** — "Fokus Hari Ini", "Ketersediaan Dashboard", "Alur 3 Langkah", "Sebelum Mulai" — pengiklan butuh aksi, bukan baca manual.
3. **Navigasi tidak intuitif** — Riwayat dan Bantuan tersembunyi di dalam halaman, bukan di sidebar.
4. **Header bar tidak relevan** — Search bar (untuk cari artikel?) dan Portal link tidak berguna untuk pengiklan.
5. **Stats terlalu banyak** — 4 stat card di halaman iklan terlalu ramai untuk pengiklan yang hanya ingin lihat performa.

---

## Prinsip Desain Baru

> **"Langsung jelas dalam 3 detik."**
> Pengiklan adalah pemilik bisnis, bukan teknisi. Mereka datang untuk: pasang iklan, lihat performa, selesai.

- **Kurangi teks**, perbanyak aksi
- **Sidebar icon-only** — hemat tempat, cukup untuk 4 menu
- **2 kartu aksi utama** di beranda — langsung jelas apa yang bisa dilakukan
- **2 stat card** di halaman iklan — cukup untuk ambil keputusan
- **Bantuan selalu terlihat** — WhatsApp satu klik

---

## 1. Sidebar — Icon-Only Default (72px)

### Sebelum (lama)
```
┌──────────────────────────────┐
│   [BK] BeritaKarya           │
│──────────────────────────────│
│  Portal Pengiklan            │
│  🏠 Beranda                  │
│  📢 Iklan & Banner           │
│                              │
│                              │
│  [👤] Nama User              │
│      Advertiser              │
│  [⏻ Keluar Sistem]          │
└──────────────────────────────┘
Width: 256px | 2 menu | Label "Iklan & Banner" ambigu
```

### Sesudah (baru)
```
COLLAPSED (72px)              EXPANDED (256px)
┌───────────┐                 ┌──────────────────────────┐
│   [BK]    │                 │   [BK] BeritaKarya       │
│───────────│                 │──────────────────────────│
│           │                 │  Portal Pengiklan        │
│  🏠  Beranda│               │  🏠  Beranda              │
│  📢  Iklan │                │  📢  Iklan Saya           │
│  📋  Riwayat│               │  📋  Riwayat              │
│  ❓  Bantuan│               │  ❓  Bantuan (WhatsApp)   │
│           │                 │                          │
│           │                 │                          │
│           │                 │                          │
│  [👤]     │                 │  [👤] Nama User           │
│  [⏻]     │                 │      Advertiser          │
│  [◀ Expand]│                │  [⏻ Keluar] [▶ Collapse]│
└───────────┘                 └──────────────────────────┘
Width: 72px                   Width: 256px
Default state                 Click toggle to expand
```

### Perubahan Detail

| Aspek | Lama | Baru |
|-------|------|------|
| Default state | Expanded (256px) | Collapsed (72px) |
| Jumlah menu | 2 | 4 |
| Menu | Beranda, Iklan & Banner | Beranda, Iklan Saya, Riwayat, Bantuan |
| Toggle button | Di header bar (ikon Menu) | Di bawah sidebar (ChevronLeft/Right) |
| State persistence | Tidak ada (reset setiap refresh) | localStorage `advertiser-sidebar-collapsed` |
| Tooltip on hover | Tidak ada | Muncul saat collapsed |
| "Bantuan" link | Tidak ada | Buka WhatsApp di tab baru |

### Behavior

- **Collapsed**: Icon-only, hover muncul tooltip (position: right). Klik navigasi langsung ke halaman.
- **Expanded**: Icon + label + section header. Toggle button di pojok bawah.
- **Persist**: State disimpan ke `localStorage`. Advertiser lain (editorial) tidak terpengaruh.
- **Mobile**: Tetap pakai hamburger overlay seperti sekarang. Tidak ada perubahan.

---

## 2. Beranda — Clean & Action-Oriented

### Sebelum (lama)
```
┌─────────────────────────────────────────────────────┐
│  [SELAMAT PAGI] [Advertiser] [24 Juni 2026]        │
│  Portal Mitra Pengiklan                             │
│  Nama User                                          │
│  Kelola pemasangan iklan untuk Pusat dari satu      │
│  dashboard yang lebih ringkas.                      │
│                                                     │
│  ┌─ Fokus Hari Ini ──────────────────────────────┐  │
│  │ Mulai dari pemesanan paket iklan yang tersedia│  │
│  │ Statistik akan muncul setelah booking aktif.  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Ketersediaan Dashboard ──────────────────────┐  │
│  │ ✅ Flow pemesanan tersedia                    │  │
│  │ 📊 Statistik tampil setelah booking aktif     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │ 🔴 Pasang Iklan  │ │ ⬜ Lihat Paket & │         │
│  │    Baru          │ │    Riwayat       │         │
│  └──────────────────┘ └──────────────────┘         │
│                                                     │
│  ┌─ Alur Yang Bisa Anda Kerjakan ───────────────┐  │
│  │ ┌────────┐ ┌────────┐ ┌────────┐             │  │
│  │ │ ①      │ │ ②      │ │ ③      │             │  │
│  │ │ Pilih  │ │ Siapkan│ │ Bayar &│             │  │
│  │ │ paket  │ │ materi │ │ tunggu │             │  │
│  │ └────────┘ └────────┘ └────────┘             │  │
│  │ [Mulai Pesan] [Buka Dashboard]               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Sebelum Mulai ──┐  ┌─ Butuh Bantuan? ──────┐  │
│  │ • Siapkan materi │  │ Untuk paket khusus...  │  │
│  │ • Cek paket      │  │ [💬 Hubungi Marketing] │  │
│  │ • Hubungi mkt    │  └───────────────────────┘  │
│  └──────────────────┘                              │
└─────────────────────────────────────────────────────┘
~400px tinggi | 7 section | Terlalu banyak teks
```

### Sesudah (baru)
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
│  │  Leaderboard Pusat     ● Aktif   12,450 imp  │  │
│  │  Banner Sidebar        ● Aktif    8,200 imp  │  │
│  │                                               │  │
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
~300px tinggi | 4 section | Langsung jelas
```

### Yang Dihapus

| Elemen | Alasan |
|--------|--------|
| Badge "Advertiser" | Sudah jelas dari sidebar & role |
| Badge tanggal | Tidak relevan untuk ambil keputusan |
| Box "Fokus Hari Ini" | Terlalu banyak teks, tidak actionable |
| Box "Ketersediaan Dashboard" | Redundan, tidak perlu dijelaskan |
| Section "Alur 3 Langkah" | Terlalu panjang, pengiklan tahu cara pasang iklan |
| Card "Sebelum Mulai" | Tips bisa dimasukkan ke halaman order |

### Yang Ditambahkan

| Elemen | Fungsi |
|--------|--------|
| Section "Kampanye Aktif" | Daftar booking aktif dengan impresi — langsung lihat performa |
| Link "Lihat Semua" | Navigasi cepat ke halaman riwayat |
| Card "Butuh Bantuan" | WhatsApp one-click, lebih menonjol |

---

## 3. Halaman Iklan — Simplified Stats

### Sebelum (lama)
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Total    │ │ Iklan    │ │ Total    │ │ Total    │
│ Kampanye │ │ Aktif    │ │ Impressi │ │ Klik     │
│    12    │ │    3     │ │  45,230  │ │  1,890   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
4 stat card — terlalu ramai, "Total Kampanye" & "Total Klik" kurang relevan
```

### Sesudah (baru)
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│  📢                         │ │  📊                         │
│  Iklan Aktif                │ │  Total Impressi             │
│                             │ │                             │
│  3 kampanye sedang tayang   │ │  45,230 tayangan            │
│                             │ │                             │
└─────────────────────────────┘ └─────────────────────────────┘
2 stat card besar — cukup untuk ambil keputusan
```

### Stat yang Dihapus

| Stat | Alasan Hapus |
|------|-------------|
| Total Kampanye | Termasuk yang non-aktif, kurang relevan |
| Total Klik | Bisa dilihat di grafik/detail per kampanye |

### Stat yang Dipertahankan

| Stat | Alasan |
|------|--------|
| Iklan Aktif | Langsung tahu berapa iklan yang sedang tayang |
| Total Impressi | Metrik utama untuk advertiser — berapa orang melihat iklan |

---

## 4. Sub-Navigation Ads — Lebih Clean

### Sebelum (lama)
```
[Overview] [Riwayat] [Pesan Baru]
```
Tab "Pesan Baru" redundant — sudah ada CTA di beranda & sidebar.

### Sesudah (baru)
```
[Overview] [Riwayat]
```
Cukup 2 tab. "Pesan Baru" diakses dari:
- Sidebar → Iklan Saya (lalu klik CTA)
- Beranda → kartu "Pasang Iklan Baru"
- Overview → CTA "Pesan Iklan Regional Baru"

---

## 5. Header Bar — Simplify for Advertiser

### Sebelum (lama)
```
┌─────────────────────────────────────────────────────────────┐
│ [☰ Toggle] [🔍 Cari artikel...]     [🌙] [🔔] [─] [🔗 Portal] │
└─────────────────────────────────────────────────────────────┘
Search bar & Portal link tidak relevan untuk advertiser
```

### Sesudah (baru)
```
┌─────────────────────────────────────────────────────────────┐
│ [☰ Toggle]                      [🌙] [🔔] [─] [👤] [⏻]   │
└─────────────────────────────────────────────────────────────┘
Minimal: toggle, theme, notifikasi, user menu, logout
```

### Yang Dihapus

| Elemen | Alasan |
|--------|--------|
| Search bar | Tidak ada artikel yang perlu dicari oleh advertiser |
| Portal link | Advertiser tidak perlu melihat frontend situs |

### Yang Dipertahankan

| Elemen | Fungsi |
|--------|--------|
| Toggle sidebar | Expand/collapse sidebar |
| Theme toggle | Dark/light mode |
| Notification bell | Notifikasi booking status |
| User avatar + name | Identitas user |

---

## Ringkasan Perubahan per File

| # | File | Perubahan |
|---|------|-----------|
| 1 | `layout.tsx` | Sidebar icon-only default (72px), 4 nav items, toggle di bawah, persist localStorage, header tanpa search & portal |
| 2 | `AdvertiserDashboardOverview.tsx` | Hapus 5 section teks, ganti 2 CTA card + kampanye aktif + bantuan |
| 3 | `AdvertiserAdsView.tsx` | 4 stat card → 2 stat card besar |
| 4 | `AdsSubNav.tsx` | 3 tab → 2 tab untuk advertiser |
| 5 | `ads/layout.tsx` | Header lebih ringkas untuk advertiser |

---

## Desain Tokens yang Digunakan

Semua token sudah ada di codebase, tidak perlu tambah baru:

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `brand-red` | `#B91C1C` / `#EF4444` | CTA button, active state, accent |
| `brand-black` | `#0F172A` / `#F8FAFC` | Text utama |
| `brand-text-muted` | `#64748B` / `#94A3B8` | Label, caption |
| `dash-card` | class | Semua kartu |
| `bg-slate-900` | sidebar bg | Sidebar background |
| `shadow-brand-red/30` | shadow | Active nav item glow |

---

## State Management

| State | Storage | Scope |
|-------|---------|-------|
| `advertiser-sidebar-collapsed` | localStorage | Per-browser, per-user |
| `theme` | localStorage | Sudah ada |
| `isMobileMenuOpen` | useState | Per-session (tidak perlu persist) |

---

## Responsive Behavior

| Breakpoint | Sidebar | Header | Content |
|------------|---------|--------|---------|
| < 768px (mobile) | Hidden, pakai hamburger overlay | Mobile navbar (sudah ada) | p-4 |
| ≥ 768px (desktop) | Icon-only 72px (collapsed) / 256px (expanded) | Tanpa search & portal | p-6 md:p-8 |

---

## Contoh Interaksi

### Scenario 1: Advertiser baru pertama kali login
1. Login → redirect ke `/pusat/dashboard`
2. Sidebar collapsed (72px) — icon-only, bersih
3. Beranda: langsung lihat 2 kartu besar "Pasang Iklan Baru" dan "Iklan Saya"
4. Klik "Pasang Iklan Baru" → masuk wizard order
5. Selesai order → kembali ke beranda, muncul kampanye aktif

### Scenario 2: Advertiser cek performa
1. Login → beranda tampil
2. Lihat section "Kampanye Aktif" — langsung tahu impresi
3. Klik "Lihat Semua" → masuk halaman riwayat
4. Atau klik "Iklan Saya" di sidebar → halaman overview dengan grafik

### Scenario 3: Advertiser butuh bantuan
1. Klik "Bantuan" di sidebar (ikon ❓)
2. Buka WhatsApp di tab baru
3. Chat dengan marketing

### Scenario 4: Advertiser expand sidebar
1. Klik tombol [◀] di bawah sidebar
2. Sidebar expand ke 256px dengan animasi smooth
3. Label menu muncul, section header muncul
4. Klik [▶] → collapse kembali
5. Refresh page → state tersimpan (collapsed/expanded)
