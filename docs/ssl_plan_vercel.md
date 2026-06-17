# Deployment Architecture: Vercel + Cloudflare + Home Server

Dokumen ini menjelaskan arsitektur deployment BeritaKarya secara lengkap:
- **Frontend** di Vercel (Hobby plan, gratis)
- **DNS + SSL + Tunnel** di Cloudflare (gratis)
- **API + Database** di Home Server (Proxmox VE)

> **Catatan**: Dokumen ini menggantikan panduan SSL lama (certbot → acme.sh → Nginx) yang sudah tidak relevan sejak migrasi ke Vercel + Cloudflare.

---

## Arsitektur Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
│                            │                                     │
│                 ┌──────────▼──────────┐                          │
│                 │     Cloudflare      │                          │
│                 │     Edge Network    │                          │
│                 │                     │                          │
│                 │  DNS Management     │                          │
│                 │  SSL/TLS (gratis)   │                          │
│                 │  DDoS Protection    │                          │
│                 │                     │                          │
│                 │  beritakarya.co ────┼──► Vercel (Next.js)      │
│                 │  www         ───────┼──► Vercel (Next.js)      │
│                 │  *.beritakarya.co ──┼──► Vercel (wildcard)     │
│                 │  api         ───────┼──► Cloudflare Tunnel     │
│                 └──────────┬──────────┘          │               │
│                            │                     │               │
│                            │         ┌───────────▼──────────┐    │
│                            │         │  Home Server         │    │
│                            │         │  (Proxmox VE)        │    │
│                            │         │                      │    │
│                            │         │  Caddy → Express API │    │
│                            │         │  PostgreSQL + Redis  │    │
│                            │         │  Meilisearch         │    │
│                            │         └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Routing

BeritaKarya adalah multi-site CMS. Setiap site bisa diakses via:
- **Subdomain**: `surabaya.beritakarya.co` (langsung jalan, Vercel support wildcard)
- **Path-based**: `beritakarya.co/surabaya` (fallback, juga jalan)

```
Subdomain Flow (primary):
  surabaya.beritakarya.co
    → Cloudflare DNS: wildcard CNAME → Vercel
    → Vercel serve Next.js app
    → proxy.ts detect subdomain → siteId = 'surabaya'
    → Render halaman site "surabaya" ✅

Path Flow (fallback):
  beritakarya.co/surabaya
    → Cloudflare → Vercel
    → proxy.ts detect siteId dari path
    → Render halaman site "surabaya" ✅
```

> **Vercel Hobby support wildcard domain.** Cukup tambahkan wildcard CNAME (`*.beritakarya.co`) di Cloudflare yang point ke `cname.vercel-dns.com`. Tidak perlu Cloudflare Worker atau tambah domain manual per site. Superadmin buat site dari dashboard CMS, langsung bisa diakses via subdomain.

---

## Step 1: Setup Cloudflare

### 1.1 Tambah Domain ke Cloudflare

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Add a Site** → masukkan `beritakarya.co`
3. Pilih plan **Free**
4. Cloudflare akan scan existing DNS records

### 1.2 Update Nameserver di Namecheap

Cloudflare akan memberikan 2 nameserver, contoh:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

Di Namecheap:
1. Login → Domain List → `beritakarya.co` → Manage
2. **Nameservers** → Custom DNS
3. Masukkan nameserver dari Cloudflare
4. Save

> **Propagasi**: Biasanya 5-30 menit, bisa sampai 24 jam.

### 1.3 Verifikasi

```bash
# Cek nameserver sudah pindah
nslookup -type=NS beritakarya.co

# Expected output:
# beritakarya.co nameserver = ns1.cloudflare.com
# beritakarya.co nameserver = ns2.cloudflare.com
```

---

## Step 2: Konfigurasi DNS di Cloudflare

### 2.1 DNS Records untuk Frontend (Vercel)

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `76.76.21.21` | ☁️ Proxied | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | ☁️ Proxied | Auto |
| CNAME | `*` | `cname.vercel-dns.com` | ☁️ Proxied | Auto |

> **Wildcard CNAME (`*`)**: Ini yang membuat semua subdomain (`surabaya.beritakarya.co`, `nganjuk.beritakarya.co`, dll) langsung resolve ke Vercel tanpa perlu tambah record per site.

### 2.2 DNS Record untuk API (Home Server via Tunnel)

Dibuat otomatis saat setup Cloudflare Tunnel (Step 3).

### 2.3 Verifikasi

```bash
# Cek DNS resolution
nslookup beritakarya.co
nslookup www.beritakarya.co
nslookup nganjuk.beritakarya.co    # harus resolve ke Vercel
nslookup api.beritakarya.co        # nanti resolve ke Tunnel
```

---

## Step 3: Setup Cloudflare Tunnel (untuk API)

### 3.1 Install cloudflared di Home Server (LXC-2)

```bash
# Debian/Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared -y
```

### 3.2 Login ke Cloudflare

```bash
cloudflared tunnel login
# Akan buka browser, pilih beritakarya.co
```

### 3.3 Buat Tunnel

```bash
cloudflared tunnel create beritakarya-api
# Akan generate tunnel ID, contoh: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 3.4 Konfigurasi Tunnel

Buat file config:

```yaml
# ~/.cloudflared/config.yml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: /root/.cloudflared/a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - hostname: api.beritakarya.co
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

### 3.5 Route DNS

```bash
cloudflared tunnel route dns beritakarya-api api.beritakarya.co
# Akan buat CNAME record di Cloudflare DNS otomatis
```

### 3.6 Jalankan Tunnel

```bash
# Test dulu
cloudflared tunnel run beritakarya-api

# Kalau sudah OK, buat systemd service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 3.7 Verifikasi

```bash
# Cek tunnel status
cloudflared tunnel info beritakarya-api

# Cek API reachable
curl https://api.beritakarya.co/health
```

---

## Step 4: Update Vercel Environment

### 4.1 Vercel Dashboard

1. Project Settings → Environment Variables
2. Update:
   ```
   NEXT_PUBLIC_API_URL=https://api.beritakarya.co
   ```

### 4.2 Redeploy

Push ke `main` atau trigger manual deploy di Vercel.

---

## Step 5: SSL/TLS Settings di Cloudflare

### 5.1 SSL/TLS Mode

Di Cloudflare Dashboard → SSL/TLS → Overview:

| Mode | Keterangan | Rekomendasi |
|------|------------|-------------|
| Off | Tidak ada SSL | ❌ Jangan |
| Flexible | HTTPS antara browser-Cloudflare, HTTP ke origin | ❌ Tidak aman |
| **Full** | HTTPS end-to-end, origin bisa self-signed | ✅ **Pilih ini** |
| Full (Strict) | HTTPS end-to-end, origin harus valid cert | ⚠️ Butuh cert di origin |

> **Pilih "Full"** — Cloudflare handle TLS ke browser, tunnel handle ke home server.

### 5.2 Always Use HTTPS

SSL/TLS → Edge Certificates → **Always Use HTTPS**: ON

### 5.3 HSTS

SSL/TLS → Edge Certificates → HSTS:
- Enable HSTS: ON
- Max Age: `63072000` (2 tahun)
- Include Subdomains: ON
- Preload: ON

### 5.4 Automatic HTTPS Rewrites

SSL/TLS → Edge Certificates → **Automatic HTTPS Rewrites**: ON

---

## Step 6: Cloudflare Security (Opsional tapi Direkomendasikan)

### 6.1 Firewall Rules

```
Security → WAF → Custom Rules:

Rule 1: Block bad bots
  - Expression: (cf.bot_management.score lt 30)
  - Action: Block

Rule 2: Rate limit API login
  - Expression: (http.request.uri.path eq "/api/v1/auth/login" and http.request.method eq "POST")
  - Action: Rate limit (5 requests per 1 minute)
  - Then: Block for 10 minutes

Rule 3: Challenge suspicious traffic
  - Expression: (cf.threat_score gt 14)
  - Action: Managed Challenge
```

### 6.2 Caching Rules

```
Speed → Caching → Cache Rules:

Rule 1: Cache static assets
  - Expression: (http.request.uri.path contains "/_next/static/")
  - Cache eligibility: Eligible for cache
  - Edge TTL: 1 month

Rule 2: Bypass cache for API
  - Expression: (http.request.uri.path contains "/api/")
  - Cache eligibility: Bypass
```

---

## Monitoring & Troubleshooting

### Health Checks

```bash
# Frontend
curl -I https://beritakarya.co

# Subdomain (multi-tenant)
curl -I https://nganjuk.beritakarya.co

# API via tunnel
curl https://api.beritakarya.co/health

# SSL check
echo | openssl s_client -connect beritakarya.co:443 -servername beritakarya.co 2>/dev/null | openssl x509 -noout -dates
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` | SSL mode salah | Set ke "Full" di Cloudflare |
| `522 Connection Timed Out` | Tunnel mati | Restart `cloudflared` service |
| `521 Web Server Is Down` | Express API mati | Cek `docker compose ps` di LXC-2 |
| DNS tidak resolve | Nameserver belum propagate | Tunggu atau flush DNS |
| Cookie tidak tersimpan | Domain mismatch | Cek `COOKIE_DOMAIN=.beritakarya.co` |
| Subdomain 404 | Wildcard CNAME belum ada | Tambah CNAME `*` → `cname.vercel-dns.com` |

### Tunnel Logs

```bash
# Cek tunnel logs
journalctl -u cloudflared -f

# Cek tunnel status
cloudflared tunnel info beritakarya-api
```

---

## Checklist Migrasi

- [ ] Tambah domain ke Cloudflare (Free plan)
- [ ] Update nameserver di Namecheap → Cloudflare
- [ ] Tambah DNS records di Cloudflare:
  - [ ] A `@` → `76.76.21.21` (Vercel IP)
  - [ ] CNAME `www` → `cname.vercel-dns.com`
  - [ ] CNAME `*` → `cname.vercel-dns.com` (wildcard untuk multi-tenant)
- [ ] Install `cloudflared` di LXC-2
- [ ] Buat dan route Cloudflare Tunnel → `api.beritakarya.co`
- [ ] Setup systemd service untuk `cloudflared`
- [ ] Set SSL mode ke "Full" di Cloudflare
- [ ] Enable "Always Use HTTPS"
- [ ] Update `NEXT_PUBLIC_API_URL` di Vercel
- [ ] Test end-to-end (frontend → API → database)
- [ ] Test subdomain routing (`nganjuk.beritakarya.co`)
- [ ] Hapus DNS record lama ke IP VPS (`152.42.185.222`)

---

## Biaya

| Komponen | Biaya |
|----------|-------|
| Cloudflare (DNS + SSL + Tunnel + DDoS) | **Gratis** |
| Vercel Hobby (frontend + wildcard) | **Gratis** |
| Namecheap (.co domain) | ~$12/tahun |
| Home Server (listrik) | ~$5-10/bulan |
| **Total** | **~$12/tahun + listrik** |

Tidak ada biaya untuk SSL, CDN, atau DDoS protection.
