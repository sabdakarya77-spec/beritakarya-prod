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
│                            │         │  Ollama + GPU (VM-4) │    │
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
    service: http://localhost:80   # ← ke Caddy dulu (TLS sudah di-terminate Cloudflare)
  - service: http_status:404
```

> **Mengapa port 80?** Cloudflare Tunnel sudah handle TLS di edge mereka. Traffic dari tunnel ke Caddy adalah HTTP internal (tidak expose ke internet). Caddy kemudian proxy ke Express `:3001`. Jika langsung ke `:3001`, layer security Caddy (headers, rate limiting) tidak aktif.

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

## Step 4: Setup Domain di Vercel

> **Penting**: Langkah ini wajib dilakukan sebelum DNS Cloudflare aktif. Vercel harus mengenal domain kita terlebih dahulu.

### 4.1 Tambah Domain di Vercel Dashboard

1. Buka [vercel.com](https://vercel.com) → pilih project `beritakarya`
2. **Settings** → **Domains**
3. Tambahkan satu per satu:

| Domain | Catatan |
|--------|---------|
| `beritakarya.co` | Domain utama |
| `www.beritakarya.co` | Redirect ke root |
| `*.beritakarya.co` | **Wildcard** — semua site multi-tenant |

> **Vercel Hobby plan mendukung wildcard domain** (`*.beritakarya.co`). Fitur ini gratis dan tidak membutuhkan upgrade ke Pro.

### 4.2 Verifikasi Domain (TXT Record)

Setelah menambahkan domain, Vercel akan meminta verifikasi. Biasanya Vercel memberikan dua opsi:

**Opsi A — CNAME sudah cukup** (jika record sudah ada di Cloudflare):
```
Vercel akan deteksi CNAME @ → 76.76.21.21 secara otomatis ✅
```

**Opsi B — TXT Record** (jika Vercel minta manual verify):
```
# Vercel akan tampilkan kode seperti ini:
Type : TXT
Name : _vercel
Value: <kode-unik-dari-vercel>
```

Tambahkan di Cloudflare DNS:
1. Cloudflare Dashboard → DNS → Add Record
2. Type: `TXT`
3. Name: `_vercel`
4. Content: `<kode-unik-dari-vercel>`
5. **Proxy: DNS Only (grey cloud)** ← penting, jangan Proxied
6. Save → kembali ke Vercel → klik **Verify**

> TXT record untuk verifikasi harus **DNS Only** (tidak boleh Proxied). Vercel membaca record ini langsung, tidak bisa melalui Cloudflare proxy.

### 4.3 Update Environment Variables

1. Vercel Dashboard → Project Settings → Environment Variables
2. Update:
   ```
   NEXT_PUBLIC_API_URL=https://api.beritakarya.co
   ```

### 4.4 Redeploy

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

> [!CAUTION]
> **Enable HSTS TERAKHIR** — setelah semua test end-to-end lulus (Step 7 di bawah). HSTS dengan `Max Age: 2 tahun` + `includeSubDomains` berarti browser akan **memblokir akses HTTP ke semua subdomain selama 2 tahun** tanpa bisa di-override manual. Jika ada konfigurasi yang salah saat awal, ini sangat sulit diperbaiki.

SSL/TLS → Edge Certificates → HSTS:
- Enable HSTS: ON
- Max Age: `63072000` (2 tahun)
- Include Subdomains: ON
- Preload: ON ← hanya aktifkan setelah domain stabil minimal 1 minggu

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
| Subdomain 404 di browser | Wildcard CNAME belum ada di Cloudflare | Tambah CNAME `*` → `cname.vercel-dns.com` |
| Subdomain 404 dari Vercel | `*.beritakarya.co` belum ditambah di Vercel | Tambah domain wildcard di Vercel Dashboard → Settings → Domains |
| Domain "Invalid" di Vercel | TXT verifikasi belum ada atau Proxied | Tambah TXT `_vercel` dengan **DNS Only** (grey cloud) |

### Tunnel Logs

```bash
# Cek tunnel logs
journalctl -u cloudflared -f

# Cek tunnel status
cloudflared tunnel info beritakarya-api
```

---

## Checklist Migrasi

> Ikuti urutan ini. Beberapa langkah bergantung pada langkah sebelumnya.

### Phase A: Cloudflare Setup
- [ ] Tambah domain `beritakarya.co` ke Cloudflare (Free plan)
- [ ] Update nameserver di Namecheap → Cloudflare
- [ ] Tunggu propagasi (~5-30 menit, bisa sampai 24 jam)
- [ ] Verifikasi: `nslookup -type=NS beritakarya.co` → harus tampil `ns1.cloudflare.com`

### Phase B: DNS Records
- [ ] Tambah DNS records di Cloudflare:
  - [ ] A `@` → `76.76.21.21` (Proxied ☁️)
  - [ ] CNAME `www` → `cname.vercel-dns.com` (Proxied ☁️)
  - [ ] CNAME `*` → `cname.vercel-dns.com` (Proxied ☁️) ← wildcard multi-tenant

### Phase C: Vercel Domain Setup
- [ ] Buka Vercel Dashboard → Project → Settings → Domains
- [ ] Tambahkan `beritakarya.co`
- [ ] Tambahkan `www.beritakarya.co`
- [ ] Tambahkan `*.beritakarya.co` ← wildcard untuk semua site multi-tenant
- [ ] Jika Vercel minta verifikasi TXT:
  - [ ] Tambah TXT record `_vercel` di Cloudflare **dengan DNS Only (grey cloud)**
  - [ ] Klik Verify di Vercel
  - [ ] Setelah verified, TXT record bisa dihapus

### Phase C2: Database (LXC-1 — Native, Tanpa Docker)
- [ ] Install PostgreSQL 15: `apt install -y postgresql-15 postgresql-client-15`
- [ ] Buat user & database: `CREATE USER beritakarya; CREATE DATABASE beritakarya OWNER beritakarya;`
- [ ] Tune PostgreSQL untuk 2 GB RAM (shared_buffers=512MB, effective_cache_size=1536MB)
- [ ] Edit pg_hba.conf: allow connection dari `10.0.0.0/24`
- [ ] Install Redis 7: `apt install -y redis-server`
- [ ] Konfigurasi Redis: password, maxmemory 512MB, bind 0.0.0.0
- [ ] Enable services: `systemctl enable postgresql redis-server`
- [ ] Test koneksi dari LXC-2: `psql -h 10.0.0.11 -U beritakarya -d beritakarya`

### Phase D: Cloudflare Tunnel (API)
- [ ] Install `cloudflared` di LXC-2
- [ ] `cloudflared tunnel login` → pilih `beritakarya.co`
- [ ] `cloudflared tunnel create beritakarya-api`
- [ ] Buat `~/.cloudflared/config.yml` (service: `http://localhost:80`)
- [ ] `cloudflared tunnel route dns beritakarya-api api.beritakarya.co`
- [ ] Setup systemd service untuk auto-start
- [ ] Verifikasi: `curl https://api.beritakarya.co/health`

### Phase E: SSL & Security Cloudflare
- [ ] Set SSL/TLS mode ke **Full** (bukan Flexible, bukan Full Strict)
- [ ] Enable **Always Use HTTPS**
- [ ] Enable **Automatic HTTPS Rewrites**
- [ ] (Opsional) Setup Firewall/WAF rules

### Phase F: Vercel Environment & Deploy
- [ ] Update `NEXT_PUBLIC_API_URL=https://api.beritakarya.co` di Vercel
- [ ] Redeploy project di Vercel

### Phase G: Testing End-to-End
- [ ] Test frontend: `curl -I https://beritakarya.co`
- [ ] Test wildcard subdomain: `curl -I https://nganjuk.beritakarya.co`
- [ ] Test API tunnel: `curl https://api.beritakarya.co/health`
- [ ] Test auth flow (login → cookie → dashboard)
- [ ] Test multi-tenant (buka subdomain berbeda)
- [ ] Hapus DNS record lama ke IP VPS (`152.42.185.222`)

### Phase H: AI Stack — VM-4 (Opsional, GPU Passthrough)
- [ ] Buat VM di Proxmox dengan GPU passthrough (AMD RX 6700 XT)
- [ ] Enable IOMMU di Proxmox host (`amd_iommu=on iommu=pt`)
- [ ] Bind VFIO driver untuk GPU (`1002:73df`)
- [ ] Install ROCm driver di VM
- [ ] Install Ollama (`curl -fsSL https://ollama.com/install.sh | sh`)
- [ ] Set `HSA_OVERRIDE_GFX_VERSION=10.3.0` untuk RX 6700 XT compatibility
- [ ] Download model: `ollama pull llama3:8b`
- [ ] Test: `curl http://10.0.0.14:11434/api/generate -d '{"model":"llama3","prompt":"test"}'`
- [ ] (Opsional) Deploy Open WebUI untuk chat interface
- [ ] Update Express API `.env`: `OLLAMA_URL=http://10.0.0.14:11434`

### Phase I: Hardening (Terakhir, setelah semua stabil)
- [ ] Enable **HSTS** di Cloudflare (Max Age 2 tahun, includeSubDomains)
- [ ] Enable **HSTS Preload** (hanya setelah domain stabil ≥1 minggu)
- [ ] Setup monitoring (Uptime Kuma)
- [ ] Setup backup cron

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
