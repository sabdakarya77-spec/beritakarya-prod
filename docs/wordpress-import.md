# Impor Berita Lama dengan Tanggal Asli

> Tanggal: 16 Juni 2026

---

## Pertanyaan

Apakah bisa memuat berita dari media lama ke website ini dengan tanggal mengikuti tanggal asli publikasi?

## Jawaban: Bisa, tapi perlu modifikasi kecil

### Kondisi Saat Ini

Model `Article` di Prisma memiliki field `publishedAt` bertipe `DateTime?` (nullable, tidak auto-set oleh database). Alur publikasi saat ini:

1. Artikel dibuat via `POST /articles` → selalu berstatus `draft`, `publishedAt` = null
2. Saat dipublish via `POST /:id/publish` → sistem otomatis set `publishedAt = new Date()` (tanggal hari ini)

Artinya, **sistem selalu menimpa `publishedAt` dengan waktu publish**, bukan tanggal asli.

### Yang Sudah Didukung

- Validator `PUT /:id` sudah menerima `publishedAt` sebagai input manual (`z.coerce.date().optional()`)
- Repository `updateArticle` sudah bisa menyimpan `publishedAt` custom
- Tidak ada constraint database yang mencegah tanggal masa lalu

### Yang Perlu Dimodifikasi

**Masalah:** `finalizeArticlePublish` di `publish.service.ts` selalu menimpa `publishedAt`:

```typescript
// publish.service.ts:22-23
const updated = await repo.updateArticle(id, siteId, {
    status: 'published',
    publishedAt: new Date() // ← selalu menimpa
})
```

**Solusi A — Modifikasi Publish Flow (Disarankan):**

Ubah `finalizeArticlePublish` agar tidak menimpa `publishedAt` jika sudah diisi:

```typescript
const existing = await repo.getArticleById(id, siteId);
const updated = await repo.updateArticle(id, siteId, {
    status: 'published',
    publishedAt: existing?.publishedAt || new Date() // ← hormati tanggal yang sudah ada
})
```

Dengan modifikasi ini, alur impor menjadi:
1. Buat artikel via `POST /articles` (status: draft)
2. Update `publishedAt` via `PUT /:id` dengan tanggal asli
3. Publish via `POST /:id/publish` → `publishedAt` tidak ditimpa

**Solusi B — Script Migrasi Langsung (Untuk Bulk Import):**

Buat script yang langsung menggunakan Prisma (bypass API), cocok untuk impor massal:

```typescript
// scripts/import-articles.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function importArticle(data: {
  title: string;
  slug: string;
  content: string; // atau blocks JSON
  publishedAt: Date; // tanggal asli
  authorId: string;
  siteId: string;
  categoryId?: string;
}) {
  return prisma.article.create({
    data: {
      title: data.title,
      slug: data.slug,
      blocks: [{ type: 'paragraph', content: data.content }],
      status: 'published',
      publishedAt: data.publishedAt, // tanggal asli
      authorId: data.authorId,
      siteId: data.siteId,
      categoryId: data.categoryId,
    }
  });
}
```

**Sumber data impor** bisa dari:
- CSV/JSON export dari CMS lama
- Database langsung (perlu mapping schema)
- Scraping website lama (perlu parser)

### Pertimbangan Penting

| Aspek | Catatan |
|---|---|
| **Slug** | Harus unik per site (`@@unique([siteId, slug])`). Perlu cek duplikat |
| **Author** | Harus ada `authorId` yang valid. Buat user "Redaksi" jika author lama tidak ada |
| **Category** | Mapping kategori lama ke kategori baru di sistem |
| **Gambar** | `featuredImage` harus URL yang bisa diakses. Upload gambar lama ke R2/storage dulu |
| **Blocks** | Konten harus dalam format JSON blocks. Perlu converter dari format lama (HTML, Markdown, dll) |
| **SEO** | Impor massal tidak otomatis trigger Google Index. Perlu manual trigger atau batch indexing |
