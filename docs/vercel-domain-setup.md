# Setup Domain Vercel — BeritaKarya

Panduan setup tiga domain Vercel: `beritakarya.co`, `www.beritakarya.co`, dan `*.beritakarya.co`.

> **Prasyarat:**
> - Domain `beritakarya.co` dibeli di Namecheap
> - Nameserver sudah diarahkan ke Cloudflare (`cash.ns.cloudflare.com`, `tia.ns.cloudflare.com`)
> - DNS di-manage di Cloudflare Dashboard
> - Cloudflare Tunnel untuk `api` dan `media` sudah aktif

---

## Step 0: Menghubungkan Namecheap ke Cloudflare

Karena domain `beritakarya.co` dibeli di Namecheap dan DNS-nya dikelola menggunakan Cloudflare, pastikan Nameserver di Namecheap sudah diarahkan ke Cloudflare:

1. Login ke akun [Namecheap](https://www.namecheap.com/).
2. Masuk ke menu **Domain List** di sidebar kiri.
3. Cari domain `beritakarya.co`, lalu klik tombol **Manage** di sebelah kanan.
4. Pada tab **Domain**, cari bagian **NAMESERVERS**.
5. Ubah dropdown dari *Namecheap BasicDNS* atau *Namecheap WebDNS* menjadi **Custom DNS**.
6. Masukkan kedua alamat nameserver Cloudflare berikut:
   - `cash.ns.cloudflare.com`
   - `tia.ns.cloudflare.com`
7. Klik tombol **centang hijau (Save)** untuk menyimpan perubahan.
8. **Catatan**: Proses propagasi nameserver baru biasanya memerlukan waktu antara 5 menit hingga 24-48 jam. Anda dapat memantau statusnya di dashboard Cloudflare sampai status domain Anda aktif (Active/Protected).

---

## Arsitektur DNS

```
beritakarya.co          → Vercel (frontend utama / pusat)
www.beritakarya.co      → Vercel (redirect ke beritakarya.co)
*.beritakarya.co        → Vercel (wildcard multi-site kota)
api.beritakarya.co      → Cloudflare Tunnel → CT 102
media.beritakarya.co    → Cloudflare Tunnel → CT 102
```

> **Catatan `www`**: Wildcard `*.beritakarya.co` sudah mencakup `www` di sisi DNS.
> Di Vercel, `www` ditambahkan secara eksplisit agar bisa dikonfigurasi **redirect ke root domain**.

---

## Step 1: Deploy dari GitHub

1. Buka https://vercel.com/dashboard
2. Klik **Add New** → **Project**
3. Import repo `beritakarya-prod` dari GitHub
4. Vercel auto-detect Next.js → klik **Deploy**
5. Tunggu deploy selesai (~2-3 menit)

---

## Step 2: Tambah Domain Utama (`beritakarya.co`)

1. Masuk ke project → **Settings** → **Domains**
2. Ketik `beritakarya.co` → klik **Add**
3. Vercel akan memberikan **dua record** yang harus ditambahkan:

**Record 1 — Verifikasi ownership (TXT):**
```
Type:  TXT
Name:  _vercel
Value: vc-domain-verify=beritakarya.co-xxxxxxxxxxxx
```

**Record 2 — Routing traffic ke Vercel (CNAME):**
```
Type:  CNAME
Name:  @
Value: 64040752fd268206.vercel-dns-017.com
```

> **Catatan**: Nilai CNAME di atas adalah record **spesifik untuk project ini** yang diberikan langsung oleh Vercel. Cloudflare mendukung CNAME flattening di root domain (`@`), sehingga record ini valid meski root domain biasanya tidak bisa pakai CNAME di DNS standar.

4. Buka **Cloudflare Dashboard** → `beritakarya.co` → **DNS** → **Records** → **Add Record**
5. Tambahkan **kedua record** di atas (Proxy: **DNS only** ☁️ untuk keduanya)
6. Kembali ke Vercel → klik **Verify**
7. Tunggu sampai status jadi ✅ **Valid**

---

## Step 3: Tambah Domain `www.beritakarya.co`

1. Di halaman yang sama (**Settings → Domains**)
2. Ketik `www.beritakarya.co` → klik **Add**
3. Vercel akan otomatis menawarkan pilihan **redirect ke `beritakarya.co`** → pilih opsi tersebut
4. Vercel akan meminta CNAME record khusus untuk `www`:

```
Type:   CNAME
Name:   www
Target: 645f2a6893569902.vercel-dns-017.com
```

5. Di **Cloudflare DNS** → tambahkan record:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `www` | `645f2a6893569902.vercel-dns-017.com` | **DNS only** ☁️ |

6. Kembali ke Vercel → klik **Verify**
7. Tunggu sampai ✅ **Valid**

---

## Step 4: Tambah Wildcard Domain (`*.beritakarya.co`)

Untuk domain wildcard (`*.beritakarya.co`), Vercel memerlukan kontrol DNS tertentu guna menerbitkan sertifikat SSL SSL Wildcard secara otomatis (menggunakan metode DNS-01 challenge). 

Karena kita menggunakan **Cloudflare** untuk mengatur DNS utama (termasuk untuk Cloudflare Tunnel agar backend `api` dan `media` tidak terputus), kita **TIDAK boleh** memindahkan seluruh Nameserver ke Vercel. Sebagai gantinya, kita menggunakan metode **Partial Delegation (Delegasi Sebagian)**:

1. Di halaman Vercel (**Settings → Domains**)
2. Ketik `*.beritakarya.co` → klik **Add**
3. Di **Cloudflare DNS**, tambahkan record CNAME untuk wildcard:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `*` | `cname.vercel-dns.com` | **DNS only** ☁️ |

4. Di **Cloudflare DNS**, tambahkan **dua record tipe NS** baru untuk mendelegasikan tantangan sertifikat SSL wildcard ke Vercel:

**Record NS 1:**
* **Type**: `NS`
* **Name**: `_acme-challenge`
* **Nameserver**: `ns1.vercel-dns.com`

**Record NS 2:**
* **Type**: `NS`
* **Name**: `_acme-challenge`
- **Nameserver**: `ns2.vercel-dns.com`

5. Kembali ke Vercel → klik **Verify** / **Refresh**.
6. Tunggu sampai status berubah menjadi ✅ **Valid**. (Ini bisa memakan waktu propagasi antara 1 hingga 5 menit).

> **Wildcard `*` mencakup**: `bandung`, `surabaya`, dan semua subdomain kota lainnya untuk sistem multi-site.

---

## Step 5: Final DNS Records di Cloudflare

Setelah semua selesai, record di Cloudflare harusnya seperti ini:

| Type | Name | Target | Proxy | Keterangan |
|------|------|--------|-------|------------|
| TXT | `_vercel` | `vc-domain-verify=...` | DNS only | Verifikasi kepemilikan domain |
| CNAME | `@` | `64040752fd268206.vercel-dns-017.com` | DNS only ☁️ | Root domain → Vercel |
| CNAME | `www` | `645f2a6893569902.vercel-dns-017.com` | DNS only ☁️ | www redirect → Vercel |
| CNAME | `*` | `cname.vercel-dns.com` | DNS only ☁️ | Wildcard subdomain → Vercel |
| NS | `_acme-challenge` | `ns1.vercel-dns.com` | DNS only | SSL Challenge Delegation ke Vercel |
| NS | `_acme-challenge` | `ns2.vercel-dns.com` | DNS only | SSL Challenge Delegation ke Vercel |
| CNAME | `api` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied 🟠 | API backend |
| CNAME | `media` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied 🟠 | Media MinIO |

> **Penting**: Domain Vercel harus **DNS only** (abu-abu), BUKAN Proxied (orange). Kalau di-proxied Cloudflare, SSL bisa conflict karena dua pihak sama-sama terminate SSL.

> **Catatan root domain**: Nilai `64040752fd268206.vercel-dns-017.com` adalah CNAME **khusus project ini** dari Vercel. Cloudflare mendukung CNAME flattening di `@` sehingga record ini valid untuk root domain.

> **Catatan www domain**: Nilai `645f2a6893569902.vercel-dns-017.com` adalah CNAME **khusus project ini** dari Vercel untuk `www.beritakarya.co`.

---

## Step 6: Verifikasi

Setelah semua record propagate (~1-5 menit), test DNS:

```bash
# Domain utama → harus resolve ke Vercel
nslookup beritakarya.co

# www → harus resolve ke Vercel (lalu redirect ke beritakarya.co)
nslookup www.beritakarya.co

# Wildcard → harus resolve ke Vercel
nslookup bandung.beritakarya.co
nslookup surabaya.beritakarya.co

# API → harus resolve ke Cloudflare
nslookup api.beritakarya.co

# Media → harus resolve ke Cloudflare
nslookup media.beritakarya.co
```

Test endpoint:

```bash
# Frontend Vercel (root)
curl -I https://beritakarya.co

# www harus redirect (301) ke beritakarya.co
curl -I https://www.beritakarya.co

# Wildcard subdomain kota
curl -I https://bandung.beritakarya.co
curl -I https://surabaya.beritakarya.co

# API
curl https://api.beritakarya.co/health

# Media
curl https://media.beritakarya.co/minio/health/live
```

---

## Troubleshooting

### Vercel verify gagal

- Pastikan DNS record sudah ditambahkan di Cloudflare
- Tunggu 1-5 menit propagate
- Cek propagasi TXT record di: https://www.whatsmydns.net/#TXT/_vercel.beritakarya.co
- Cek propagasi CNAME record di: https://www.whatsmydns.net/#CNAME/beritakarya.co

### `www` tidak redirect ke root

- Pastikan `www.beritakarya.co` sudah ditambahkan di Vercel Settings → Domains
- Pastikan opsi redirect ke `beritakarya.co` dipilih saat menambahkan `www`
- DNS `www` tidak perlu record terpisah — sudah cover oleh wildcard `*`

### Wildcard tidak resolve

- Pastikan record `*` CNAME ada di Cloudflare DNS
- Pastikan wildcard domain `*.beritakarya.co` juga ditambahkan di Vercel

### SSL error di browser

- Pastikan domain Vercel **DNS only** (bukan Proxied)
- Vercel handle SSL sendiri, tidak perlu Cloudflare SSL

### Subdomain routing tidak jalan

- Pastikan `proxy.ts` sudah aktif di Next.js (sudah dicek — ✅)
- Pastikan wildcard domain ditambahkan di **kedua tempat**:
  1. Cloudflare DNS → CNAME `*` → `cname.vercel-dns.com`
  2. Vercel → Settings → Domains → `*.beritakarya.co`

---

## Step 7: Update Environment Variables (Post-Deployment)

Setelah domain `beritakarya.co` aktif dan terverifikasi di Vercel, update environment variables berikut:

### `apps/api/.env` (atau Vercel Environment Variables untuk API)

```bash
# Ganti dari Railway URL lama ke domain produksi
API_URL=https://api.beritakarya.co
NEXT_PUBLIC_API_URL=https://api.beritakarya.co

# Izinkan frontend domain resmi
CORS_ORIGIN=https://beritakarya.co
```

> **Penting**: Jika API berjalan di Railway/server terpisah, pastikan env vars di-update di sana juga, bukan hanya file `.env` lokal.

### Vercel Environment Variables (untuk `apps/web`)

1. Masuk ke Vercel → Project → **Settings** → **Environment Variables**
2. Update atau tambahkan:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co` |

3. Redeploy project agar env vars baru aktif:
   - Vercel Dashboard → **Deployments** → **Redeploy** (deployment terbaru)

### Verifikasi akhir setelah redeploy

```bash
# Pastikan API bisa diakses dari frontend
curl https://api.beritakarya.co/health

# Pastikan CORS tidak error
curl -H "Origin: https://beritakarya.co" https://api.beritakarya.co/health -v
```
