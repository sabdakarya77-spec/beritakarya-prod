# Panduan Step-by-Step: Migrasi Frontend BeritaKarya dari Vercel ke CT 104 (Self-Hosted)

> Dokumen ini adalah panduan operasional (*runbook*) praktis untuk memindahkan deployment frontend Next.js BeritaKarya dari Vercel ke container mandiri **CT 104** di Proxmox VE.

---

## Ringkasan Arsitektur

```
Pengguna Internet
       │
       ▼ (HTTPS via Cloudflare CDN)
Cloudflare Tunnel
       │
       ▼
CT 102 (10.0.0.12) — Caddy Gateway
       │
       ├── beritakarya.co & *.beritakarya.co ──► CT 104 (10.0.0.14:3000) [Next.js Web]
       ├── api.beritakarya.co                ──► localhost:3001          [Express API]
       └── media.beritakarya.co              ──► CT 101 (10.0.0.11:9000) [MinIO Storage]
```

| Parameter | Nilai |
|---|---|
| **Container ID** | `104` |
| **Hostname** | `lxc-4-web` |
| **IP Address** | `10.0.0.14/24` (Gateway: `10.0.0.1`, VLAN Tag: `20`) |
| **Spesifikasi** | 4 Core CPU, 6144 MB (6 GB) RAM, 2048 MB Swap, 30 GB Disk |
| **OS Template** | Debian 12 / 13 Standard |
| **Port Layanan** | `3000` (Next.js Standalone, 2 instance PM2 cluster) |

---

## Langkah 1: Buat Container CT 104 di Proxmox VE

Buka shell Node Proxmox VE Anda (via SSH atau Web Console PVE), lalu jalankan perintah berikut:

```bash
pct create 104 local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst \
  --hostname lxc-4-web \
  --password "GantiPasswordRootKuatDisini!" \
  --storage local-lvm \
  --rootfs local-lvm:30 \
  --cores 4 \
  --memory 6144 \
  --swap 2048 \
  --net0 name=eth0,bridge=vmbr0,tag=20,ip=10.0.0.14/24,gw=10.0.0.1 \
  --nameserver 1.1.1.1 \
  --start 1
```

> **Tips GUI**: Jika membuat via Web UI Proxmox, pastikan di tab **Network** memasukkan **VLAN Tag: `20`** dan IP `10.0.0.14/24` dengan gateway `10.0.0.1`.

---

## Langkah 2: Konfigurasi Dasar & Pasang Runtime di CT 104

Masuk ke dalam container CT 104:

```bash
pct enter 104
```

Jalankan instalasi paket dasar, Node.js 20 LTS, PNPM, dan PM2:

```bash
# 1. Update repository & instal tools dasar
apt update && apt install -y curl git build-essential

# 2. Pasang Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Pasang PNPM secara global
npm install -g pnpm

# 4. Pasang PM2 secara global
npm install -g pm2

# 5. Verifikasi versi
node -v    # Harus v20.x.x
pnpm -v    # Harus v10.x.x
pm2 -v
```

---

## Langkah 3: Clone Codebase & Siapkan Environment di CT 104

Masih di dalam terminal CT 104:

```bash
# 1. Buat direktori aplikasi
mkdir -p /var/www
cd /var/www

# 2. Clone repositori
git clone https://github.com/sabdakarya77-spec/beritakarya-prod.git beritakarya-prod
cd beritakarya-prod

# 3. Buat file environment frontend
cp apps/web/.env.example apps/web/.env.production
```

Edit file `apps/web/.env.production`:

```bash
nano apps/web/.env.production
```

Pastikan variabel utama terisi sesuai domain produksi:

```ini
NODE_ENV=production
NEXT_PUBLIC_API_URL="https://api.beritakarya.co"
NEXT_PUBLIC_URL="https://beritakarya.co"
NEXT_PUBLIC_SITE_ID="pusat"
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID="pub-XXXXXXXXXXXXXXXX"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

> **PENTING**: Variabel berawalan `NEXT_PUBLIC_*` ditanam (*baked*) ke dalam JavaScript browser saat proses build. File `.env.production` harus sudah terisi sebelum menjalankan langkah build.

---

## Langkah 4: Install, Build, dan Jalankan PM2 di CT 104

Jalankan skrip otomasi setup khusus Web yang telah disiapkan di codebase:

```bash
cd /var/www/beritakarya-prod
bash scripts/setup-production.sh web
```

*Skrip ini secara otomatis melakukan:*
1. `pnpm install --frozen-lockfile` (menginstal semua dependensi termasuk `sharp`).
2. `pnpm --filter @beritakarya/web build` (menghasilkan Next.js standalone).
3. Menyalin aset statis (`public` dan `.next/static`) ke direktori standalone.
4. Menjalankan PM2 cluster (`pm2 start ecosystem.config.js --only beritakarya-web`).
5. Menyimpan proses PM2 dan mengonfigurasi autostart saat reboot (`pm2 startup`).

### Verifikasi Lokal di CT 104:
```bash
# Cek status proses PM2
pm2 status

# Cek respon HTTP port 3000
curl -I http://localhost:3000/
```
*(Pastikan mengembalikan HTTP status `200 OK` atau `307/308 Redirect`).*

---

## Langkah 5: Konfigurasi Caddy Reverse Proxy di CT 102

Frontend kini berjalan di `10.0.0.14:3000`. Sekarang kita atur Caddy di **CT 102 (`10.0.0.12`)** agar meneruskan traffic domain publik ke CT 104.

> **⚠️ Penting — Kenapa `auto_https off`?**
> Cloudflare Tunnel sudah melakukan **TLS termination di edge Cloudflare**. Traffic yang masuk ke Caddy dari tunnel adalah **plain HTTP ke `localhost:80`**. Jika Caddy dibiarkan mencoba mengurus TLS sendiri (auto-HTTPS default), ia akan gagal — terutama untuk wildcard `*.beritakarya.co` yang butuh DNS-01 challenge khusus. Caddy harus dikonfigurasi hanya sebagai **HTTP reverse proxy internal**.

1. Buka shell **CT 102**:
   ```bash
   pct enter 102
   ```

2. Buat log directory (jika belum ada) dan edit Caddyfile:
   ```bash
   mkdir -p /var/log/caddy
   nano /etc/caddy/Caddyfile
   ```

3. Isi dengan konfigurasi lengkap berikut:
   ```caddy
   # ─── Global Options ────────────────────────────────────────────────────────
   # auto_https off → CF Tunnel sudah handle TLS, Caddy cukup terima HTTP
   # http_port 80   → Caddy listen di port 80 dari Cloudflare Tunnel
   # ───────────────────────────────────────────────────────────────────────────
   {
       auto_https off
       http_port  80
       admin      off
       log {
           level WARN
       }
   }

   # ─── Frontend Web: domain utama & wildcard subdomain ───────────────────────
   # Proxy ke CT 104 (10.0.0.14:3000) — Next.js Standalone via PM2
   # ───────────────────────────────────────────────────────────────────────────
   http://beritakarya.co, http://*.beritakarya.co {
       reverse_proxy 10.0.0.14:3000 {
           # Health check agar Caddy tahu jika CT104 down
           health_uri      /
           health_interval 30s
           health_timeout  10s

           # Teruskan IP asli pengunjung dari Cloudflare ke Next.js
           header_up X-Real-IP          {http.request.header.CF-Connecting-IP}
           header_up X-Forwarded-For    {http.request.header.CF-Connecting-IP}
           header_up X-Forwarded-Proto  https
           header_up Host               {host}
       }

       encode gzip zstd

       header {
           Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
           X-Content-Type-Options    "nosniff"
           Referrer-Policy           "strict-origin-when-cross-origin"
           -X-Powered-By
       }

       log {
           output file /var/log/caddy/access_web.log {
               roll_size 50mb
               roll_keep 7
           }
           format json
       }
   }

   # ─── Backend REST API (Express di CT102 localhost:3001) ─────────────────────
   http://api.beritakarya.co {
       reverse_proxy localhost:3001 {
           header_up X-Real-IP         {http.request.header.CF-Connecting-IP}
           header_up X-Forwarded-For   {http.request.header.CF-Connecting-IP}
           header_up X-Forwarded-Proto https
       }
       encode gzip zstd

       header {
           Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
           X-Content-Type-Options    "nosniff"
           Referrer-Policy           "strict-origin-when-cross-origin"
       }

       log {
           output file /var/log/caddy/access_api.log {
               roll_size 50mb
               roll_keep 7
           }
           format json
       }
   }

   # ─── Media MinIO (CT 101 — 10.0.0.11:9000) ─────────────────────────────────
   http://media.beritakarya.co {
       reverse_proxy 10.0.0.11:9000
       encode gzip zstd

       header {
           Cache-Control "public, max-age=31536000, immutable"
       }

       log {
           output file /var/log/caddy/access_media.log {
               roll_size 50mb
               roll_keep 7
           }
           format json
       }
   }
   ```

4. Verifikasi dulu koneksi CT102 → CT104 sebelum reload:
   ```bash
   # Pastikan CT104 reachable dari CT102
   nc -zv 10.0.0.14 3000
   curl -I http://10.0.0.14:3000/
   # Expected: HTTP/1.1 200 OK atau 308
   ```

5. Validasi dan reload Caddy:
   ```bash
   caddy validate --config /etc/caddy/Caddyfile
   systemctl restart caddy
   systemctl status caddy
   # Cek log jika ada error
   journalctl -u caddy --no-pager -n 30
   ```

---

## Langkah 6: Konfigurasi Cloudflare Tunnel di CT 102

Masih di **CT 102**, periksa konfigurasi Cloudflare Tunnel di `/root/.cloudflared/config.yml`:

```bash
nano /root/.cloudflared/config.yml
```

Pastikan semua hostname diarahkan ke Caddy di `localhost:80` dengan `noTLSVerify: true` (karena Caddy menerima plain HTTP, bukan HTTPS):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Frontend Web — domain utama
  - hostname: beritakarya.co
    service: http://localhost:80
    originRequest:
      noTLSVerify: true

  # Frontend Web — wildcard subdomain (mis. bandung.beritakarya.co)
  - hostname: "*.beritakarya.co"
    service: http://localhost:80
    originRequest:
      noTLSVerify: true

  # Backend API
  - hostname: api.beritakarya.co
    service: http://localhost:80
    originRequest:
      noTLSVerify: true

  # Media MinIO
  - hostname: media.beritakarya.co
    service: http://localhost:80
    originRequest:
      noTLSVerify: true

  # Fallback
  - service: http_status:404
```

Mulai ulang service cloudflared:

```bash
systemctl restart cloudflared
systemctl status cloudflared

# Verifikasi tunnel aktif dan semua hostname terdaftar
cloudflared tunnel info beritakarya-tunnel
```

---

## Langkah 7: Update DNS Record di Cloudflare Dashboard

Ini adalah langkah pengalihan dari Vercel ke server Anda. **Perubahan DNS akan berlaku langsung** karena Cloudflare Proxied records tidak perlu propagasi.

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → Pilih domain `beritakarya.co`.
2. Masuk ke menu **DNS** → **Records**.
3. Ubah **semua** record berikut agar mengarah ke Cloudflare Tunnel:

| Type | Name | Target Lama (Vercel) | Target Baru (Tunnel) | Proxy Status |
|------|------|----------------------|----------------------|--------------|
| CNAME | `beritakarya.co` | `cname.vercel-dns.com` atau `645f2a...vercel-dns-017.com` | `<TUNNEL_ID>.cfargotunnel.com` | **Proxied** ☁️ |
| CNAME | `*` (wildcard) | `cname.vercel-dns.com` atau tidak ada | `<TUNNEL_ID>.cfargotunnel.com` | **Proxied** ☁️ |
| CNAME | `api` | sudah Tunnel | `<TUNNEL_ID>.cfargotunnel.com` | **Proxied** ☁️ |
| CNAME | `media` | sudah Tunnel | `<TUNNEL_ID>.cfargotunnel.com` | **Proxied** ☁️ |

> **⚠️ Jangan lewatkan wildcard `*`!** Record ini yang memungkinkan subdomain seperti `bandung.beritakarya.co` atau `jombang.beritakarya.co` bisa diakses. Tanpa record ini, multi-site routing tidak akan berfungsi.

4. Setelah diubah, verifikasi bahwa record **tidak lagi** menunjuk ke `vercel-dns.com` atau `vercel-dns-017.com`.

---

## Langkah 8: Pengujian & Validasi Akhir

Lakukan pengujian dari komputer luar / laptop Anda:

1. **Uji Akses Domain Utama**:
   ```bash
   curl -I https://beritakarya.co
   ```
   *Periksa header: Tidak boleh ada lagi header `x-vercel-id`.*

2. **Uji Akses Subdomain (Multi-Site)**:
   ```bash
   curl -I https://jombang.beritakarya.co
   ```
   *Pastikan mengembalikan status `200 OK` dan header `x-site-id: jombang` aktif.*

3. **Uji Backend API & CORS**:
   Buka browser ke `https://beritakarya.co` dan buka DevTools (F12) → tab Console & Network. Pastikan request ke `https://api.beritakarya.co/api/v1/...` tidak mengalami error CORS.

---

## Alur Kerja Deployment Selanjutnya (Maintenance)

Jika di kemudian hari ada pembaruan kode di branch `main`:

* **Untuk Update Frontend (di CT 104)**:
  ```bash
  pct enter 104
  cd /var/www/beritakarya-prod
  bash scripts/deploy.sh
  ```
  *(Otomatis mengenali hostname `lxc-4-web` dan hanya me-rebuild Next.js frontend).*

* **Untuk Update Backend API (di CT 102)**:
  ```bash
  pct enter 102
  cd /var/www/beritakarya-prod
  bash scripts/deploy.sh
  ```
  *(Otomatis mengenali hostname `lxc-2-app` dan me-rebuild API serta database migrations).*
