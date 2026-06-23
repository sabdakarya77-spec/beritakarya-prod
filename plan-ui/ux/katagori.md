# Plan: UI/UX Improvement — Dashboard Categories

> **Revised:** 2026-06-23 — Disesuaikan dengan kondisi aktual halaman `[site]/dashboard/categories/page.tsx`

## Problem Statement

Halaman `[site]/dashboard/categories` memiliki scroll yang terlalu panjang baik di desktop maupun mobile. Dengan 10+ parent categories dan masing-masing 5+ subcategories (plus sub-subkategori level 3), halaman bisa mencapai 3000-4000px tinggi, menyulitkan navigasi dan manajemen.

## Struktur Halaman Aktual

### Layout Utama

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: "Menu Kategori & Rubrikasi"                             │
│ [✨ Muat Default] [🔄 Sync dari Global*] [📍 Site View / 🌐 Global] │
│ [📦 Migrasi ke Lokal**] [Superadmin Mode info***]               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────┬──────────────────────────────────────────────┐
│ Form (col-4)     │ Category List (col-8)                        │
│ - Nama           │ - Grid 2 kolom (md:grid-cols-2)              │
│ - Slug (auto)    │ - Parent card dengan 3 bagian:               │
│ - Parent (select)│   Header → Body (sub chips) → Footer         │
│ - Order (auto)   │ - Sub-subkategori level 3 (indented)         │
│ - Warna (auto)   │ - Hierarchical code display                  │
│ - Tips box       │                                              │
└──────────────────┴──────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ Summary Footer: "Parent: 10 Rubrik | Sub-Kategori: 45 Rubrik"  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ Delete Confirmation Modal (conditional)                         │
└─────────────────────────────────────────────────────────────────┘
```

*Tombol Sync hanya muncul di Site View*
**Tombol Migrasi hanya muncul di Global View*
***Info box hanya muncul di Global View, hidden di mobile*

### State yang Ada

| State | Tipe | Fungsi |
|-------|------|--------|
| `categories` | `Category[]` | Data tree kategori dari API |
| `name`, `slug` | `string` | Form input |
| `parentId` | `string` | Parent selection di form |
| `order` | `string` | Urutan (auto-calculate untuk baru, manual untuk edit) |
| `editingCategory` | `Category \| null` | Mode edit vs tambah |
| `loading` | `boolean` | Loading state form submission |
| `isGlobalView` | `boolean` | Toggle Site View ↔ Global View |
| `toast` | `{message, type} \| null` | Toast notification |
| `deleteConfirm` | `Category \| null` | Modal konfirmasi hapus |
| `migrating` | `boolean` | Loading state migrasi |
| `syncing` | `boolean` | Loading state sync |

### Header Action Buttons

```
┌──────────────────────────────────────────────────────────────────────┐
│ [✨ Muat Default]  [🔄 Sync dari Global]  [📍 Site View / 🌐 Global] │
│                                                                      │
│ (Global View only):                                                   │
│ [Superadmin Mode: Mengelola kategori global / lintas situs.]         │
│ [📦 Migrasi ke Lokal]                                                │
└──────────────────────────────────────────────────────────────────────┘
```

- **Muat Default**: Seed kategori default dari `CATEGORIES_CONFIG` ke database
- **Sync dari Global**: Tambah kategori baru dari global ke lokal (tidak mengubah yang sudah ada)
- **Migrasi ke Lokal**: Copy semua kategori global ke lokal per site + re-map artikel (sekali jalan)
- **Site/Global Toggle**: Ubah view antara kategori lokal site dan kategori global

### Form (col-4)

```
┌────────────────────────────────────────────┐
│ Tambah Baru / Edit Kategori     [BATAL*]   │
├────────────────────────────────────────────┤
│ Nama Kategori / Rubrik                     │
│ [________________________]                 │
│                                            │
│ Slug URL / Identifier                      │
│ [/_______________________] (auto-generate) │
│ "URL-friendly. Terbentuk otomatis..."      │
│                                            │
│ Kategori Induk (Parent Menu)               │
│ [Pilih induk...                     ▼]     │
│ "Pilih induk untuk menjadikan..."          │
│                                            │
│ ┌─ Urutan (Otomatis) ─┬─ Warna Otomatis ─┐│
│ │ 3  Kode: 1.2.3      │ [███ Olahraga]   ││
│ └──────────────────────┴──────────────────┘│
│                                            │
│ [████████████ Simpan ████████████]         │
└────────────────────────────────────────────┘
│ 💡 Tips Struktur Navigasi:                 │
│ Urutan (Order) menentukan posisi dari...   │
│ Warna kategori ditentukan otomatis...      │
└────────────────────────────────────────────┘
```

*Tombol BATAL hanya muncul saat mode edit*

**Fitur otomatis:**
- **Slug**: Auto-generate dari nama (lowercase, dash-separated) — useEffect line 114-121
- **Order**: Auto-calculate dari jumlah siblings (count + 1) — useEffect line 124-146
- **Warna**: Preview dari `getCategoryColor(name)` — read-only
- **Hierarchical Code**: Preview gabungan parent code + order — computed line 336-341

### Category Card (Detail)

```
┌──────────────────────────────────────────────────────────────┐
│ CARD HEADER (p-4 sm:p-5, border-b)                          │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [1] Terbaru           [SITE/🌐 Global]    [✏️] [🗑️]     │ │
│ │ [███ Terbaru]  Urutan: 1                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ CARD BODY (p-4 sm:p-5)                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ SUB KATEGORI                                             │ │
│ │                                                          │ │
│ │ [1.1 Politik]     [➕ ✏️ 🗑️]                            │ │
│ │   [1.1.1 Pilkada] [✏️ 🗑️]     ← sub-sub (level 3)     │ │
│ │   [1.1.2 Pemilu]  [✏️ 🗑️]     ← sub-sub (level 3)     │ │
│ │                                                          │ │
│ │ [1.2 Ekonomi]     [➕ ✏️ 🗑️]                            │ │
│ │                                                          │ │
│ │ "Belum ada sub-kategori." (jika kosong)                  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ CARD FOOTER (px-4 py-3, bg-gray-50, border-t)              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 12 Sub                          [+ Tambah Sub]           │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Kode hierarkis:**
- Site View: Sequential index (1, 1.1, 1.1.1) — `parentIdx + 1`
- Global View: Stored order value (3, 3.2, 3.2.1) — `item.order`
- Sub-subkategori (level 3): Indented `ml-4`, chip lebih kecil, action buttons muncul on hover

### Summary Footer

```
┌──────────────────────────────────────────────────────────────┐
│ Parent: 10 Rubrik  |  Sub-Kategori: 45 Rubrik               │
│ 🌐 Global View ON (Mengelola semua rubrik)*                 │
└──────────────────────────────────────────────────────────────┘
```

*Info Global View hanya tampil di Global View mode*

### Delete Confirmation Modal

```
┌────────────────────────────────────────────┐
│ Hapus Kategori?                            │
│                                            │
│ Apakah Anda yakin ingin menghapus rubrik   │
│ "Terbaru"? Jika rubrik ini adalah kategori │
│ utama, semua relasi sub-kategori di bawah  │
│ akan kehilangan induknya.                  │
│                                            │
│                    [Batal] [Ya, Hapus]      │
└────────────────────────────────────────────┘
```

### Empty State

```
┌────────────────────────────────────────────┐
│              📂                            │
│     BELUM ADA KATEGORI                     │
│                                            │
│ Mulai dengan menambahkan kategori baru     │
│ melalui form di samping, atau langsung     │
│ muat seluruh kategori bawaan (default).    │
│                                            │
│       [✨ Muat Kategori Default]           │
└────────────────────────────────────────────┘
```

---

## Root Cause Analysis

| Elemen | Kontribusi Scroll | Catatan |
|--------|-------------------|---------|
| Header + Action Buttons | ~140px | Selalu tampil, lebih tinggi dari asumsi lama karena ada tombol Sync/Migrate |
| Form (col-4) | ~500px | Selalu tampil penuh, termasuk color preview + hierarchical code preview + tips box |
| Tips box | ~80px | Lebih kecil dari asumsi lama |
| Setiap parent card header | ~80px | Badge + action buttons + color tag |
| Setiap parent card body | ~100-400px | Tergantung jumlah sub + sub-sub |
| Setiap sub-subkategori (level 3) | +30px per item | Indented, chip kecil, menambah tinggi card |
| Card footer | ~40px | Sub count + "Tambah Sub" button |
| Summary footer | ~50px | Konstan |
| Delete modal | 0px | Overlay, tidak menambah scroll |

**Estimasi total:** 10 parent × avg 350px = ~3500px + form + header = **~4200px**

> Catatan: Estimasi lebih tinggi dari versi lama karena sekarang memperhitungkan sub-subkategori level 3 dan card 3-bagian.

---

## Proposed Solutions

### Phase 1: Accordion Collapse (Priority: Tinggi)

**Tujuan:** Kurangi scroll dari ~4200px → ~800px

**Implementasi:**
- Tambah state `expandedIds: Set<string>` untuk track card yang terbuka
- Default: semua card **collapsed** (hanya tampil card header)
- Klik card header untuk expand/collapse
- Tombol expand/collapse indicator (▶ / ▼) di kanan card header
- Saat collapsed, tampilkan sub count badge di header

**Collapsed State:**
```
┌──────────────────────────────────────────────────────────────┐
│ [1] Terbaru    [SITE]    12 Sub    [███]   ✏️ 🗑️         ▼ │
└──────────────────────────────────────────────────────────────┘
```

**Expanded State:**
```
┌──────────────────────────────────────────────────────────────┐
│ [3] Daerah    [PUSAT]    5 Sub    [███]   ✏️ 🗑️          ▶ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ SUB KATEGORI                                             │ │
│ │ [3.1 Jawa Timur]        ➕ ✏️ 🗑️                        │ │
│ │ [3.2 Jawa Tengah]       ➕ ✏️ 🗑️                        │ │
│ │   ↳ [3.2.1 Semarang]   ✏️ 🗑️                           │ │
│ │   ↳ [3.2.2 Solo]       ✏️ 🗑️                           │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 5 Sub                                    [+ Tambah Sub]      │
└──────────────────────────────────────────────────────────────┘
```

**Files:**
- `apps/web/app/[site]/dashboard/categories/page.tsx`

**Changes:**
1. Tambah state: `const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())`
2. Tambah toggle function: `toggleExpand(id: string)`
3. Wrap card body + footer dalam conditional `{expandedIds.has(parent.id) && (...)}`
4. Pindahkan sub count badge ("12 Sub") dari footer ke card header (visible saat collapsed)
5. Tambah expand/collapse indicator (▶ / ▼) di card header
6. Pertahankan hierarchical code display di collapsed state

**Perhatian:**
- Tombol "➕" di sub-subkategori harus tetap berfungsi saat expanded
- Mode edit harus auto-expand card yang relevan
- Pastikan `startEdit()` dan `handleDeleteRequest()` tetap berfungsi di collapsed state

---

### Phase 2: Compact Form (Priority: Sedang)

**Tujuan:** Kurangi form height dari ~500px → ~60px (collapsed) atau ~350px (expanded)

**Implementasi:**
- Form di-collapse menjadi **floating action bar** di atas category list
- Hanya tampil 1 baris: `[+ Tambah Kategori] [📍 Site View] [🌐 Global View]`
- Klik "Tambah Kategori" → expand form inline di atas list
- Saat edit → form auto-expand dengan data terisi
- Tips box dipindah ke tooltip atau dihapus

**Collapsed Form (Action Bar):**
```
┌──────────────────────────────────────────────────────────────┐
│ [+ Tambah Kategori]   [📍 Site View] [🌐 Global View]       │
│ [✨ Muat Default] [🔄 Sync dari Global] [📦 Migrasi]        │
└──────────────────────────────────────────────────────────────┘
```

**Expanded Form:**
```
┌──────────────────────────────────────────────────────────────┐
│ Tambah Baru                                        [✕ BATAL] │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Nama: [________________]                                  │ │
│ │ Slug: [/_______________] (otomatis)                       │ │
│ │ Parent: [Pilih induk...     ▼]                           │ │
│ │ ┌─ Urutan ─────────────┬─ Warna ────────────────────────┐│ │
│ │ │ 0  Kode: 3           │ [███ Olahraga] (otomatis)      ││ │
│ │ └──────────────────────┴────────────────────────────────┘│ │
│ │ [████████████ Simpan ████████████]                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 💡 Tips: Urutan menentukan posisi navigasi... (opsional)    │
└──────────────────────────────────────────────────────────────┘
```

**Files:**
- `apps/web/app/[site]/dashboard/categories/page.tsx`

**Changes:**
1. Tambah state: `const [showForm, setShowForm] = useState(false)`
2. Pindah form ke dalam conditional render `{showForm && (...)}`
3. Buat action bar component yang berisi tombol "Tambah Kategori" + toggle buttons
4. Auto-expand form saat `startEdit()` dipanggil (`setShowForm(true)`)
5. Tips box → hapus atau jadikan tooltip pada info icon
6. Pindahkan action buttons (Muat Default, Sync, Migrate, Toggle) ke action bar

**Perhatian:**
- Action bar harus responsive (stack di mobile)
- Saat form expanded, action bar tetap terlihat di atas
- Saat edit mode, tombol "Batal" di form juga menutup form (`setShowForm(false)`)

---

### Phase 3: Full-Width Category List (Priority: Sedang)

**Tujuan:** Manfaatkan ruang horizontal, kurangi vertikal scroll

**Implementasi:**
- Saat form collapsed, category list gunakan full 12 kolom
- Grid 3 kolom di desktop (bukan 2)
- Card lebih compact dengan less padding

**Layout:**

Form collapsed:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Action Bar: [+ Tambah Kategori] [📍 Site View] [🌐 Global]          │
└──────────────────────────────────────────────────────────────────────┘
┌───────────────────┬───────────────────┬──────────────────────────────┐
│ [1] Terbaru       │ [2] Nasional      │ [3] Daerah                   │
│  12 Sub  ▼        │  8 Sub   ▼        │  5 Sub   ▼                   │
├───────────────────┼───────────────────┼──────────────────────────────┤
│ [4] Ekonomi       │ [5] Olahraga      │ [6] Teknologi                │
│  3 Sub   ▼        │  6 Sub   ▼        │  4 Sub   ▼                   │
└───────────────────┴───────────────────┴──────────────────────────────┘
```

Form expanded:
```
┌──────────────────┬───────────────────────────────────────────────────┐
│ Form (col-4)     │ Category List (col-8)                             │
│ (expanded)       │ Grid 2 kolom                                      │
└──────────────────┴───────────────────────────────────────────────────┘
```

**Files:**
- `apps/web/app/[site]/dashboard/categories/page.tsx`

**Changes:**
1. Ubah grid dari `lg:grid-cols-12` menjadi conditional
2. Saat form collapsed: `lg:grid-cols-12` untuk list full-width
3. Saat form expanded: `lg:grid-cols-4` (form) + `lg:grid-cols-8` (list)
4. Ubah list grid dari `md:grid-cols-2` menjadi conditional:
   - Form collapsed: `md:grid-cols-3`
   - Form expanded: `md:grid-cols-2`
5. Kurangi card padding dari `p-4 sm:p-5` menjadi `p-3 sm:p-4`

**Dependencies:** Phase 2 (Compact Form) — perlu `showForm` state

---

### Phase 4: Mobile Optimization (Priority: Tinggi)

**Tujuan:** Pengalaman mobile yang lebih baik

**Implementasi:**
- Di mobile (< md), form default hidden, muncul via FAB (Floating Action Button)
- FAB di pojok kanan bawah: tombol "+" untuk tambah kategori
- Card di mobile: single column, lebih compact
- Header action buttons: stack vertikal, scrollable horizontal

**Mobile Layout:**
```
┌─────────────────────────┐
│ Menu Kategori     [📍]  │
│ ─────────────────────── │
│ [✨ Muat Default]       │
│ [🔄 Sync dari Global]   │
│ ─────────────────────── │
│ [1] Terbaru  12 Sub  ▼  │
│ [2] Nasional  8 Sub  ▼  │
│ [3] Daerah   5 Sub   ▶  │
│   ┌─────────────────┐   │
│   │ SUB KATEGORI    │   │
│   │ 3.1 Jawa Timur  │   │
│   │ 3.2 Jawa Tengah │   │
│   │   ↳ 3.2.1 Semar │   │
│   └─────────────────┘   │
│ ─────────────────────── │
│ Parent: 10 | Sub: 45    │
│                   [+]   │  ← FAB
└─────────────────────────┘
```

**FAB Behavior:**
- Klik FAB → buka form sebagai bottom sheet / full-screen modal
- Saat edit → buka form modal dengan data terisi
- Tutup modal → kembali ke list

**Files:**
- `apps/web/app/[site]/dashboard/categories/page.tsx`

**Changes:**
1. Tambah FAB button (fixed bottom-right, mobile only, `md:hidden`)
2. Form di mobile → bottom sheet modal atau full-screen overlay
3. Card grid: `grid-cols-1` di mobile (sudah ada)
4. Kurangi padding dan font size di mobile
5. Header action buttons: buat horizontal scrollable atau collapse ke dropdown

---

## Implementation Order

| Phase | Prioritas | Effort | Dampak | Dependencies |
|-------|-----------|--------|--------|--------------|
| 1. Accordion Collapse | ⭐ Tinggi | Rendah (1-2 jam) | ⭐⭐⭐ | None |
| 4. Mobile Optimization | ⭐ Tinggi | Sedang (2-3 jam) | ⭐⭐ | None |
| 2. Compact Form | Sedang | Sedang (2-3 jam) | ⭐⭐ | None |
| 3. Full-Width List | Sedang | Rendah (1 jam) | ⭐ | Phase 2 |

**Total estimasi:** 6-9 jam

## Technical Notes

- Semua perubahan di **satu file**: `apps/web/app/[site]/dashboard/categories/page.tsx`
- Tidak perlu perubahan API atau schema
- State management: React useState (sudah ada pattern-nya)
- Tidak perlu library tambahan
- Responsive: Tailwind breakpoints (sudah ada)
- Perhatikan interaksi dengan fitur existing:
  - `isGlobalView` toggle — berpengaruh ke fetch, numbering, badge, tombol yang muncul
  - Hierarchical code display — harus tetap akurat setelah accordion
  - Auto-calculate order — harus tetap berfungsi saat form compact
  - `startEdit()` — harus auto-expand form dan card yang relevan
  - `handleDeleteRequest()` — modal harus tetap berfungsi dari collapsed state
  - Sub-subkategori level 3 — harus ter-render dengan benar di expanded state
  - Tombol "➕" (add sub-sub) — harus tetap berfungsi

## Testing Checklist

### Fungsional
- [ ] Desktop: accordion collapse/expand berfungsi untuk semua parent card
- [ ] Desktop: sub-subkategori (level 3) tampil dengan benar saat expanded
- [ ] Desktop: hierarchical code tetap akurat di collapsed dan expanded state
- [ ] Desktop: form expand/collapse berfungsi (Phase 2)
- [ ] Desktop: grid 3 kolom tampil benar saat form collapsed (Phase 3)
- [ ] Mobile: FAB muncul dan form bottom sheet berfungsi (Phase 4)
- [ ] Mobile: card single column, compact

### Interaksi Existing
- [ ] Edit kategori: form auto-expand dengan data terisi
- [ ] Edit kategori: card auto-expand menunjukkan kategori yang di-edit
- [ ] Delete kategori: modal konfirmasi tetap berfungsi dari collapsed state
- [ ] Global View / Site View toggle tetap berfungsi
- [ ] Sync dari Global tetap berfungsi
- [ ] Migrasi ke Lokal tetap berfungsi
- [ ] Muat Default tetap berfungsi
- [ ] Tombol ➕ (add sub-sub) tetap berfungsi dari expanded card
- [ ] Toast notification tetap muncul
- [ ] Empty state tetap tampil jika belum ada kategori
- [ ] Auto-generate slug tetap berfungsi
- [ ] Auto-calculate order tetap berfungsi
- [ ] Color preview tetap update saat nama berubah

### Visual
- [ ] Badge site/global tampil benar di collapsed state
- [ ] Color tag kategori tampil benar di collapsed state
- [ ] Sub count badge tampil benar di collapsed state
- [ ] Animasi collapse/expand smooth (opsional)
- [ ] Dark mode tetap konsisten
