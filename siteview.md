# Analisis Site View vs Global View — Kategori

## Ringkasan Masalah

| # | Masalah | Akar Penyebab |
|---|---|---|
| 1 | Hapus sub-kategori di Site View pusat → ikut terhapus di site lain | Site View mencampur kategori global (shared) dengan lokal |
| 2 | Tambah sub-kategori di Site View pusat → tidak muncul di site lain | Tambah selalu buat baris lokal baru (benar) |
| 3 | **Asimetri** antara tambah dan hapus | Tambah = lokal, hapus = bisa global |

---

## 1. Prinsip: Site View Berdiri Sendiri, Global = Master

```
GLOBAL VIEW (master — sumber kebenaran untuk semua website)
    │
    ├── Copy ke pusat    → Site View pusat    (berdiri sendiri)
    ├── Copy ke nganjuk  → Site View nganjuk   (berdiri sendiri)
    └── Copy ke bandung  → Site View bandung   (berdiri sendiri)

Perubahan di Global View → tidak otomatis berdampak ke site lain
Perubahan di Site View   → hanya dampak ke site itu sendiri
Sync dari Global         → tambah yang baru dari global, lokal tetap (Add Only)
```

### Konsep Kunci

| Konsep | Keterangan |
|---|---|
| **Global** | Master kategori, diisi via Global View. Template untuk website baru. |
| **Lokal** | Kategori milik site, hasil copy dari global saat create. Berdiri sendiri. |
| **Site View** | Menampilkan kategori lokal site itu saja. Bebas CRUD tanpa dampak ke lain. |
| **Global View** | Menampilkan kategori global. Hanya superadmin. |
| **Sync** | Tambah kategori baru dari global ke lokal. Tidak hapus yang sudah ada. |

---

## 2. Masalah Saat Ini

### Site View Mencampur Global dan Lokal

`findCategoriesForSite(siteId)` mengembalikan:

```typescript
OR: [{ siteId }, { isGlobal: true }]
//    ↑ lokal       ↑ global (shared!)
```

Kategori global dan lokal **dicampur** di satu pohon. Pengguna tidak bisa bedakan.

### Asimetri Tambah vs Hapus

| Aksi | Baris yang dibuat/dihapus | Dampak ke site lain |
|---|---|---|
| **Tambah** | Baris baru: `siteId='pusat'`, `isGlobal=false` | Tidak ✅ |
| **Hapus** | Bisa baris global: `isGlobal=true`, `siteId=null` | Ya, hilang di semua ❌ |

**Tambah = selalu lokal. Hapus = bisa global.** Makanya asimetri.

### Bukti di Code

**`createCategory` (line 173):**
```typescript
isGlobal = data.siteId === null  // Site View kirim siteId='pusat' → isGlobal=false
// → Membuat baris LOKAL baru, tidak berdampak ke site lain
```

**`deleteCategory` (line 300):**
```typescript
await prisma.category.delete({ where: { id: categoryId } })
// ↑ Hapus berdasarkan ID saja, tanpa cek isGlobal
// → Kalau yang diklik baris global → hilang di semua site
```

---

## 3. Struktur Data Saat Ini

### Tabel `Category`

| Field | Keterangan |
|---|---|
| `id` | UUID primary key |
| `name` | Nama kategori |
| `slug` | URL-friendly name, unique per site (`@@unique([slug, siteId])`) |
| `siteId` | NULL untuk global, string untuk site-specific |
| `isGlobal` | `true` untuk kategori global, `false` untuk lokal |
| `parentId` | Self-referencing untuk hierarki |
| `order` | Urutan tampilan |

### Tabel `SiteCategory` (Saat Ini — Hanya Referensi)

| Field | Keterangan |
|---|---|
| `siteId` | ID site |
| `categoryId` | ID kategori global |

Ini hanya **junction table** — mereferensi baris global, bukan copy.

### Tabel `SiteCategory` yang Dibutuhkan (Nanti)

Tabel ini bisa dihapus atau diubah fungsinya, karena kategori lokal sudah punya baris sendiri di tabel `Category`.

---

## 4. Alur yang Benar

### Create Website Baru

```
1. Admin pusat buka pusat/dashboard/admin
2. Klik "Tambah Situs" → isi siteId, domain, name
3. Submit → POST /sites
      ↓
4. Auto-copy kategori global → kategori lokal site baru
   - Setiap kategori global dibuat baris baru: siteId='nganjuk', isGlobal=false
   - Hierarki (parent-child) tetap terjaga
   - Slug, name, order di-copy dari global
      ↓
5. Site baru langsung punya kategori lokal yang berdiri sendiri
```

### Site View (Semua Site Termasuk Pusat)

```
Query: { siteId: 'nganjuk' }  ← HANYA lokal, global TIDAK masuk
Tampil: kategori lokal nganjuk
Badge: "NGANJUK"
Aksi: bebas tambah, hapus, edit → tidak dampak ke site lain
```

### Global View (Superadmin Only)

```
Query: { isGlobal: true }  ← HANYA global
Tampil: kategori global (master)
Badge: "GLOBAL"
Aksi: CRUD global → dampak ke semua site (via sync manual)
```

### Sync dari Global (Add Only)

```
Admin buka Site View → klik "Sync dari Global"
      ↓
1. Ambil semua kategori global
2. Bandingkan dengan kategori lokal yang sudah ada (by slug)
3. Yang belum ada di lokal → tambahkan (copy sebagai baris lokal)
4. Yang sudah ada di lokal → biarkan, tidak diubah
5. Yang ada di lokal tapi tidak di global → biarkan (kategori lokal custom)
```

---

## 5. Perubahan Codebase yang Dibutuhkan

### A. Create Site — Auto-Copy Kategori Global

| File | Yang diubah |
|---|---|
| `apps/api/src/modules/site/site.service.ts` | `createSite`: setelah buat site, jalankan `copyGlobalToLocal(newSite.id)` |

```typescript
// Di dalam createSite, setelah tx.site.create:
const globalCategories = await tx.category.findMany({
  where: { isGlobal: true, deletedAt: null }
})

// Copy dengan mempertahankan hierarki
const idMap = new Map<string, string>()  // globalId → newLocalId
for (const cat of globalCategories.filter(c => !c.parentId)) {
  const newCat = await tx.category.create({
    data: {
      name: cat.name,
      slug: cat.slug,
      siteId: newSite.id,
      isGlobal: false,
      description: cat.description,
      order: cat.order,
      color: cat.color,
      parentId: null
    }
  })
  idMap.set(cat.id, newCat.id)
}
// Lanjut copy sub-categories dengan parentId yang baru...
```

### B. Site View — Hanya Kategori Lokal

| File | Yang diubah |
|---|---|
| `apps/api/src/modules/category/category.service.ts` | `findCategoriesForSite`: return hanya `{ siteId }`, hapus `OR { isGlobal: true }` |

```typescript
// Sebelum:
OR: [{ siteId }, { isGlobal: true }]

// Sesudah:
{ siteId }
```

### C. Delete — Tidak Perlu Proteksi Khusus

Karena Site View hanya menampilkan kategori lokal, delete otomatis aman — yang dihapus pasti baris lokal, bukan global. Tidak perlu pengecekan `isGlobal`.

### D. Sync dari Global — Add Only

| File | Yang diubah |
|---|---|
| `apps/api/src/modules/category/category.service.ts` | Tambah method baru: `syncGlobalToLocal(siteId)` |

```typescript
async syncGlobalToLocal(siteId: string) {
  const globalCategories = await prisma.category.findMany({
    where: { isGlobal: true, deletedAt: null }
  })
  const localCategories = await prisma.category.findMany({
    where: { siteId, deletedAt: null }
  })
  const localSlugs = new Set(localCategories.map(c => c.slug))

  // Tambah yang belum ada di lokal (by slug)
  const toAdd = globalCategories.filter(g => !localSlugs.has(g.slug))
  // Copy dengan mempertahankan hierarki...
}
```

### E. SiteCategoriesDialog — Ubah Fungsi

| File | Yang diubah |
|---|---|
| `apps/web/app/[site]/dashboard/admin/components/SiteCategoriesDialog.tsx` | Ubah dari "assign global reference" ke "sync global to local" |

Fungsi berubah:
- **Sebelum:** Checklist kategori global mana yang terlihat di site (referensi)
- **Sesudah:** Tombol "Sync dari Global" → copy kategori global yang belum ada ke lokal site

### F. SiteCategory Table — Evaluasi

Tabel `site_categories` bisa tidak diperlukan lagi karena:
- Kategori lokal sudah punya baris sendiri di `Category`
- Tidak perlu junction table untuk assignment
- Bisa dihapus atau diubah fungsinya

---

## 6. File Terkait

| File | Keterangan |
|---|---|
| `apps/api/src/modules/category/category.service.ts` | `findCategoriesForSite` (line 102), `deleteCategory` (line 300), `createCategory` (line 173), `getCategoryTree` (line 158) |
| `apps/api/src/modules/category/category.controller.ts` | Endpoint `GET /tree` (line 108), `DELETE /:id` (line 274) |
| `apps/api/src/modules/site/site.service.ts` | `createSite` (line 149) — perlu tambah auto-copy global |
| `apps/api/prisma/schema.prisma` | Model `Category` (line 154), `SiteCategory` (line 182) |
| `apps/api/src/modules/site/site-category.utils.ts` | `getSiteAssignmentFilter` — bisa dihapus/sederhanakan |
| `apps/web/app/[site]/dashboard/categories/page.tsx` | Dashboard UI, `isGlobalView` toggle |
| `apps/web/app/[site]/dashboard/admin/page.tsx` | Manajemen site, create site |
| `apps/web/app/[site]/dashboard/admin/components/SiteCategoriesDialog.tsx` | Ubah dari assign ke sync |
| `packages/config/src/categories.ts` | Template `CATEGORY_TREE_CONFIG` untuk seed |
