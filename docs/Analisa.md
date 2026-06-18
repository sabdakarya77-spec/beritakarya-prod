# Analisa Mendalam: Panduan Produksi LXC & Topologi Jaringan BeritaKarya

> **Tanggal**: 18 Juni 2026
> **Sumber Analisis**:
> - `panduan_produksi_lxc.md` — Panduan konfigurasi 3 LXC Container (DB, App, Monitor)
> - `mikrotik-tutorial-expanded.md` — Panduan topologi jaringan MikroTik & Proxmox VE
> - Codebase BeritaKarya v0.1 (monorepo: apps/api, apps/web, packages/*)

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Analisa Arsitektur Infrastruktur](#2-analisa-arsitektur-infrastruktur)
3. [Analisa Topologi Jaringan (MikroTik)](#3-analisa-topologi-jaringan-mikrotik)
4. [Analisa Konfigurasi LXC Container](#4-analisa-konfigurasi-lxc-container)
5. [Analisa Kesesuaian dengan Codebase](#5-analisa-kesesuaian-dengan-codebase)
6. [Gap Analysis: Panduan vs Codebase](#6-gap-analysis-panduan-vs-codebase)
7. [Temuan & Rekomendasi](#7-temuan--rekomendasi)
8. [Kesimpulan](#8-kesimpulan)
9. [Analisis Multi-Tenant Compatibility](#9-analisis-multi-tenant-compatibility)
10. [Checklist Gabungan: Infra + Codebase](#10-checklist-gabungan-infra--codebase)

---

## 1. Ringkasan Eksekutif

Dua dokumen panduan (`panduan_produksi_lxc.md` dan `mikrotik-tutorial-expanded.md`) merancang infrastruktur produksi untuk BeritaKarya berbasis **Proxmox VE + LXC Container** dengan segmentasi jaringan **VLAN** melalui MikroTik Router. Arsitektur ini menggantikan deployment cloud (Supabase + Railway/Vercel) yang saat ini digunakan oleh codebase.

### Poin Kunci

| Aspek | Status | Catatan |
|-------|--------|---------|
| Topologi Jaringan | ✅ Solid | VLAN isolation antara Admin (VLAN 10) dan Server (VLAN 20) sudah benar |
| Alokasi Resource | ⚠️ Perlu Review | RAM CT 102 (6 GB) mungkin kurang untuk PM2 cluster mode 4 core |
| Kesesuaian Codebase | ⚠️ Ada Gap | Beberapa konfigurasi .env tidak sinkron dengan schema Prisma aktual |
| Keamanan | ✅ Baik | Firewall rules, DB isolation, Redis auth sudah dipertimbangkan |
| Monitoring | ✅ Lengkap | Prometheus + Grafana + Exporters sudah terencana |
| Backup | ⚠️ Dasar | Hanya pg_dump cron, belum ada strategi off-site backup |

---

## 2. Analisa Arsitektur Infrastruktur

### 2.1 Arsitektur Saat Ini (Codebase)

Berdasarkan analisis codebase, deployment saat ini menggunakan:

```
┌─────────────────────────────────────────────────────┐
│                    CLOUD STACK                       │
│                                                     │
│  Frontend → Vercel (Next.js standalone)              │
│  Backend  → Railway (Express.js)                     │
│  Database → Supabase (PostgreSQL 15 + PgBouncer)     │
│  Storage  → Supabase Storage (S3 API)                │
│  Cache    → Redis (Railway addon atau internal)      │
│  Search   → Meilisearch (self-hosted atau cloud)     │
│  CI/CD    → GitHub Actions → ghcr.io                 │
└─────────────────────────────────────────────────────┘
```

**Bukti dari codebase:**
- `apps/api/.env.example` → `DATABASE_URL` mengarah ke Supabase (`supabase.co`)
- `apps/web/next.config.mjs` → rewrite proxy ke Railway URL (`web-production-aa8a.up.railway.app`)
- `apps/api/api/index.ts` → Vercel serverless entry point
- `docker-compose.yml` → 5 services (postgres, redis, meilisearch, api, web) untuk development

### 2.2 Arsitektur Target (Panduan LXC)

Panduan merancang migrasi ke self-hosted:

```
┌─────────────────────────────────────────────────────┐
│                 SELF-HOSTED STACK                    │
│                                                     │
│  MikroTik Router (Gateway, DHCP, Firewall, VLAN)    │
│       │                                             │
│       ├── VLAN 10 (192.168.10.0/24) — Admin LAN     │
│       │   └── Proxmox Host (192.168.10.50)          │
│       │                                             │
│       └── VLAN 20 (10.0.0.0/24) — Server            │
│           ├── CT 101 (10.0.0.11) — DB + Storage      │
│           │   ├── PostgreSQL 15                      │
│           │   ├── Redis 7                            │
│           │   ├── Meilisearch v1.6                   │
│           │   └── MinIO (S3-compatible)               │
│           ├── CT 102 (10.0.0.12) — App              │
│           │   ├── Express API (PM2 cluster)          │
│           │   ├── Next.js (PM2 cluster)              │
│           │   ├── Caddy (reverse proxy)              │
│           │   └── Cloudflare Tunnel                  │
│           └── CT 103 (10.0.0.13) — Monitor          │
│               ├── Prometheus                         │
│               ├── Grafana                            │
│               └── Exporters (Node, PG, Redis)        │
└─────────────────────────────────────────────────────┘
```

### 2.3 Perbandingan Resource

| Komponen | Cloud (Saat Ini) | LXC (Target) | Catatan |
|----------|------------------|--------------|---------|
| **CPU** | Shared (Vercel/Railway) | 2+4+2 = 8 cores total | Dedicated, lebih konsisten |
| **RAM** | Shared | 4+6+2 = 12 GB total | Terbatas, perlu monitoring ketat |
| **Storage** | Managed (Supabase) | MinIO di CT 101 (64 GB) | S3-compatible, full self-hosted |
| **Bandwidth** | Unlimited (cloud) | Tergantung ISP | Cloudflare Tunnel bantu cache |
| **Backup** | Automated (Supabase) | Cron pg_dump lokal | Perlu strategi off-site |
| **SSL** | Managed (Vercel/Cloud) | Caddy auto + Cloudflare | Caddy handle Let's Encrypt otomatis |
| **Scaling** | Auto-scaling | Manual (resize CT) | Tidak ada horizontal scaling mudah |

---

## 3. Analisa Topologi Jaringan (MikroTik)

### 3.1 VLAN Segmentation

**Dokumen**: `mikrotik-tutorial-expanded.md`

| VLAN | Subnet | Gateway | Fungsi | Status |
|------|--------|---------|--------|--------|
| VLAN 10 | `192.168.10.0/24` | `192.168.10.1` | Admin LAN (PC, WiFi, Proxmox WebUI) | ✅ Benar |
| VLAN 20 | `10.0.0.0/24` | `10.0.0.1` | Server (LXC containers) | ✅ Benar |

**Analisa:**
- ✅ **Isolasi jaringan**: VLAN 10 dan 20 terpisah, database tidak bisa diakses dari jaringan rumah
- ✅ **DHCP hanya di VLAN 10**: Server menggunakan IP statis, menghindari konflik IP
- ✅ **Trunk port**: Ether2 sebagai trunk ke Proxmox, Ether3-5 sebagai access port VLAN 10
- ⚠️ **Tidak ada VLAN untuk DMZ**: Jika ingin expose service tertentu ke internet tanpa Cloudflare Tunnel, perlu VLAN terpisah

### 3.2 Firewall Rules (MikroTik)

**Dokumen**: `panduan_produksi_lxc.md` — Langkah 3

| Rule | Action | Source | Destination | Analisa |
|------|--------|--------|-------------|---------|
| #1 | Accept | Established/Related | Any | ✅ Standar stateful firewall |
| #2 | Drop | Invalid | Any | ✅ Best practice |
| #3 | Drop | `10.0.0.11` (DB) | Internet | ✅ **Kritis** — DB tidak boleh akses internet |
| #4 | Accept | VLAN 10 | VLAN 20 | ✅ Admin bisa manage server |
| #5 | Drop | VLAN 20 | VLAN 10 (new) | ✅ Mencegah lateral movement |
| #6 | Accept | VLAN 20 | Internet | ⚠️ Perlu dibatasi — hanya CT 102 yang perlu internet |

**Temuan:**
- ⚠️ **Rule #6 terlalu luas**: Semua container di VLAN 20 bisa akses internet. Idealnya hanya CT 102 (App) yang perlu internet (untuk Cloudflare Tunnel, npm install, dll). CT 101 (DB) dan CT 103 (Monitor) seharusnya tidak perlu akses internet langsung
- ⚠️ **Tidak ada rule untuk inter-VLAN traffic antar container**: CT 101, 102, 103 bisa saling mengakses semua port. Idealnya dibatasi:
  - CT 102 → CT 101: hanya port 5432, 6379, 7700
  - CT 103 → CT 101: hanya port 9187, 9121 (exporters)
  - CT 103 → CT 102: hanya port 9100 (node exporter)
- ⚠️ **Tidak ada rate limiting**: Tidak ada proteksi DDoS atau brute force di level MikroTik

### 3.3 Cloudflare Tunnel

**Dokumen**: `panduan_produksi_lxc.md` — BAB 3.7

**Analisa:**
- ✅ **Zero-trust approach**: Tidak perlu port forwarding, mengurangi attack surface
- ✅ **SSL termination**: Cloudflare handle SSL di edge, Caddy handle internal
- ⚠️ **Single point of failure**: Jika Cloudflare down, site tidak bisa diakses
- ⚠️ **Tidak ada fallback**: Seharusnya ada rencana B (misal: direct port forwarding via MikroTik dengan dynamic DNS)

---

## 4. Analisa Konfigurasi LXC Container

### 4.1 CT 101 — Database (`lxc-1-db`)

**Resource**: 2 CPU, 4 GB RAM, 20 GB Disk

| Layanan | Konfigurasi | Analisa |
|---------|-------------|---------|
| **PostgreSQL 15** | `shared_buffers=1GB`, `effective_cache_size=3GB`, `max_connections=100` | ✅ Tuning baik untuk 4 GB RAM |
| **Redis 7** | `maxmemory=512mb`, `allkeys-lru`, password auth | ✅ Cukup untuk rate limiting + caching |
| **Meilisearch v1.6** | Master key, systemd service | ✅ Standar |

**Temuan:**
- ✅ **PostgreSQL listen_addresses = `10.0.0.11`**: Hanya menerima koneksi dari VLAN 20, bukan dari semua interface
- ✅ **pg_hba.conf** membatasi akses hanya dari `10.0.0.12` (App) dan `10.0.0.13` (Monitor)
- ⚠️ **Tidak ada SSL/TLS untuk PostgreSQL**: Koneksi dari CT 102 ke PostgreSQL menggunakan plaintext. Untuk production, seharusnya menggunakan `sslmode=verify-full`
- ⚠️ **Tidak ada connection pooling**: Codebase menggunakan `DIRECT_URL` dan `DATABASE_URL` dengan PgBouncer (Supabase). Di self-hosted, perlu memasang PgBouncer atau mengandalkan Prisma connection pool
- ⚠️ **Redis password di plaintext**: Password Redis disimpan di `.env` tanpa enkripsi. Seharusnya menggunakan secret manager atau minimal file permission yang ketat
- ⚠️ **Backup hanya lokal**: `backup_db.sh` menyimpan di `/var/backups/postgresql` — jika disk gagal, backup hilang juga. Perlu off-site backup (S3, R2, atau rsync ke NAS)

### 4.2 CT 102 — Application Stack (`lxc-2-app`)

**Resource**: 4 CPU, 6 GB RAM, 20 GB Disk

| Layanan | Konfigurasi | Analisa |
|---------|-------------|---------|
| **Node.js 20 LTS** | Via NodeSource | ✅ Sesuai dengan Dockerfile codebase |
| **pnpm 10** | Global install | ✅ Sesuai `package.json` (pnpm 10.33.2) |
| **PM2** | Cluster mode, `instances: 'max'` | ⚠️ Perlu review (lihat di bawah) |
| **Caddy** | Reverse proxy, auto-SSL | ✅ Lebih baik dari Nginx untuk kasus ini |
| **Cloudflare Tunnel** | Systemd service | ✅ Best practice |

**Temuan Kritis:**

1. **PM2 Cluster Mode — Potensi Masalah**:
   ```
   instances: 'max'  → 4 workers (sama dengan core count)
   max_memory_restart: '1G' (API) + '1.5G' (Web)
   ```
   - Total potensi RAM: `4 × 1G + 4 × 1.5G = 10 GB` — **melebihi alokasi 6 GB**
   - PM2 akan melakukan restart循环 jika memory melebihi limit
   - **Rekomendasi**: Kurangi instances menjadi 2 untuk API dan 2 untuk Web, atau tambah RAM CT 102 menjadi 8 GB

2. **Next.js Standalone Output**:
   - Codebase menggunakan `output: 'standalone'` di `next.config.mjs`
   - Panduan menggunakan `node_modules/next/dist/bin/next start` — ini **bukan standalone mode**
   - **Seharusnya**: `node apps/web/.next/standalone/server.js` (seperti di Dockerfile)
   - Standalone output lebih ringan dan tidak memerlukan `node_modules` lengkap

3. **Environment Variables**:
   - Panduan menulis `DATABASE_URL` dengan `connection_limit=20`
   - Codebase `.env.example` menggunakan format Supabase (`pgbouncer=true`, `statement_cache_size=0`)
   - **Gap**: Parameter koneksi PostgreSQL perlu disesuaikan untuk self-hosted (tanpa PgBouncer)

4. **Caddy Configuration**:
   - ✅ Sudah benar: reverse proxy ke `localhost:3000` (Web) dan `localhost:3001` (API)
   - ✅ Security headers sudah ditambahkan
   - ⚠️ **Tidak ada rate limiting di Caddy**: Seharusnya ditambahkan untuk API endpoints

5. **CORS Configuration**:
   - Codebase `main.ts` whitelist: `beritakarya.co`, `beritakarya.com`, `vercel.app`, localhost
   - Panduan `.env`: `CORS_ORIGIN=https://beritakarya.co`
   - ✅ Sudah sinkron, tapi perlu ditambahkan `api.beritakarya.co` jika ada kebutuhan cross-origin API calls

### 4.3 CT 103 — Monitoring (`lxc-3-monitor`)

**Resource**: 2 CPU, 2 GB RAM, 10 GB Disk

| Layanan | Konfigurasi | Analisa |
|---------|-------------|---------|
| **Prometheus** | Scrape interval 15s | ✅ Standar |
| **Grafana** | Port 3000 | ✅ Standar |
| **Node Exporter** | Di semua container | ✅ Best practice |
| **PostgreSQL Exporter** | Port 9187 | ✅ Monitoring DB metrics |
| **Redis Exporter** | Port 9121 | ✅ Monitoring cache metrics |

**Temuan:**
- ✅ **Dashboard IDs sudah disebutkan**: 1860 (Node Exporter), 9628 (PostgreSQL), 763 (Redis)
- ⚠️ **Tidak ada alerting**: Grafana hanya untuk visualisasi, tidak ada alerting rules yang dikonfigurasi
- ⚠️ **Tidak ada Meilisearch exporter**: Meilisearch tidak dimonitor secara native
- ⚠️ **Grafana port 3000 bentrok**: Jika CT 103 juga menjalankan Next.js di masa depan, akan bentrok. Saat ini tidak masalah karena CT 103 khusus monitoring
- ⚠️ **Tidak ada log aggregation**: Tidak ada ELK/Loki stack untuk centralized logging

---

## 5. Analisa Kesesuaian dengan Codebase

### 5.1 Database Schema (Prisma)

**File**: `apps/api/prisma/schema.prisma` (567 lines, 20 models)

Panduan membuat database `beritakarya` dengan user `berita_user`. Mari kita cocokkan dengan kebutuhan schema:

| Aspek | Panduan | Codebase | Status |
|-------|---------|----------|--------|
| Nama DB | `beritakarya` | `DATABASE_URL` → `beritakarya` | ✅ Cocok |
| User | `berita_user` | Tidak dispesifikasi di schema | ✅ Boleh bebas |
| PostgreSQL version | 15 | Dockerfile → `postgres:15-alpine` | ✅ Cocok |
| Extension | Tidak disebutkan | Schema menggunakan `@db.Text`, `@db.Uuid` | ⚠️ Perlu cek apakah ada extension yang dibutuhkan |

**Temuan:**
- Schema menggunakan `@default(uuid())` — ini adalah Prisma function, bukan PostgreSQL extension, jadi tidak masalah
- Schema menggunakan `@db.Text` untuk `blocks` (JSON) — PostgreSQL mendukung native JSON, tidak perlu extension tambahan
- Tidak ada PostgreSQL extension khusus yang dibutuhkan (seperti `uuid-ossp` atau `pg_trgm`)

### 5.2 Environment Variables

**Analisa mendalam terhadap `.env` di panduan vs `.env.example` di codebase:**

#### API Backend (`apps/api/.env.example` vs Panduan)

| Variable | `.env.example` | Panduan | Status |
|----------|----------------|---------|--------|
| `NODE_ENV` | `development` | `production` | ✅ Sesuai |
| `PORT` | `3001` | `3001` | ✅ Cocok |
| `API_URL` | `http://localhost:3001` | `https://api.beritakarya.co` | ✅ Sesuai production |
| `DATABASE_URL` | Supabase format | Direct PostgreSQL | ⚠️ **Perlu penyesuaian** |
| `DIRECT_URL` | Supabase format | Direct PostgreSQL | ⚠️ **Perlu penyesuaian** |
| `REDIS_HOST` | Tidak ada (URL-based) | `10.0.0.11` | ⚠️ **Gap** |
| `MEILISEARCH_HOST` | `http://localhost:7700` | `http://10.0.0.11:7700` | ✅ Sesuai |
| `JWT_SECRET` | Placeholder | Placeholder | ✅ |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://beritakarya.co` | ✅ Sesuai |
| `COOKIE_DOMAIN` | Tidak ada | `.beritakarya.co` | ⚠️ **Tidak ada di .env.example** |
| `S3_ENDPOINT` | Supabase S3 | `http://10.0.0.11:9000` (MinIO) | ⚠️ **Perlu penyesuaian** |
| `EMAIL_ENABLED` | `false` | `true` | ✅ Production enabled |
| `SENTRY_DSN` | Placeholder | Placeholder | ✅ |

**Gap Kritis:**

1. **DATABASE_URL format**:
   ```
   .env.example:  postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true
   Panduan:       postgresql://berita_user:pass@10.0.0.11:5432/beritakarya?schema=public&connection_limit=20
   ```
   - Codebase mengasumsikan PgBouncer (Supabase), panduan menggunakan direct connection
   - Prisma `connection_limit=20` di panduan sudah benar untuk direct connection
   - **Tindakan**: Hapus parameter `pgbouncer=true` dan `statement_cache_size=0` dari DATABASE_URL

2. **REDIS_HOST vs REDIS_URL**:
   - Codebase `.env.example` tidak memiliki `REDIS_HOST` — kemungkinan menggunakan `REDIS_URL` atau konfigurasi internal
   - Panduan menggunakan `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` secara terpisah
   - **Tindakan**: Periksa kode `src/` untuk melihat cara Redis diinisialisasi

3. **COOKIE_DOMAIN**:
   - Tidak ada di `.env.example` tapi digunakan di panduan
   - Dibutuhkan untuk JWT cookie sharing antar subdomain (`.beritakarya.co`)
   - **Tindakan**: Tambahkan `COOKIE_DOMAIN` ke `.env.example`

#### Web Frontend (`apps/web/.env.example` vs Panduan)

| Variable | `.env.example` | Panduan | Status |
|----------|----------------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://api.beritakarya.co` | ✅ |
| `NEXT_PUBLIC_URL` | `http://localhost:3000` | `https://beritakarya.co` | ✅ |
| `NEXT_PUBLIC_GA_ID` | Tidak ada | `G-XXXXXXXXXX` | ⚠️ Opsional |
| `NEXT_PUBLIC_SITE_ID` | Commented out | `pusat` | ✅ |

### 5.3 Build & Deploy Pipeline

**Panduan** (BAB 3.4):
```bash
pnpm --filter @beritakarya/api db:migrate:deploy
pnpm --filter @beritakarya/api db:seed
pnpm build
```

**Codebase** (`turbo.json`):
```json
"db:migrate:deploy": { "cache": false }
"build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] }
```

**Analisa:**
- ✅ Perintah build sudah sesuai dengan Turbo pipeline
- ✅ `db:migrate:deploy` digunakan (production), bukan `db:migrate` (development)
- ⚠️ **Tidak ada langkah `db:generate`**: Sebelum `db:migrate:deploy`, seharusnya menjalankan `db:generate` untuk memastikan Prisma client ter-generate
- ⚠️ **Tidak ada langkah build packages**: Turbo `build` seharusnya mem-build packages terlebih dahulu (`@beritakarya/types`, `@beritakarya/config`, `@beritakarya/utils`)

**Urutan yang benar:**
```bash
pnpm install --frozen-lockfile
pnpm --filter @beritakarya/api db:generate
pnpm --filter @beritakarya/api db:migrate:deploy
pnpm --filter @beritakarya/api db:seed
pnpm build
```

### 5.4 Dockerfile vs PM2

**Codebase** (`apps/api/Dockerfile`):
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

**Codebase** (`apps/web/Dockerfile`):
```dockerfile
CMD ["node", "apps/web/server.js"]
```

**Panduan** (PM2):
```javascript
// API
{ script: 'node', args: 'apps/api/dist/main.js' }

// Web
{ script: 'node_modules/next/dist/bin/next', args: 'start apps/web -p 3000' }
```

**Gap:**
- API: ✅ Konsisten (`node dist/main.js`)
- Web: ⚠️ **Tidak konsisten** — Dockerfile menggunakan standalone server (`apps/web/server.js`), PM2 menggunakan `next start`. Standalone mode lebih ringan dan cocok untuk container dengan resource terbatas

---

## 6. Gap Analysis: Panduan vs Codebase

### 6.1 Gap Kritis (Harus Diperbaiki Sebelum Deploy)

| # | Gap | Dampak | Solusi |
|---|-----|--------|--------|
| 1 | **Next.js tidak menggunakan standalone mode** | RAM usage lebih tinggi, startup lebih lambat | Gunakan `node apps/web/.next/standalone/server.js` di PM2 |
| 2 | **PM2 instances 'max' dengan RAM terbatas** | OOM kill, restart循环 | Kurangi instances ke 2 atau tambah RAM ke 8 GB |
| 3 | **DATABASE_URL format Supabase vs direct** | Koneksi gagal | Sesuaikan parameter koneksi Prisma |
| 4 | **Tidak ada `db:generate` sebelum build** | Prisma client tidak ter-generate | Tambahkan langkah `db:generate` |
| 5 | **Backup hanya lokal** | Data loss jika disk gagal | Tambahkan off-site backup (rsync/S3) |

### 6.2 Gap Medium (Direkomendasikan)

| # | Gap | Dampak | Solusi |
|---|-----|--------|--------|
| 6 | Tidak ada SSL PostgreSQL | Data sniffable di VLAN 20 | Aktifkan SSL di PostgreSQL |
| 7 | Firewall rule #6 terlalu luas | CT 101/103 bisa akses internet | Batasi hanya CT 102 |
| 8 | Tidak ada rate limiting di Caddy | API vulnerable ke brute force | Tambahkan rate_limit directive |
| 9 | Tidak ada alerting di Grafana | Masalah tidak terdeteksi otomatis | Konfigurasi alert rules |
| 10 | Tidak ada centralized logging | Sulit debug production | Tambahkan Loki atau journald forwarding |

### 6.3 Gap Low (Nice to Have)

| # | Gap | Dampak | Solusi |
|---|-----|--------|--------|
| 11 | Tidak ada Meilisearch exporter | Search metrics tidak termonitor | Buat custom exporter atau gunakan Meilisearch cloud |
| 12 | Tidak ada PgBouncer | Connection overhead lebih tinggi | Tambahkan PgBouncer di CT 101 |
| 13 | Tidak ada Redis Sentinel/Cluster | Single point of failure untuk cache | Tambahkan Redis Sentinel jika budget memungkinkan |
| 14 | Tidak ada CI/CD pipeline untuk self-hosted | Deploy manual | Buat GitHub Actions SSH deploy atau Gunakan Drone CI |

---

## 7. Temuan & Rekomendasi

### 7.1 Rekomendasi Prioritas 1 (Wajib Sebelum Go-Live)

#### R1.1 — Perbaiki PM2 Configuration

```javascript
// ecosystem.config.js — Revisi
module.exports = {
  apps: [
    {
      name: 'beritakarya-api',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/beritakarya-prod',
      instances: 2,              // Kurangi dari 'max' (4) ke 2
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '800M', // Kurangi dari 1G
      // ...
    },
    {
      name: 'beritakarya-web',
      script: 'apps/web/.next/standalone/server.js',  // ← Standalone mode
      cwd: '/var/www/beritakarya-prod',
      instances: 2,              // Kurangi dari 'max' (4) ke 2
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'https://api.beritakarya.co',
        NEXT_PUBLIC_URL: 'https://beritakarya.co'
      },
      max_memory_restart: '1G',  // Kurangi dari 1.5G
      // ...
    }
  ]
};
```

**Estimasi RAM usage:**
- API: 2 workers × 800MB = 1.6 GB
- Web: 2 workers × 1GB = 2 GB
- OS + overhead: ~1 GB
- **Total: ~4.6 GB dari 6 GB tersedia** — aman dengan headroom

#### R1.2 — Sesuaikan Database URL

```ini
# apps/api/.env — untuk self-hosted PostgreSQL
DATABASE_URL="postgresql://berita_user:PASSWORD@10.0.0.11:5432/beritakarya?schema=public&connection_limit=20&connect_timeout=10"
DIRECT_URL="postgresql://berita_user:PASSWORD@10.0.0.11:5432/beritakarya?schema=public"
```

#### R1.3 — Tambahkan Off-site Backup

```bash
#!/bin/bash
# /usr/local/bin/backup_db_offsite.sh
# Jalankan setiap Minggu pukul 03:00

BACKUP_DIR="/var/backups/postgresql"
LATEST=$(ls -t $BACKUP_DIR/beritakarya_backup_*.dump | head -1)

# Contoh: rsync ke NAS atau MinIO bucket terpisah
# rsync -avz $LATEST user@nas:/backups/beritakarya/
# mc cp $LATEST local/backups/beritakarya/

echo "Offsite backup: $LATEST"
```

#### R1.4 — Perbaiki Build Sequence

```bash
cd /var/www/beritakarya-prod

# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Generate Prisma client
pnpm --filter @beritakarya/api db:generate

# 3. Run database migrations
pnpm --filter @beritakarya/api db:migrate:deploy

# 4. Seed database (role quotas, admin user)
pnpm --filter @beritakarya/api db:seed

# 5. Build all packages and apps
pnpm build

# 6. Copy static assets for standalone Next.js
cp -r apps/web/public apps/web/.next/standalone/public
cp -r apps/web/.next/static apps/web/.next/standalone/.next/static
```

### 7.2 Rekomendasi Prioritas 2 (Direkomendasikan)

#### R2.1 — Perketat Firewall MikroTik

```routeros
/ip firewall filter
# ... rules yang sudah ada ...

# Batasi inter-container traffic
# CT 102 → CT 101: hanya port DB
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=5432 protocol=tcp comment="App to PostgreSQL"
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=6379 protocol=tcp comment="App to Redis"
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=7700 protocol=tcp comment="App to Meilisearch"

# CT 103 → CT 101: hanya port exporters
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.11 dst-port=9187 protocol=tcp comment="Monitor to PG Exporter"
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.11 dst-port=9121 protocol=tcp comment="Monitor to Redis Exporter"
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.11 dst-port=9100 protocol=tcp comment="Monitor to Node Exporter (DB)"

# CT 103 → CT 102: hanya node exporter
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.12 dst-port=9100 protocol=tcp comment="Monitor to Node Exporter (App)"

# Drop semua inter-container traffic lainnya
add action=drop chain=forward src-address=10.0.0.0/24 dst-address=10.0.0.0/24 comment="Drop all other inter-container traffic"
```

#### R2.2 — Aktifkan SSL PostgreSQL

```ini
# /etc/postgresql/15/main/postgresql.conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

```ini
# pg_hba.conf — ubah dari scram-sha-256 ke scram-sha-256 + ssl
hostssl beritakarya berita_user 10.0.0.12/32 scram-sha-256
hostssl beritakarya berita_user 10.0.0.13/32 scram-sha-256
```

#### R2.3 — Tambahkan Rate Limiting di Caddy

```caddy
api.beritakarya.co {
    reverse_proxy localhost:3001

    # Rate limiting
    rate_limit {
        zone api_limit {
            key {remote_host}
            events 100
            window 1m
        }
    }

    # ... existing config ...
}
```

#### R2.4 — Konfigurasi Grafana Alerting

```yaml
# /etc/grafana/provisioning/alerting/rules.yml
groups:
  - name: beritakarya-alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage above 80% on {{ $labels.instance }}"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage above 85% on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100 > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space above 80% on {{ $labels.instance }}"

      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down on {{ $labels.instance }}"
```

### 7.3 Rekomendasi Prioritas 3 (Opsional)

#### R3.1 — Tambahkan PgBouncer

```bash
# Di CT 101
apt install -y pgbouncer

# /etc/pgbouncer/pgbouncer.ini
[databases]
beritakarya = host=127.0.0.1 port=5432 dbname=beritakarya

[pgbouncer]
listen_addr = 10.0.0.11
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
default_pool_size = 20
max_client_conn = 100
```

#### R3.2 — Tambahkan Log Aggregation (Loki)

```bash
# Di CT 103
apt install -y promtail

# Konfigurasi Promtail untuk mengumpulkan log dari semua container
# via syslog atau SSH tunnel
```

#### R3.3 — CI/CD Pipeline untuk Self-Hosted

```yaml
# .github/workflows/deploy-selfhosted.yml
name: Deploy to Self-Hosted
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/beritakarya-prod
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm --filter @beritakarya/api db:generate
            pnpm --filter @beritakarya/api db:migrate:deploy
            pnpm build
            pm2 reload ecosystem.config.js
```

---

## 8. Kesimpulan

### 8.1 Penilaian Keseluruhan

| Dimensi | Skor (1-5) | Catatan |
|---------|------------|---------|
| **Arsitektur Jaringan** | 4.5/5 | VLAN isolation solid, firewall rules baik |
| **Konfigurasi Database** | 4/5 | Tuning PostgreSQL tepat, perlu SSL & backup off-site |
| **Konfigurasi Aplikasi** | 4/5 | PM2 standalone mode, cron scheduler, wildcard subdomain |
| **Monitoring** | 4/5 | Stack lengkap, perlu alerting rules |
| **Keamanan** | 3.5/5 | Dasar baik, perlu perketat firewall & SSL |
| **Multi-Tenant** | 5/5 | 100% kompatibel, tidak ada cloud dependency untuk fitur ini |
| **Kesesuaian Codebase** | 4/5 | 5 perubahan kode kecil, tidak ada logic change |
| **Dokumentasi** | 4.5/5 | Sangat terperinci, mudah diikuti |

### 8.2 Langkah Selanjutnya

1. **Immediate** (sebelum deploy):
   - [ ] Perbaiki PM2 configuration (R1.1)
   - [x] Sesuaikan DATABASE_URL format (R1.2) — `.env.example` sudah direct PostgreSQL
   - [ ] Perbaiki build sequence (R1.4)
   - [ ] Terapkan Next.js standalone mode
   - [x] Ganti default Railway URL di `next.config.mjs`
   - [x] Tambah MinIO domain ke `remotePatterns`
   - [ ] Setup DNS wildcard `*.beritakarya.co` di Cloudflare
   - [ ] Konfigurasi Caddy wildcard subdomain

2. **Short-term** (minggu pertama):
   - [ ] Tambahkan off-site backup (R1.3)
   - [ ] Perketat firewall rules (R2.1)
   - [ ] Aktifkan SSL PostgreSQL (R2.2)
   - [ ] Tambahkan rate limiting di Caddy (R2.3)
   - [ ] Setup cron scheduler untuk `/api/cron/*` endpoints
   - [ ] Test multi-site subdomain routing (bandung.beritakarya.co)

3. **Medium-term** (bulan pertama):
   - [ ] Konfigurasi Grafana alerting (R2.4)
   - [ ] Tambahkan PgBouncer (R3.1)
   - [ ] Setup CI/CD pipeline (R3.3)
   - [ ] Evaluasi kebutuhan log aggregation (R3.2)

### 8.3 Estimasi Resource Final

| Container | CPU | RAM (Estimasi) | Disk | Status |
|-----------|-----|----------------|------|--------|
| CT 101 (DB + Storage) | 2 cores | ~2.8 GB / 4 GB | ~20 GB / 64 GB | ✅ Aman |
| CT 102 (App) | 4 cores | ~4.6 GB / 6 GB | ~12 GB / 20 GB | ⚠️ Perlu monitoring |
| CT 103 (Monitor) | 2 cores | ~1.2 GB / 2 GB | ~5 GB / 10 GB | ✅ Aman |
| **Total** | **8 cores** | **~8.6 GB / 12 GB** | **~37 GB / 94 GB** | ✅ Feasible |

> **Catatan CT 101**: Disk 64 GB dibagi untuk DB (~20 GB) dan MinIO media storage (~41-49 GB). Retensi backup dikurangi dari 7 hari ke 3 hari untuk menghemat tempat.

---

## 9. Analisis Multi-Tenant Compatibility

### 9.0.1 Temuan

BeritaKarya menggunakan model **multi-tenant shared-database** dengan `siteId` sebagai partition key di 18+ tabel. Routing multi-site mendukung **dua mode**: path-based (`/bandung/dashboard`) dan subdomain-based (`bandung.beritakarya.co`).

### 9.0.2 Kompatibilitas dengan Self-Hosted

| Fitur Multi-Tenant | Cara Kerja | Bergantung Cloud? | Status |
|--------------------|------------|-------------------|--------|
| Site ID routing | `proxy.ts` middleware (Next.js) | ❌ Tidak | ✅ Kompatibel |
| Subdomain extraction | Parse `Host` header | ❌ Tidak | ✅ Kompatibel (butuh DNS wildcard) |
| Site scoping DB | Prisma `WHERE siteId = ?` | ❌ Tidak | ✅ Kompatibel |
| Corporate inheritance | Baca dari `pusat` site | ❌ Tidak | ✅ Kompatibel |
| Role-based access | `siteMiddleware` Express | ❌ Tidak | ✅ Kompatibel |
| Cookie `siteId` | Next.js middleware | ❌ Tidak | ✅ Kompatibel |
| X-Site-ID header | Axios interceptor | ❌ Tidak | ✅ Kompatibel |

**Kesimpulan**: Tidak ada fitur multi-tenant yang bergantung pada Vercel, Railway, atau Supabase. Semua murni application logic.

### 9.0.3 Yang Harus Disiapkan untuk Multi-Site

| # | Komponen | Lokasi | Fungsi | Prioritas | Status |
|---|----------|--------|--------|-----------|--------|
| 1 | DNS wildcard `*.beritakarya.co` | Cloudflare | Semua subdomain mengarah ke server | **Wajib** | ☐ |
| 2 | Caddy wildcard config | CT 102 | Handle subdomain, forward ke Next.js | **Wajib** | ☐ |
| 3 | Cloudflare Tunnel wildcard | Cloudflare | Forward `*.beritakarya.co` ke Caddy | **Wajib** | ☐ |
| 4 | Hapus Railway URL default | `next.config.mjs` | Prevent redirect ke Railway | **Wajib** | ✅ |
| 5 | Tambah MinIO domain | `next.config.mjs` | Image optimization untuk media baru | **Wajib** | ✅ |
| 6 | Cron scheduler | CT 102 crontab | Cleanup jobs tetap jalan | **Wajib** | ☐ |

### 9.0.4 Multi-Tenant Flow di Self-Hosted

```
User buka bandung.beritakarya.co
         │
         ▼
    Cloudflare DNS (wildcard *.beritakarya.co → server IP)
         │
         ▼
    Cloudflare Tunnel → CT 102 Caddy (port 80)
         │
         ▼
    Caddy wildcard handler (*.beritakarya.co)
    ├── Terima request dengan Host: bandung.beritakarya.co
    └── reverse_proxy localhost:3000 (dengan Host header asli)
              │
              ▼
         Next.js (port 3000)
         │
         ▼
         proxy.ts middleware
         ├── Parse Host: bandung.beritakarya.co
         ├── Extract siteId: "bandung"
         ├── Set cookie: siteId=bandung
         └── Rewrite: / → /bandung/
              │
              ▼
         Browser render halaman /bandung/
              │
              ▼
         API call: /api/v1/articles?site=bandung
              │
              ▼
         Next.js rewrite → http://localhost:3001/api/v1/articles?site=bandung
              │
              ▼
         Express API (port 3001)
         ├── siteMiddleware baca X-Site-ID: bandung
         ├── Validate siteId exists in DB
         └── Prisma: WHERE siteId = 'bandung'
              │
              ▼
         Return data (hanya artikel milik site "bandung")
```

### 9.0.5 External Dependencies Summary

| Service | Status di Self-Hosted | Keterangan |
|---------|----------------------|------------|
| Vercel | ❌ **Dihapus** | Diganti PM2 + Caddy |
| Railway | ❌ **Dihapus** | Diganti PM2 + Caddy |
| Supabase PostgreSQL | ❌ **Dihapus** | Diganti PostgreSQL native di CT 101 |
| Supabase Storage | ❌ **Dihapus** | Diganti MinIO di CT 101 |
| OpenAI API | ✅ **Dipertahankan** | External API, tidak bisa self-host |
| Sentry | ✅ **Opsional** | Bisa dihapus atau dipertahankan |
| SMTP (Mailgun/Resend) | ✅ **Dipertahankan** | Email delivery perlu external service |
| Cloudflare | ✅ **Dipertahankan** | DNS, Tunnel, CDN — gratis |
| Unsplash | ✅ **Opsional** | Hanya untuk seed data demo |
| Google Analytics | ✅ **Opsional** | Placeholder, belum aktif |

---

## 10. Checklist Gabungan: Infra + Codebase

> **Prinsip**: Infrastruktur adalah kepastian. Codebase menyesuaikan.
> **Arsitektur**: Semua service native (tanpa Docker) di LXC Container.

### 9.1 Dependency Map

```
FASE 1 (Paralel)
├── [INFRA] MikroTik & Jaringan ──────────────────────┐
└── [CODE] Siapkan file .env, ecosystem.config.js ────┐│
                                                       ││
FASE 2 (Setelah Fase 1)                               ││
├── [INFRA] Proxmox + LXC Container ──────────────────┐││
└── [CODE] Clone repo ke CT 102 ──────────────────────┐│││
                                                       ││││
FASE 3 (Setelah Fase 2, Paralel per container)        ││││
├── [INFRA] CT 101: PostgreSQL + Redis + Meilisearch ─┐││││
├── [INFRA] CT 102: Node.js + pnpm + PM2 + Caddy ────┐│││││
└── [INFRA] CT 103: Prometheus + Grafana ─────────────┐││││││
                                                       │││││││
FASE 4 (Setelah Fase 3 selesai semua)                 │││││││
├── [CODE] db:generate + db:migrate + db:seed ────────┐│││││││
├── [CODE] pnpm build + copy static ──────────────────┐││││││││
└── [CODE] PM2 start + Caddy + Cloudflare ────────────┐│││││││││
                                                       ││││││││││
FASE 5 (Setelah Fase 4)                               ││││││││││
└── [VERIFY] Health check + Browser test ─────────────┘││││││││││
```

### 9.2 Checklist Per Fase

#### FASE 1: Persiapan (Paralel — Bisa Dimulai Bersamaan)

| # | Tipe | Task | Pemilik | Status |
|---|------|------|---------|--------|
| 1.1 | INFRA | Konfigurasi MikroTik (bridge, VLAN, DHCP, firewall) | Infra | ☐ |
| 1.2 | INFRA | Verifikasi VLAN 10 & 20 bisa ping gateway | Infra | ☐ |
| 1.3 | CODE | Buat `apps/api/.env` dengan kredensial production | Dev | ✅ |
| 1.4 | CODE | Buat `apps/web/.env.production` | Dev | ✅ |
| 1.5 | CODE | Buat `ecosystem.config.js` di root project | Dev | ✅ |
| 1.6 | CODE | Generate secrets (JWT, Redis, Meilisearch, MinIO, Admin) | Dev | ☐ |
| 1.7 | CODE | Ganti default Railway URL di `next.config.mjs` | Dev | ✅ |
| 1.8 | CODE | Tambah MinIO domain ke `remotePatterns` di `next.config.mjs` | Dev | ✅ |
| 1.9 | CODE | Tambah `CRON_SECRET` ke `.env` API | Dev | ✅ |
| 1.10 | INFRA | Setup DNS wildcard `*.beritakarya.co` di Cloudflare | Infra | ☐ |

**Dependensi**: 1.3-1.6 butuh kredensial dari infra (IP, password DB/Redis/Meilisearch). Pastikan 1.1 selesai dulu atau koordinasi nilai-nilai ini.

#### FASE 2: Proxmox & LXC

| # | Tipe | Task | Pemilik | Status |
|---|------|------|---------|--------|
| 2.1 | INFRA | Install Proxmox VE | Infra | ☐ |
| 2.2 | INFRA | Konfigurasi VLAN-aware bridge (vmbr0 + vmbr0.10) | Infra | ☐ |
| 2.3 | INFRA | Buat CT 101, 102, 103 dengan IP dan resource yang ditentukan | Infra | ☐ |
| 2.4 | INFRA | Verifikasi: `pct list` → semua running | Infra | ☐ |
| 2.5 | CODE | Clone repo ke CT 102 (`/var/www/beritakarya-prod`) | Dev | ☐ |
| 2.6 | CODE | Copy `.env` files ke CT 102 | Dev | ☐ |

**Dependensi**: 2.5-2.6 butuh CT 102 sudah running (2.3).

#### FASE 3: Konfigurasi Service (Paralel per Container)

| # | Tipe | Task | Container | Status |
|---|------|------|-----------|--------|
| 3.1 | INFRA | Global tuning (sysctl, limits.conf) | 101, 102, 103 | ☐ |
| 3.2 | INFRA | Install Node Exporter | 101, 102, 103 | ☐ |
| 3.3 | INFRA | Install & tuning PostgreSQL 15 | CT 101 | ☐ |
| 3.4 | INFRA | Install & tuning Redis 7 | CT 101 | ☐ |
| 3.5 | INFRA | Install & konfigurasi Meilisearch v1.6 | CT 101 | ☐ |
| 3.5b | INFRA | Install & konfigurasi MinIO (S3-compatible storage) | CT 101 | ☐ |
| 3.5c | INFRA | Buat MinIO buckets (`media`, `kyc`) & access key | CT 101 | ☐ |
| 3.6 | INFRA | Buat database, user, pg_hba.conf | CT 101 | ☐ |
| 3.7 | INFRA | Setup backup cron (retensi 3 hari) | CT 101 | ☐ |
| 3.8 | INFRA | Install PostgreSQL Exporter | CT 101 | ☐ |
| 3.9 | INFRA | Install Redis Exporter | CT 101 | ☐ |
| 3.10 | INFRA | Install Node.js 20, pnpm, PM2, Caddy | CT 102 | ☐ |
| 3.11 | INFRA | Install Prometheus + Grafana | CT 103 | ☐ |
| 3.12 | INFRA | Konfigurasi Prometheus scraping targets | CT 103 | ☐ |
| 3.13 | INFRA | Import Grafana dashboards | CT 103 | ☐ |

**Dependensi**: 3.3-3.9 di CT 101 bisa paralel dengan 3.10 di CT 102 dan 3.11-3.13 di CT 103.

#### FASE 4: Deploy Aplikasi

| # | Tipe | Task | Container | Status |
|---|------|------|-----------|--------|
| 4.1 | CODE | `pnpm install --frozen-lockfile` | CT 102 | ☐ |
| 4.2 | CODE | `pnpm --filter @beritakarya/api db:generate` | CT 102 | ☐ |
| 4.3 | CODE | `pnpm --filter @beritakarya/api db:migrate:deploy` | CT 102 | ☐ |
| 4.4 | CODE | `pnpm --filter @beritakarya/api db:seed` | CT 102 | ☐ |
| 4.5 | CODE | `pnpm build` | CT 102 | ☐ |
| 4.6 | CODE | Copy static assets (public + .next/static → standalone) | CT 102 | ☐ |
| 4.7 | CODE | `pm2 start ecosystem.config.js` | CT 102 | ☐ |
| 4.8 | CODE | `pm2 save && pm2 startup` | CT 102 | ☐ |
| 4.9 | INFRA | Konfigurasi Caddy wildcard (`/etc/caddy/Caddyfile`) | CT 102 | ☐ |
| 4.10 | INFRA | `systemctl restart caddy` | CT 102 | ☐ |
| 4.11 | INFRA | Setup Cloudflare Tunnel + wildcard routing | CT 102 | ☐ |
| 4.12 | INFRA | Setup cron scheduler (`/usr/local/bin/beritakarya-cron.sh`) | CT 102 | ☐ |
| 4.13 | VERIFY | Test multi-site subdomain (`pusat.beritakarya.co`) | Browser | ☐ |

**Dependensi**: 4.1-4.8 butuh Fase 3 selesai (DB, Redis, Meilisearch harus running). 4.9-4.11 butuh 4.7 selesai (PM2 harus jalan dulu).

#### FASE 5: Verifikasi & Go-Live

| # | Tipe | Task | Dari | Status |
|---|------|------|------|--------|
| 5.1 | VERIFY | `nc -zv 10.0.0.11 5432` → PostgreSQL OK | CT 102 | ☐ |
| 5.2 | VERIFY | `nc -zv 10.0.0.11 6379` → Redis OK | CT 102 | ☐ |
| 5.3 | VERIFY | `nc -zv 10.0.0.11 7700` → Meilisearch OK | CT 102 | ☐ |
| 5.3b | VERIFY | `nc -zv 10.0.0.11 9000` → MinIO OK | CT 102 | ☐ |
| 5.3c | VERIFY | Upload test foto ke MinIO → URL bisa diakses | CT 102 | ☐ |
| 5.4 | VERIFY | Dari CT 101: `ping google.com` → GAGAL (firewall block) | CT 101 | ☐ |
| 5.5 | VERIFY | `pm2 status` → semua online | CT 102 | ☐ |
| 5.6 | VERIFY | `curl http://localhost:3001/health` → healthy | CT 102 | ☐ |
| 5.7 | VERIFY | `curl http://localhost:3000` → 200 OK | CT 102 | ☐ |
| 5.8 | VERIFY | Buka `https://beritakarya.co` → Site tampil | Browser | ☐ |
| 5.8b | VERIFY | Buka `https://pusat.beritakarya.co` → Site tampil | Browser | ☐ |
| 5.8c | VERIFY | Buka `https://media.beritakarya.co/minio/health/live` → 200 | Browser | ☐ |
| 5.9 | VERIFY | Buka `https://api.beritakarya.co/api-docs` → Swagger | Browser | ☐ |
| 5.10 | VERIFY | Login admin → Berhasil | Browser | ☐ |
| 5.11 | VERIFY | Grafana dashboard tampil data | Browser | ☐ |
| 5.12 | VERIFY | Backup manual berhasil | CT 101 | ☐ |

### 9.3 Critical Path (Jalur Kritis)

Jalur terpanjang yang menentukan waktu minimum:

```
MikroTik setup (30m)
  → Proxmox install (1-2j)
    → LXC creation (15m)
      → CT 101 DB setup (1-2j)  ← bottleneck
        → CT 102 app deploy (1-2j)
          → PM2 + Caddy (30m)
            → Verifikasi (1-2j)

Total estimasi: 5-9 jam (1 hari kerja penuh)
```

**Tip**: CT 102 dan CT 103 bisa disetup paralel sambil menunggu CT 101 selesai.

### 9.4 Rollback Plan

Jika deploy gagal:

1. **Database issue**: Restore dari backup (`/var/backups/postgresql/`)
2. **Code issue**: `git checkout <commit_sebelumnya>` → rebuild → restart PM2
3. **Infra issue**: `pct reboot <CT_ID>` atau restore Proxmox snapshot
4. **Nuclear option**: `pct destroy <CT_ID>` → buat ulang container

---

> **Catatan**: Dokumen ini dibuat berdasarkan analisis codebase per 18 Juni 2026. Perubahan pada codebase setelah tanggal ini mungkin memerlukan revisi analisis.
>
> **Dokumen terkait**:
> - `implementasi-infra.md` — Plan detail infrastruktur (referensi utama)
> - `implementasi-codebase.md` — Plan detail penyesuaian codebase
> - `panduan_produksi_lxc.md` — Panduan teknis LXC container
> - `mikrotik-tutorial-expanded.md` — Panduan topologi jaringan
