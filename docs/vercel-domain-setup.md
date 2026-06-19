# Setup Domain Vercel — BeritaKarya

Panduan setup domain `beritakarya.co` dan wildcard `*.beritakarya.co` di Vercel.

> **Prasyarat:**
> - Domain `beritakarya.co` dibeli di Namecheap
> - Nameserver sudah diarahkan ke Cloudflare (`cash.ns.cloudflare.com`, `tia.ns.cloudflare.com`)
> - DNS di-manage di Cloudflare Dashboard
> - Cloudflare Tunnel untuk `api` dan `media` sudah aktif

---

## Arsitektur DNS

```
beritakarya.co          → Vercel (frontend)
*.beritakarya.co        → Vercel (wildcard multi-site)
api.beritakarya.co      → Cloudflare Tunnel → CT 102
media.beritakarya.co    → Cloudflare Tunnel → CT 102
```

---

## Step 1: Deploy dari GitHub

1. Buka https://vercel.com/dashboard
2. Klik **Add New** → **Project**
3. Import repo `beritakarya-prod` dari GitHub
4. Vercel auto-detect Next.js → klik **Deploy**
5. Tunggu deploy selesai (~2-3 menit)

---

## Step 2: Tambah Domain Utama

1. Masuk ke project → **Settings** → **Domains**
2. Ketik `beritakarya.co` → klik **Add**
3. Vercel akan minta verifikasi via TXT record:

```
Type:  TXT
Name:  _vercel
Value: vc-domain-verify=beritakarya.co-xxxxxxxxxxxx
```

4. Buka **Cloudflare Dashboard** → `beritakarya.co` → **DNS** → **Records** → **Add Record**
5. Tambahkan TXT record tersebut (Proxy: **DNS only** ☁️)
6. Kembali ke Vercel → klik **Verify**
7. Tunggu sampai status jadi ✅ **Valid**

---

## Step 3: Tambah Wildcard Domain

1. Di halaman yang sama (**Settings → Domains**)
2. Ketik `*.beritakarya.co` → klik **Add**
3. Vercel akan minta CNAME verification:

```
Type:   CNAME
Name:   *
Target: cname.vercel-dns.com
```

4. Di **Cloudflare DNS** → tambahkan record:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `*` | `cname.vercel-dns.com` | **DNS only** ☁️ |

5. Kembali ke Vercel → klik **Verify**
6. Tunggu sampai ✅ **Valid**

---

## Step 4: Final DNS Records di Cloudflare

Setelah semua selesai, record di Cloudflare harusnya seperti ini:

| Type | Name | Target | Proxy | Keterangan |
|------|------|--------|-------|------------|
| TXT | `_vercel` | `vc-domain-verify=...` | — | Verifikasi domain Vercel |
| CNAME | `beritakarya.co` | `cname.vercel-dns.com` | DNS only ☁️ | Frontend utama |
| CNAME | `*` | `cname.vercel-dns.com` | DNS only ☁️ | Wildcard multi-site |
| CNAME | `api` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied 🟠 | API backend |
| CNAME | `media` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied 🟠 | Media MinIO |

> **Penting**: Domain Vercel harus **DNS only** (abu-abu), BUKAN Proxied (orange). Kalau di-proxied Cloudflare, SSL bisa conflict karena dua pihak sama-sama terminate SSL.

---

## Step 5: Verifikasi

Setelah semua record propagate (~1-5 menit), test DNS:

```bash
# Domain utama → harus resolve ke Vercel
nslookup beritakarya.co

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
# Frontend Vercel
curl -I https://beritakarya.co

# Wildcard subdomain
curl -I https://bandung.beritakarya.co

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
- Cek di https://www.whatsmydns.net/?_vercel=beritakarya.co

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
