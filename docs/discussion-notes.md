# Diskusi Teknis — BeritaKarya v0.1

> Tanggal: 16 Juni 2026

---

## Daftar Isi

1. [Impor Berita Lama dengan Tanggal Asli](#1-impor-berita-lama-dengan-tanggal-asli)
2. [Google Index di Dashboard](#2-google-index-di-dashboard)
3. [Analisis & Perbaikan Fitur AI](#3-analisis--perbaikan-fitur-ai)

---

## 1. Impor Berita Lama dengan Tanggal Asli

### Pertanyaan

Apakah bisa memuat berita dari media lama ke website ini dengan tanggal mengikuti tanggal asli publikasi?

### Jawaban: Bisa, tapi perlu modifikasi kecil

#### Kondisi Saat Ini

Model `Article` di Prisma memiliki field `publishedAt` bertipe `DateTime?` (nullable, tidak auto-set oleh database). Alur publikasi saat ini:

1. Artikel dibuat via `POST /articles` → selalu berstatus `draft`, `publishedAt` = null
2. Saat dipublish via `POST /:id/publish` → sistem otomatis set `publishedAt = new Date()` (tanggal hari ini)

Artinya, **sistem selalu menimpa `publishedAt` dengan waktu publish**, bukan tanggal asli.

#### Yang Sudah Didukung

- Validator `PUT /:id` sudah menerima `publishedAt` sebagai input manual (`z.coerce.date().optional()`)
- Repository `updateArticle` sudah bisa menyimpan `publishedAt` custom
- Tidak ada constraint database yang mencegah tanggal masa lalu

#### Yang Perlu Dimodifikasi

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

#### Pertimbangan Penting

| Aspek | Catatan |
|---|---|
| **Slug** | Harus unik per site (`@@unique([siteId, slug])`). Perlu cek duplikat |
| **Author** | Harus ada `authorId` yang valid. Buat user "Redaksi" jika author lama tidak ada |
| **Category** | Mapping kategori lama ke kategori baru di sistem |
| **Gambar** | `featuredImage` harus URL yang bisa diakses. Upload gambar lama ke R2/storage dulu |
| **Blocks** | Konten harus dalam format JSON blocks. Perlu converter dari format lama (HTML, Markdown, dll) |
| **SEO** | Impor massal tidak otomatis trigger Google Index. Perlu manual trigger atau batch indexing |

---

## 2. Google Index di Dashboard

### Pertanyaan

Di halaman dashboard ada Google Index — apa kegunaannya dan bagaimana mengisinya?

### Jawaban

#### Apa Itu Google Index?

Google Index adalah integrasi dengan **Google Indexing API** yang memungkinkan website memberitahu Google secara langsung setiap kali artikel baru dipublish atau dihapus. Ini membuat artikel **lebih cepat muncul di Google Search** (hitungan menit, bukan hari/minggu).

#### Bagaimana Cara Kerjanya

```
Artikel dipublish
       ↓
Sistem otomatis kirim URL ke Google Indexing API
       ↓
Google menerima notifikasi
       ↓
Googlebot crawl artikel tersebut
       ↓
Artikel muncul di Google Search
```

Tanpa Google Indexing API, Google hanya bisa menemukan artikel jika:
- Ada link dari halaman lain yang sudah di-index
- Sitemap.xml di-crawl secara berkala (bisa berhari-hari)
- Googlebot menemukan halaman secara random

#### Dua Mode Penggunaan

**1. Otomatis (Saat Publish)**

Setiap kali artikel dipublish via workflow editor, sistem otomatis memanggil:

```
POST https://indexing.googleapis.com/v1/urlNotifications:publish
{
  "url": "https://domain.com/artikel/judul-artikel",
  "type": "URL_UPDATED"
}
```

Ini terjadi di background dan tidak menghalangi proses publish jika gagal (error hanya di-log).

**2. Manual (Per Artikel)**

Superadmin bisa trigger indexing manual untuk artikel yang sudah publish:
- Buka Dashboard → Daftar Artikel
- Klik tombol Globe (🌐) pada artikel yang ingin di-index
- Sistem mengirim URL ke Google Indexing API

#### Cara Mengkonfigurasi

**Langkah 1: Buat Google Cloud Project**

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan **Indexing API** di menu APIs & Services → Library

**Langkah 2: Buat Service Account**

1. Buka menu IAM & Admin → Service Accounts
2. Klik "Create Service Account"
3. Beri nama (misal: "beritakarya-indexing")
4. Klik "Create and Continue"
5. Skip role assignment → Done
6. Klik service account yang baru dibuat
7. Tab "Keys" → "Add Key" → "Create new key" → pilih JSON
8. Download file JSON

**Langkah 3: Isi Form di Dashboard**

1. Login sebagai **superadmin**
2. Buka Dashboard → Settings → tab "Google Search API"
3. Isi form:

| Field | Isi dari JSON |
|---|---|
| **Google Service Account Email** | Nilai `client_email` dari file JSON |
| **Private Key** | Nilai `private_key` dari file JSON (termasuk `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`) |

4. Klik toggle "SINKRONISASI AKTIF"

**Langkah 4: Tambahkan ke Google Search Console (WAJIB)**

1. Buka [Google Search Console](https://search.google.com/search-console/)
2. Pilih property (website) Anda
3. Buka Settings → Users and permissions
4. Klik "Add User"
5. Masukkan Service Account Email (dari langkah 2) sebagai **Owner**
6. Ini wajib karena Google Indexing API hanya bisa submit URL untuk property yang dimiliki service account

#### Fitur Terkait: Multisite

Jika Anda memiliki beberapa site (misal: pusat, daerah1, daerah2):
- Konfigurasi Google Index di site `pusat` akan di-inherit ke site lain
- Tidak perlu mengkonfigurasi setiap site secara terpisah
- Hanya superadmin yang bisa mengubah konfigurasi

#### Monitoring

Sistem akan:
- Log error jika submission gagal (tidak memblokir publish)
- Menampilkan alert sukses/gagal saat trigger manual
- Tidak ada dashboard khusus untuk melihat status indexing (gunakan Google Search Console untuk memverifikasi)

---

## 3. Analisis & Perbaikan Fitur AI

### Pertanyaan

Fitur AI menurut saya belum dimaksimalkan atau di-improve. Bagaimana analisisnya?

### Jawaban: Backend Sangat Kuat, Frontend Belum Memaksimalkan

#### Arsitektur AI Saat Ini

Sistem AI memiliki **dual path** — dua jalur yang berbeda untuk memanggil AI:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Editor)                     │
│                                                         │
│  AIPanel → useAI hooks → /api/ai/chat → OpenAI          │
│                                    (Next.js proxy)       │
│                                    ❌ Tanpa quota        │
│                                    ❌ Tanpa tracking     │
│                                    ❌ Tanpa consent      │
│                                    ❌ Tanpa system prompt│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    BACKEND (API)                         │
│                                                         │
│  /api/v1/ai/* → aiQuota middleware → services → OpenAI   │
│                 ✅ Quota enforcement                     │
│                 ✅ Usage tracking (AIUsage table)        │
│                 ✅ Consent check                         │
│                 ✅ Rate limiting (20 req/jam)            │
│                 ✅ Circuit breaker                       │
│                 ✅ System prompts bahasa Indonesia       │
│                 ✅ Redis caching                         │
└─────────────────────────────────────────────────────────┘
```

**Masalah Kritis:** Editor AI panel (yang dipakai penulis) menggunakan **jalur frontend** yang bypass semua proteksi. Artinya:
- User bisa pakai AI tanpa batas (tidak ada quota)
- Tidak ada tracking penggunaan (tidak bisa audit)
- Tidak ada consent check (potensi masalah privasi)
- Kualitas output lebih rendah (tanpa system prompt bahasa Indonesia)

#### Fitur yang Sudah Ada di Backend

Backend memiliki **12 endpoint AI** yang sangat lengkap:

| Endpoint | Fungsi | Kualitas Prompt |
|---|---|---|
| `/rewrite` | Tulis ulang dengan tone (formal/santai/berita) dan panjang (pendek/sama/panjang) | ✅ Context-aware, bahasa Indonesia |
| `/expand` | Perluas paragraf dengan detail relevan | ✅ Factual integrity |
| `/transcript-to-quote` | Ekstrak kutipan langsung dari transkrip wawancara | ✅ Attribution included |
| `/headline` | Generate 5 alternatif judul SEO-friendly | ✅ Max 70 chars |
| `/seo` | Generate meta title, meta description, keywords | ✅ SEO-optimized |
| `/grammar` | Cek grammar, ejaan, tanda baca | ✅ Temperature 0.2 |
| `/readability` | Analisis skor keterbacaan (SD/SMP/SMA/Kuliah/Profesional) | ✅ Indonesian-specific |
| `/fact-check` | Verifikasi klaim fakta (Benar/Sebagian/Salah/Belum Terverifikasi) | ✅ Dengan sumber |
| `/objectivity` | Audit objektivitas berdasarkan Kode Etik Jurnalistik Indonesia | ✅ Compliance analysis |
| `/layout` | Analisis struktur artikel, saran perbaikan layout | ✅ Block-aware |
| `/caption` | Generate alt text dan caption dari URL gambar (GPT-4o Vision) | ✅ Multimodal |

#### Fitur yang Tidak Muncul di UI Padahal Backend Sudah Siap

| Fitur | Backend | Hook | UI/Tab | Status |
|---|---|---|---|---|
| Rewrite | ✅ | ✅ | ✅ WriteTab | Berfungsi |
| Expand | ✅ | ✅ | ✅ WriteTab | Berfungsi |
| Headlines | ✅ | ✅ | ✅ OptimizeTab | Berfungsi |
| SEO Meta | ✅ | ✅ | ✅ OptimizeTab | Berfungsi |
| Grammar | ✅ | ✅ | ✅ ValidateTab | Berfungsi |
| Caption | ✅ | ✅ | ✅ ImageTab | Berfungsi |
| **Readability** | ✅ | ✅ | ❌ | **Tidak ada UI** |
| **Fact-Check** | ✅ | ✅ | ❌ | **Tidak ada UI** |
| **Objectivity** | ✅ | ✅ | ❌ | **Tidak ada UI** |
| **Transcript-to-Quote** | ✅ | ✅ | ❌ | **Tidak ada UI** |
| **Layout Analysis** | ✅ | ❌ hook | ❌ | **Tidak ada hook & UI** |
| **Image Generation** | ❌ endpoint | ❌ | ❌ | **Hanya quota, tidak ada implementasi** |

#### Masalah Lain yang Ditemukan

**1. SEOAuditTab vs OptimizeTab Duplikasi**

- `SEOAuditTab` melakukan validasi client-side (hitung karakter, cek keyword) — **tanpa AI**
- `OptimizeTab` memanggil AI `/seo` endpoint — **dengan AI**
- Keduanya melakukan hal yang mirip tapi dengan pendekatan berbeda
- Seharusnya digabungkan: client-side check dulu, lalu AI enhancement

**2. Token Cost Estimation Tidak Akurat**

```typescript
// base.service.ts — estimasi kasar
const tokensIn = Math.ceil(inputLength / 4);
const tokensOut = Math.ceil(outputLength / 4);
```

Ini menghitung token berdasarkan karakter (÷4), padahal OpenAI response sudah mengembalikan `usage.prompt_tokens` dan `usage.completion_tokens` yang akurat. Data `AIUsage` di database menjadi tidak akurat.

**3. `image_gen` Quota Mismatch**

- `seed-quotas.ts` menambahkan `image_gen` ke fitur yang diizinkan untuk superadmin/wapimred
- Admin dashboard menampilkan "Pembuat Gambar AI (Image Gen)"
- **Tapi tidak ada endpoint `/ai/image_gen`** — fitur ini belum diimplementasikan
- `checkAIPermissions` middleware memvalidasi berdasarkan path endpoint, jadi permission ini tidak aktif

**4. System Prompts Hilang di Frontend Path**

Backend services menggunakan system prompts yang sangat spesifik untuk jurnalisme Indonesia:

```
Anda adalah asisten penulisan berita profesional untuk media Indonesia.
Gunakan bahasa Indonesia yang baik dan sesuai Pedoman Umum Ejaan
Bahasa Indonesia (PUEBI). Pertahankan gaya jurnalistik yang objektif...
```

Frontend proxy (`/api/ai/chat`) mengirim pesan mentah ke OpenAI tanpa system prompt ini, sehingga output lebih generik dan kurang sesuai konteks jurnalisme Indonesia.

#### Rekomendasi Perbaikan (Prioritas)

**🔴 P1 — Kritis: Satukan AI Path**

Arahkan semua `useAI.ts` hooks ke backend API:

```typescript
// Sebelum (frontend proxy — tanpa proteksi)
const res = await fetch('/api/ai/chat', {
  body: JSON.stringify({ messages: [...] })
});

// Sesudah (backend API — dengan quota, tracking, consent)
const res = await fetch(`${API_URL}/api/v1/ai/rewrite`, {
  body: JSON.stringify({ text, tone, length })
});
```

Hapus atau nonaktifkan `/api/ai/chat` route. Ini otomatis:
- Mengaktifkan quota enforcement
- Mengaktifkan usage tracking
- Mengaktifkan consent check
- Menggunakan system prompts bahasa Indonesia
- Menggunakan rate limiting dan circuit breaker

**🟡 P2 — Tinggi: Expose Fitur Tersembunyi**

Tambahkan ke AIPanel:

1. **Tab "Analisis" baru** dengan 3 fitur:
   - Readability Score (skor 0-100, level SD/SMP/SMA/Kuliah/Profesional)
   - Fact-Check (klaim → verdict → sumber)
   - Objectivity Audit (skor, isu, compliance Kode Etik Jurnalistik)

2. **Transcript-to-Quote** di WriteTab:
   - Input: textarea untuk transkrip wawancara
   - Output: kutipan langsung dengan atribusi dan konteks

3. **Gabungkan SEOAuditTab + OptimizeTab**:
   - Client-side check dulu (instant feedback)
   - Lalu tombol "Enhance with AI" untuk generate meta yang lebih baik

**🟢 P3 — Sedang: Fitur Baru**

1. **AI Summarization**: Ringkasan artikel otomatis untuk excerpt dan social media
2. **AI Translation**: Terjemahan artikel (berguna untuk portal multi-bahasa)
3. **AI Image Generation**: Implementasi endpoint yang sudah di-seed di quota

**🔵 P4 — Rendah: Perbaikan Teknis**

1. Gunakan `usage.prompt_tokens` / `usage.completion_tokens` dari OpenAI response untuk cost estimation yang akurat
2. Tambahkan error boundary pada AIPanel components
3. Tambahkan loading skeleton pada AI result cards

---

## Ringkasan

| Topik | Status | Action Needed |
|---|---|---|
| Impor berita lama | ⚠️ Bisa dengan modifikasi | Modifikasi `finalizeArticlePublish` + buat script import |
| Google Index | ✅ Sudah terintegrasi | Konfigurasi Service Account + Search Console |
| Fitur AI | ⚠️ Backend kuat, frontend belum maksimal | Satukan AI path + expose fitur tersembunyi |
