# Design: Import Artikel WordPress ke BeritaKarya

> Tanggal: 16 Juni 2026

---

## Tujuan

Migrasi puluhan artikel dari website lama (beritakarya.com, WordPress) ke BeritaKarya dengan mempertahankan tanggal asli publikasi.

## Konteks

- **Sumber:** WordPress (beritakarya.com), masih live
- **Jumlah artikel:** Puluhan
- **Konten:** Teks biasa (paragraf, heading, list) + gambar
- **Gambar:** Di-hosting di server WordPress lama
- **Author:** Satu orang
- **Kategori:** Sama dengan yang ada di BeritaKarya (Peristiwa, Bisnis, Hukum, Pendidikan, Lintas Daerah, Narkotika, Kondisi Alam, Karya Nusantara, Kriminal, Politik, Opini, Pemerintah, Olahraga)
- **Slug:** Tidak perlu dipertahankan, gunakan slug baru

## Pendekatan

CLI Script + Prisma (one-time migration script).

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WordPress      │     │  CLI Script      │     │  BeritaKarya    │
│  beritakarya.com│────▶│  import.ts       │────▶│  Database       │
│                 │     │                  │     │  (PostgreSQL)   │
│  - XML Export   │     │  - Parse XML     │     │                 │
│  - Gambar di    │     │  - Download img  │     │  - Article      │
│    server       │     │  - Upload ke R2  │     │    (draft)      │
│                 │     │  - Insert via    │     │  - Image URLs   │
│                 │     │    Prisma        │     │  - Categories   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                    User review
                                                    & revisi
                                                          │
                                                          ▼
                                                    ┌─────────────┐
                                                    │  Publish    │
                                                    │  (tanggal   │
                                                    │   asli      │
                                                    │   dipertahankan)│
                                                    └─────────────┘
```

## Struktur Script

File: `scripts/import-wordpress.ts`

### Tahap 1: Parse XML

- Baca file WXR/XML dari WordPress export
- Extract setiap `<item>` menjadi object dengan field: title, content, pubDate, categories, author, images
- Library: `fast-xml-parser`

### Tahap 2: Map Data

Konversi data WordPress ke format BeritaKarya:

| Field WordPress | Field BeritaKarya | Konversi |
|---|---|---|
| `title` | `title` | Langsung |
| `content:encoded` | `blocks` | HTML → TipTap blocks JSON |
| `wp:post_date` / `pubDate` | `publishedAt` | Parse ke Date object |
| `category` | `categoryId` | Query DB, cocokkan nama/slug |
| `dc:creator` | `authorId` | Query DB by username |
| Gambar di content | `featuredImage` + URL di blocks | Download → upload ke R2 |

### Tahap 3: Download & Upload Gambar

1. Parse semua `<img>` dari content HTML
2. Download gambar dari server WordPress lama
3. Upload ke R2/storage BeritaKarya
4. Replace URL di content dengan URL baru
5. Set gambar pertama sebagai `featuredImage` (opsional)

### Tahap 4: Insert ke Database

Via Prisma:
- Cek duplikat berdasarkan `title` + `siteId`
- Skip artikel yang sudah ada
- Insert dengan `status: 'draft'`
- Set `publishedAt` = tanggal asli dari WordPress

Artikel masuk sebagai draft agar bisa di-review dan di-revisi sebelum publish. Saat dipublish via workflow editor, `publishedAt` tidak ditimpa karena sudah diisi (lihat modifikasi `finalizeArticlePublish` di bawah).

## Mapping Kategori

1. Query semua kategori dari BeritaKarya database
2. Buat map: `nama_kategori` → `categoryId`
3. Saat parse XML, cari categoryId yang cocok berdasarkan nama
4. Kalau tidak cocok, log warning dan gunakan kategori default atau null

## Konversi Content HTML → Blocks

WordPress pakai HTML, BeritaKarya pakai JSON blocks (TipTap format).

```typescript
// WordPress HTML:
// <p>Teks paragraf</p><h2>Judul</h2><img src="...">

// BeritaKarya blocks:
[
  { type: 'paragraph', content: [{ type: 'text', text: 'Teks paragraf' }] },
  { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Judul' }] },
  { type: 'image', attrs: { src: 'url_baru.jpg' } }
]
```

Elemen yang didukung: `<p>`, `<h1>`–`<h6>`, `<img>`, `<ul>`/`<ol>`/`<li>`, `<blockquote>`, `<a>`.

## Error Handling

| Kasus | Penanganan |
|---|---|
| Duplikat artikel | Cek by title+siteId sebelum insert, skip kalau sudah ada |
| Gambar gagal download | Log error, skip gambar, tetap import artikel |
| Kategori tidak cocok | Log warning, gunakan kategori default atau null |
| Slug duplikat | Tambah suffix angka: `judul-artikel-2`, `judul-artikel-3` |
| Koneksi DB gagal | Script stop, tampilkan error |
| XML format tidak sesuai | Validasi sebelum proses, tampilkan error |

## Dry Run Mode

Flag `--dry-run` untuk test tanpa insert ke database:

```bash
pnpm tsx scripts/import-wordpress.ts --file=export.xml --dry-run
```

Mode ini akan:
- Parse semua data
- Tampilkan summary (berapa artikel, gambar, kategori)
- Tidak insert apa pun ke database

## Logging

Script print progress ke console:

```
[1/50] Importing: "Judul Artikel 1"... ✓
[2/50] Importing: "Judul Artikel 2"... ✓ (3 images uploaded)
[3/50] Importing: "Judul Artikel 3"... ⚠ (1 image failed)
```

## Prasyarat

Sebelum menjalankan import, modifikasi `finalizeArticlePublish` di `apps/api/src/modules/article/publish.service.ts` agar tidak menimpa `publishedAt` jika sudah diisi:

```typescript
// publish.service.ts
const existing = await repo.getArticleById(id, siteId);
const updated = await repo.updateArticle(id, siteId, {
  status: 'published',
  publishedAt: existing?.publishedAt || new Date() // hormati tanggal yang sudah ada
});
```

Ini sesuai dengan Solusi A di `docs/discussion-notes.md`.

## Dependencies

- `fast-xml-parser` — parse WXR/XML
- `@aws-sdk/client-s3` — upload ke R2 (sudah ada di project)
- `@prisma/client` — insert ke database (sudah ada di project)

## Alur Penggunaan

1. Modifikasi `finalizeArticlePublish` (lihat Prasyarat di atas)
2. Login ke WordPress admin beritakarya.com
3. Export semua konten (Tools → Export → Posts)
4. Simpan file XML hasil export
5. Jalankan script dengan `--dry-run` dulu untuk validasi
6. Jalankan script tanpa `--dry-run` untuk import sesungguhnya
7. Review hasil di dashboard BeritaKarya (status: draft)
8. Revisi artikel yang perlu diupdate via editor
9. Publish — tanggal asli dipertahankan karena `publishedAt` sudah diisi

## Out of Scope

- Import komentar, halaman statis, atau user
- Redirect 301 dari URL lama (bisa diatur terpisah di server WP)
- Import otomatis via WordPress REST API (cukup pakai XML export)
