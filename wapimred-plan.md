# Rencana: Pengaturan Wapimred (Superadmin Toggle Control)

**Tanggal**: 2026-07-03
**Status**: Perencanaan
**Tujuan**: Memberikan superadmin kontrol penuh atas wewenang wapimred melalui toggle setting, tanpa perlu ubah codebase setiap kali ada perubahan kebijakan editorial.

---

## Latar Belakang

Saat ini, hak akses wapimred **hardcoded** di service layer. Contoh:

- Wapimred **bisa** terbitkan artikel → hardcoded di `article.service.ts:490`
- Wapimred **tidak bisa** hapus post terbit → hardcoded di `article.service.ts:546-585`
- Wapimred **tidak bisa** kelola kategori → hardcoded di `category.controller.ts:36-46`

Setiap kali kebijakan berubah, developer harus ubah code. Ini tidak efisien dan rentan human error.

## Solusi

Buat sistem **toggle setting** yang bisa diatur superadmin dari sidebar. Setting disimpan di database, service membaca flag sebelum proses aksi.

---

## Menu "Pengaturan Wapimred"

### 📰 Alur Editorial

| Toggle | Default | Keterangan |
|--------|---------|------------|
| Wapimred boleh terbitkan artikel | `OFF` | Kontrol siapa yang bisa publish |
| Wapimred boleh jadwalkan artikel (scheduled) | `OFF` | Boleh set `scheduledAt` tanpa pimred |
| Wapimred boleh force-publish (skip status) | `OFF` | Saat ini superadmin-only |

### 🗑️ Manajemen Konten

| Toggle | Default | Keterangan |
|--------|---------|------------|
| Wapimred boleh hapus post yang sudah terbit | `OFF` | Saat ini hardcoded blocked |
| Wapimred boleh kelola kategori (CRUD) | `OFF` | Saat ini superadmin-only |

### 👤 Manajemen User

| Toggle | Default | Keterangan |
|--------|---------|------------|
| Wapimred boleh ubah siteId user (pindah cabang) | `OFF` | Saat ini superadmin-only |
| Wapimred boleh hapus user | `OFF` | Saat ini superadmin-only |

### 🔔 Notifikasi

| Toggle | Default | Keterangan |
|--------|---------|------------|
| Notifikasi ke Pimred saat artikel masuk antrian Disetujui | `ON` | Supaya pimred tahu ada yang perlu diterbitkan |
| Notifikasi ke Pimred saat wapimred approve artikel | `ON` | Pimred dapat alert real-time |

---

## Struktur Sidebar

```
NavSidebar
└── ⚙️ Pengaturan Wapimred          [hanya superadmin yang lihat]
    ├── 📰 Alur Editorial
    │   ├── [on/off] Boleh terbitkan artikel
    │   ├── [on/off] Boleh jadwalkan artikel
    │   └── [on/off] Force-publish (skip status)
    ├── 🗑️ Manajemen Konten
    │   ├── [on/off] Boleh hapus post terbit
    │   └── [on/off] Boleh kelola kategori
    ├── 👤 Manajemen User
    │   ├── [on/off] Boleh pindah cabang user
    │   └── [on/off] Boleh hapus user
    └── 🔔 Notifikasi
        ├── [on/off] Notif Pimred saat artikel masuk antrian
        └── [on/off] Notif Pimred saat wapimred approve
```

---

## Aksi Tambahan: Tombol "Revisi Lagi" di Antrian Disetujui

### Masalah

Saat ini halaman antrian "Disetujui" hanya punya 2 aksi:
1. **Terbitkan** → `approved → published`
2. **Buka Detail** → lihat artikel

Jika pimred merasa artikel yang disetujui wapimred kurang tepat, tidak ada cara mengembalikan ke penulis selain mengembalikan ke `draft`.

### Solusi

Tambah aksi **"Revisi"** di antrian Disetujui:
- Transisi: `approved → revision` (baru, belum ada di state machine)
- UI: tombol "Revisi" + modal input `reviewNotes`
- Notifikasi: kirim ke penulis dengan catatan revisi

### Perubahan yang Diperlukan

1. **State machine** (`article.service.ts` ~line 291): tambah `revision` ke allowed transitions dari `approved`
2. **Frontend** (halaman antrian Disetujui): tambah tombol "Revisi" + modal

---

## Struktur Data: SiteSetting

Simpan di tabel `SiteSetting` (atau kolom JSON di tabel `Site`):

```prisma
// Opsi 1: Tabel terpisah
model SiteSetting {
  id        String   @id @default(cuid())
  siteId    String
  key       String
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  site      Site     @relation(fields: [siteId], references: [id])
  @@unique([siteId, key])
}

// Opsi 2: Kolom JSON di tabel Site (sederhana, tapi kurang fleksibel)
model Site {
  // ... field existing ...
  settings  Json     @default("{}")
}
```

### Default Values

```json
{
  "wapimred_can_publish": false,
  "wapimred_can_schedule": false,
  "wapimred_can_force_publish": false,
  "wapimred_can_delete_published": false,
  "wapimred_can_manage_categories": false,
  "wapimred_can_transfer_user": false,
  "wapimred_can_delete_user": false,
  "notify_pimred_on_submit": true,
  "notify_pimred_on_approve": true
}
```

---

## Alur Kerja Setelah Implementasi

### Mode Ketat (Default)

```
Penulis buat artikel → draft
Penulis submit → submitted (notif ke wapimred)
Wapimred review → approved (notif ke pimred)
Pimred terbitkan → published ✅

Pimred kurang puas → klik "Revisi" → revision (notif ke penulis)
Penulis revisi → submitted → wapimred approve → pimred terbitkan
```

### Mode Fleksibel (Superadmin on-kan toggle)

```
Penulis buat artikel → draft
Penulis submit → submitted (notif ke wapimred)
Wapimred review → approved → terbitkan → published ✅
(Pimred tidak perlu terlibat)
```

---

## Tidak Perlu Dimasukkan

| Item | Alasan |
|------|--------|
| Edit artikel oleh wapimred | Core function, bukan permission sensitif |
| Moderasi komentar | Terlalu granular |
| Kelola media | Bukan domain editorial sensitif |
| Kelola AI quota | Bukan domain editorial |
| Audit logs | Tetap superadmin-only permanen |

---

## Checklist Implementasi

### Phase 1: MVP
- [ ] Tambah tabel/kolom `SiteSetting` di Prisma schema
- [ ] Buat API endpoint: `GET/PUT /api/v1/sites/:id/settings` (superadmin-only)
- [ ] Buat komponen toggle di sidebar (frontend)
- [ ] Implementasi toggle pertama: `wapimred_can_publish`
- [ ] Tambah tombol "Revisi" di antrian Disetujui (frontend)
- [ ] Tambah transisi `approved → revision` di state machine
- [ ] Testing: wapimred tidak bisa terbitkan saat toggle OFF

### Phase 2: Ekspansi
- [ ] Implementasi toggle: `wapimred_can_delete_published`
- [ ] Implementasi toggle: `wapimred_can_manage_categories`
- [ ] Implementasi toggle: `wapimred_can_transfer_user`
- [ ] Implementasi toggle: `wapimred_can_delete_user`
- [ ] Implementasi toggle: `wapimred_can_schedule`
- [ ] Implementasi toggle: `wapimred_can_force_publish`

### Phase 3: Notifikasi & Polish
- [ ] Implementasi toggle notifikasi pimred
- [ ] UI polish: toast notification, loading state, error handling
- [ ] Dokumentasi API Swagger
- [ ] E2E testing

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Toggle diubah saat ada artikel dalam proses | Cek flag saat aksi dieksekusi, bukan saat draft dibuat |
| Wapimred bingung kenapa tombol hilang | Tampilkan pesan "Dihapuskan oleh Pimred" atau disable button dengan tooltip |
| Lupa setting default | Seed default values saat migrasi |
| Pimred lupa on-kan toggle saat dibutuhkan | Tambahkan shortcut "Ubah Pengaturan Wapimred" di halaman antrian Disetujui |
