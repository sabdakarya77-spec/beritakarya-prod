# Implementasi Plan: Penyesuaian Codebase BeritaKarya untuk Produksi LXC

> **Prinsip**: Infrastruktur adalah **kepastian**. Codebase **menyesuaikan** dengan infra.
> **Frontend di Vercel**, backend & database self-hosted native di LXC (tanpa Docker).
> **Referensi**: `implementasi-infra.md` (sumber kebenaran infrastruktur)
> **Tanggal**: 18 Juni 2026

---

## Daftar Isi

1. [Prinsip Penyesuaian](#1-prinsip-penyesuaian)
2. [Fase 1: Environment Variables](#2-fase-1-environment-variables)
3. [Fase 2: PM2 Configuration](#3-fase-2-pm2-configuration)
4. [Fase 3: Build & Deploy Script](#4-fase-3-build--deploy-script)
5. [Fase 4: Codebase Adjustments](#5-fase-4-codebase-adjustments)
6. [Fase 5: Testing & Validation](#6-fase-5-testing--validation)
7. [Mapping Kredensial](#7-mapping-kredensial)
8. [Checklist Perubahan Codebase](#8-checklist-perubahan-codebase)

---

## 1. Prinsip Penyesuaian

### 1.1 Apa yang Berubah

| Dari (Cloud) | Ke (Hybrid) | Alasan |
|--------------|-------------|--------|
| Supabase PostgreSQL | PostgreSQL native di CT 101 | Self-hosted, lebih kontrol |
| Railway backend | PM2 + Caddy di CT 102 | Self-hosted, lebih murah |
| Vercel frontend | **Tetap di Vercel** | Hemat RAM server, dapat CDN + auto-scaling |
| Supabase Storage (S3) | MinIO di CT 101 | S3-compatible, full self-hosted, zero Supabase dependency |
| Redis managed | Redis native di CT 101 | Self-hosted |
| Meilisearch cloud | Meilisearch native di CT 101 | Self-hosted |

### 1.2 Apa yang TIDAK Berubah

- **Source code** — Tidak ada perubahan logic aplikasi
- **Prisma schema** — Tetap sama, hanya koneksi DB yang berubah
- **API routes** — Semua endpoint tetap sama
- **Frontend structure** — Next.js App Router tetap sama
- **Monorepo structure** — Turborepo + pnpm tetap sama

---

## 2. Fase 1: Environment Variables

### 2.1 API Backend (`apps/api/.env`)

> **Sumber nilai**: `implementasi-infra.md` — Fase 3 & 4 (kredensial CT 101)

```ini
# ============================================================
# BeritaKarya API — Production Environment
# Infra: CT 102 (10.0.0.12) → CT 101 (10.0.0.11)
# ============================================================

# === Application ===
NODE_ENV=production
PORT=3001
API_URL=https://api.beritakarya.co
NEXT_PUBLIC_API_URL=https://api.beritakarya.co

# === Database (PostgreSQL di CT 101) ===
# CATATAN: Tidak ada parameter pgbouncer, connection_limit, atau statement_cache_size
# karena ini koneksi direct ke PostgreSQL native, bukan Supabase
DATABASE_URL="postgresql://berita_user:<PASSWORD>@10.0.0.11:5432/beritakarya?schema=public&connection_limit=20&connect_timeout=10"
DIRECT_URL="postgresql://berita_user:<PASSWORD>@10.0.0.11:5432/beritakarya?schema=public"

# === Redis (di CT 101) ===
REDIS_HOST=10.0.0.11
REDIS_PORT=6379
REDIS_PASSWORD=<PASSWORD_REDIS>

# === Meilisearch (di CT 101) ===
MEILISEARCH_HOST=http://10.0.0.11:7700
MEILISEARCH_KEY=<MASTER_KEY_MEILISEARCH>

# === Security ===
JWT_SECRET=<RANDOM_64_CHAR_HEX>
RESET_SECRET=<RANDOM_SECRET_KEY>
CORS_ORIGIN=https://beritakarya.co
COOKIE_DOMAIN=.beritakarya.co

# === MinIO Storage (S3-compatible, self-hosted di CT 101) ===
# BUKAN AWS S3 — ini MinIO yang berjalan sendiri di server kita
# Variabel pakai prefix S3_ karena MinIO menggunakan protokol S3 yang sama
STORAGE_TYPE="s3"
S3_ENDPOINT="http://10.0.0.11:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="<PASSWORD_MINIO>"
S3_FORCE_PATH_STYLE=true
S3_BUCKET="kyc"
S3_MEDIA_BUCKET="media"
# URL publik melalui Cloudflare CDN → MinIO
SUPABASE_STORAGE_PUBLIC_URL="https://media.beritakarya.co"

# === AI ===
OPENAI_API_KEY=sk-proj-<YOUR_KEY>
AI_MODEL=gpt-4o

# === Email ===
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS="Redaksi BeritaKarya <redaksi@beritakarya.co>"
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@beritakarya.co
SMTP_PASS=<PASSWORD_SMTP>

# === Monitoring ===
SENTRY_DSN=https://<YOUR_SENTRY_DSN>

# === Misc ===
PAGEVIEW_RETENTION_DAYS=90
SEED_ADMIN_EMAIL=admin@beritakarya.co
SEED_ADMIN_PASSWORD=<PASSWORD_ADMIN>
```

### 2.2 Web Frontend (Vercel Environment Variables)

Frontend di-deploy ke **Vercel**. Environment variables diatur di **Vercel Dashboard** → Project → Settings → Environment Variables, bukan di file `.env.production`.

| Variable | Nilai | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co` | Production |
| `NEXT_PUBLIC_URL` | `https://beritakarya.co` | Production |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Production |
| `NEXT_PUBLIC_SITE_ID` | `pusat` | Production |

> **Catatan**: Tidak perlu buat `.env.production` di server. Cukup set di Vercel Dashboard.

### 2.3 Perbedaan dengan `.env.example` Saat Ini

| Variable | `.env.example` (Cloud) | `.env` (LXC) | Alasan Perubahan |
|----------|------------------------|--------------|------------------|
| `DATABASE_URL` | `supabase.co?pgbouncer=true` | `10.0.0.11:5432?connection_limit=20` | Direct connection, bukan PgBouncer |
| `DIRECT_URL` | `supabase.co:5432` | `10.0.0.11:5432` | IP internal VLAN 20 |
| `REDIS_HOST` | Tidak ada | `10.0.0.11` | Redis native di CT 101 |
| `MEILISEARCH_HOST` | `http://localhost:7700` | `http://10.0.0.11:7700` | Meilisearch di CT 101 |
| `S3_ENDPOINT` | `supabase.co/storage/v1/s3` | `http://10.0.0.11:9000` | MinIO di CT 101 (S3-compatible) |
| `SUPABASE_STORAGE_PUBLIC_URL` | `supabase.co/storage/v1/object/public` | `https://media.beritakarya.co` | Cloudflare CDN → MinIO |
| `COOKIE_DOMAIN` | Tidak ada | `.beritakarya.co` | Dibutuhkan untuk cookie sharing antar subdomain |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://beritakarya.co` | Domain production |

---

## 3. Fase 2: PM2 Configuration

### 3.1 File: `ecosystem.config.js` (di root project)

> **Catatan**: Hanya API — frontend (Next.js) di-deploy ke Vercel.

```javascript
module.exports = {
  apps: [
    {
      name: 'beritakarya-api',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/beritakarya-prod',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '800M',
      listen_timeout: 8000,
      kill_timeout: 3000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

### 3.2 Catatan Penting PM2

**Mengapa `instances: 2` bukan `'max'`?**

```
CT 102 RAM: 4 GB (dikurangi dari 6 GB karena frontend di Vercel)

Alokasi:
  - OS + system: ~1 GB
  - API (2 workers × 800MB max): ~1.6 GB
  - Caddy + Cloudflare: ~200 MB
  - Headroom: ~1.2 GB
  ─────────────────────────────
  Total: ~4 GB ✓

Jika instances = 'max' (= 4):
  - API (4 × 800MB): ~3.2 GB
  - Total: ~4.4 GB → OOM KILL ✗
```

**Frontend di Vercel** → tidak perlu PM2 process untuk Next.js. Hemat ~2 GB RAM.

---

## 3.3 Pre-Deploy: Clean Build (WAJIB)

> **Sebelum build pertama kali di production**, lakukan clean build untuk memastikan tidak ada artefak lama yang terbawa. Ini sekaligus jadi validasi akhir bahwa codebase benar-benar siap deploy.

### Langkah

```bash
cd /var/www/beritakarya-prod

# 1. Hapus semua artefak build & cache
rm -rf node_modules
rm -rf apps/api/dist
rm -rf apps/api/node_modules
rm -rf packages/*/node_modules
rm -rf .turbo

# 2. Install ulang dari clean state
pnpm install --frozen-lockfile

# 3. Generate Prisma client
pnpm --filter @beritakarya/api db:generate

# 4. Build API saja (frontend di Vercel, tidak perlu build di server)
pnpm --filter @beritakarya/api build

# 5. Verifikasi tidak ada error
echo "Build status: $?"
```

> **Catatan**: Tidak perlu build `apps/web` — frontend di-deploy ke Vercel via Git push.

### Mengapa Penting?

| Masalah | Dampak | Clean Build Fix |
|---------|--------|-----------------|
| `dist/` berisi compiled file lama yang source-nya sudah dihapus | Runtime error tak terduga | ✅ |
| `node_modules/` punya dependency versi lama | Bug atau vulnerability | ✅ |
| `.turbo/` cache stale | Build gagal atau silent error | ✅ |
| `.next/` build cache inconsistent | Halaman blank atau hydration error | ✅ |

### Kapan Harus Clean Build?

- ✅ **Pertama kali deploy** ke server baru
- ✅ **Setelah pull** perubahan besar (schema change, dependency update)
- ✅ **Sebelum go-live** production
- ❌ Tidak perlu untuk deploy rutin (cukup `pnpm install && pnpm build`)

---

## 4. Fase 3: Build & Deploy Script

### 4.1 Script Deploy (`scripts/deploy.sh`)

```bash
#!/bin/bash
# deploy.sh — Deploy BeritaKarya API ke production LXC
# Frontend auto-deploy ke Vercel via Git push
# Jalankan dari CT 102 (10.0.0.12)

set -e  # Exit on error

PROJECT_DIR="/var/www/beritakarya-prod"
LOG_FILE="/var/log/deploy-$(date +%Y%m%d-%H%M%S).log"

echo "=== BeritaKarya API Deploy Started: $(date) ===" | tee $LOG_FILE

# 1. Backup database dulu
echo "[1/6] Backing up database..." | tee -a $LOG_FILE
ssh root@10.0.0.11 "bash /usr/local/bin/backup_db.sh" 2>&1 | tee -a $LOG_FILE

# 2. Pull latest code
echo "[2/6] Pulling latest code..." | tee -a $LOG_FILE
cd $PROJECT_DIR
git pull origin main 2>&1 | tee -a $LOG_FILE

# 3. Install dependencies
echo "[3/6] Installing dependencies..." | tee -a $LOG_FILE
pnpm install --frozen-lockfile 2>&1 | tee -a $LOG_FILE

# 4. Generate Prisma client (WAJIB sebelum migrate)
echo "[4/6] Generating Prisma client..." | tee -a $LOG_FILE
pnpm --filter @beritakarya/api db:generate 2>&1 | tee -a $LOG_FILE

# 5. Run migrations (jika ada schema change)
echo "[5/6] Running database migrations..." | tee -a $LOG_FILE
pnpm --filter @beritakarya/api db:migrate:deploy 2>&1 | tee -a $LOG_FILE

# 6. Build API only (frontend di Vercel)
echo "[6/6] Building API..." | tee -a $LOG_FILE
pnpm --filter @beritakarya/api build 2>&1 | tee -a $LOG_FILE

# 7. Restart PM2
echo "[7/6] Restarting PM2..." | tee -a $LOG_FILE
pm2 reload ecosystem.config.js 2>&1 | tee -a $LOG_FILE

# 8. Verify
echo "[VERIFY] Checking health..." | tee -a $LOG_FILE
sleep 3
HEALTH=$(curl -s http://localhost:3001/health)
echo "API Health: $HEALTH" | tee -a $LOG_FILE

PM2_STATUS=$(pm2 jlist | python3 -c "import sys,json; apps=json.load(sys.stdin); print(all(a['pm2_env']['status']=='online' for a in apps))")
echo "PM2 All Online: $PM2_STATUS" | tee -a $LOG_FILE

echo "=== Deploy Completed: $(date) ===" | tee -a $LOG_FILE
echo "Frontend: auto-deployed ke Vercel via Git push ke main branch"
```

### 4.2 Script Setup Awal (`scripts/setup-production.sh`)

```bash
#!/bin/bash
# setup-production.sh — Setup awal BeritaKarya API di CT 102
# Frontend di-deploy ke Vercel (tidak perlu setup di server)
# Jalankan SEKALI setelah CT 102 siap

set -e

PROJECT_DIR="/var/www/beritakarya-prod"

echo "=== BeritaKarya Production Setup (API Only) ==="

# 1. Clone repository
echo "[1/6] Cloning repository..."
mkdir -p /var/www
cd /var/www
git clone <URL_REPOSITORI> beritakarya-prod
cd beritakarya-prod

# 2. Checkout main branch
git checkout main

# 3. Copy environment files
echo "[2/6] Setting up environment files..."
# PENTING: Edit file .env dengan nilai yang benar SEBELUM melanjutkan
echo ">>> EDIT apps/api/.env dengan kredensial production"
echo ">>> Frontend env diatur di Vercel Dashboard (bukan di server)"
read -p "Tekan Enter setelah selesai mengedit..."

# 4. Install dependencies
echo "[3/6] Installing dependencies..."
pnpm install --frozen-lockfile

# 5. Generate Prisma client
echo "[4/6] Generating Prisma client..."
pnpm --filter @beritakarya/api db:generate

# 6. Run migrations & seed
echo "[5/6] Running migrations and seed..."
pnpm --filter @beritakarya/api db:migrate:deploy
pnpm --filter @beritakarya/api db:seed

# 7. Build API only
echo "[6/6] Building API..."
pnpm --filter @beritakarya/api build

# 8. Setup PM2
echo "[PM2] Starting PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Verify: curl http://localhost:3001/health"
echo "  2. Configure Caddy: /etc/caddy/Caddyfile"
echo "  3. Setup Cloudflare Tunnel"
echo "  4. Setup Vercel: hubungkan repo ke Vercel, set env variables"
echo "  5. Test API: https://api.beritakarya.co/api-docs"
echo "  6. Test Frontend: https://beritakarya.co (Vercel)"
```

---

## 5. Fase 4: Codebase Adjustments

### 5.1 Perubahan yang Dibutuhkan di Source Code

Ada **5 perubahan kode** yang harus dilakukan untuk self-hosted. Tidak ada perubahan logic aplikasi — hanya konfigurasi dan cleanup:

#### ⚠️ 5.1.0 Perubahan Wajib di Source Code (SEBELUM Build)

**1. `apps/web/next.config.mjs` — Ganti default Railway URL**

```javascript
// SEBELUM (baris 64):
destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://web-production-aa8a.up.railway.app'}/api/v1/:path*`

// SESUDAH:
destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/:path*`
```

**2. `apps/web/next.config.mjs` — Tambah MinIO domain ke remotePatterns**

```javascript
// SEBELUM:
remotePatterns: [
  { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
]

// SESUDAH:
remotePatterns: [
  // Hapus atau komentar baris supabase.co
  // { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'media.beritakarya.co' },  // MinIO via Cloudflare CDN
]
```

**3. `apps/api/src/main.ts` — Hapus `vercel.app` dari CORS whitelist (opsional)**

```javascript
// SEBELUM:
const allowedOrigins: (string | RegExp)[] = [
  /^https?:\/\/(.+\.)?beritakarya\.co$/,
  /^https?:\/\/(.+\.)?beritakarya\.com$/,
  /^https?:\/\/(.+\.)?vercel\.app$/,        // ← hapus baris ini
  'http://localhost:3000',
  'http://localhost:3001',
]

// SESUDAH:
const allowedOrigins: (string | RegExp)[] = [
  /^https?:\/\/(.+\.)?beritakarya\.co$/,
  /^https?:\/\/(.+\.)?beritakarya\.com$/,
  'http://localhost:3000',
  'http://localhost:3001',
]
```

**4. `apps/web/proxy.ts` — Hapus handler Vercel/Railway subdomain (opsional)**

Kode yang menangani `.vercel.app` dan `.up.railway.app` subdomain di `proxy.ts` adalah dead code di self-hosted. Bisa dihapus atau dikomentari untuk kebersihan kode. Tidak wajib — tidak akan error jika dibiarkan.

**5. Tambahkan `CRON_SECRET` ke `.env` API**

```ini
# apps/api/.env — tambahkan baris ini
CRON_SECRET=<RANDOM_SECRET_UNTUK_CRON_AUTH>
```

Generate: `openssl rand -hex 32`

**Setelah 5 perubahan di atas, lanjutkan ke proses build biasa.**

#### 5.1.1 Tambahkan `ecosystem.config.js` ke Root Project

File baru di root monorepo. Sudah dijelaskan di Fase 2.

#### 5.1.2 Tambahkan `.env.example` untuk Self-Hosted

Buat file `apps/api/.env.example.selfhosted` sebagai referensi:

```ini
# .env.example.selfhosted
# Contoh environment untuk deployment self-hosted (Proxmox LXC)
# Lihat implementasi-codebase.md untuk penjelasan lengkap

NODE_ENV=production
PORT=3001
API_URL=https://api.beritakarya.co
NEXT_PUBLIC_API_URL=https://api.beritakarya.co

# Database — direct connection ke PostgreSQL native (bukan Supabase)
DATABASE_URL="postgresql://user:password@10.0.0.11:5432/beritakarya?schema=public&connection_limit=20&connect_timeout=10"
DIRECT_URL="postgresql://user:password@10.0.0.11:5432/beritakarya?schema=public"

# Redis — native install di CT 101
REDIS_HOST=10.0.0.11
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Meilisearch — native install di CT 101
MEILISEARCH_HOST=http://10.0.0.11:7700
MEILISEARCH_KEY=your_meilisearch_master_key_min_32_chars

# Security
JWT_SECRET=generate_random_64_char_hex_string
RESET_SECRET=generate_random_secret_key
CORS_ORIGIN=https://beritakarya.co
COOKIE_DOMAIN=.beritakarya.co

# MinIO Storage — BUKAN AWS S3, ini MinIO self-hosted di CT 101
STORAGE_TYPE="s3"
S3_ENDPOINT="http://10.0.0.11:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="your_minio_password"
S3_FORCE_PATH_STYLE=true
S3_BUCKET="kyc"
S3_MEDIA_BUCKET="media"
SUPABASE_STORAGE_PUBLIC_URL="https://media.beritakarya.co"

# AI
OPENAI_API_KEY=sk-proj-your_key
AI_MODEL=gpt-4o

# Email
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS="Redaksi BeritaKarya <redaksi@beritakarya.co>"
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@beritakarya.co
SMTP_PASS=your_smtp_password

SENTRY_DSN=https://your_sentry_dsn
PAGEVIEW_RETENTION_DAYS=90
SEED_ADMIN_EMAIL=admin@beritakarya.co
SEED_ADMIN_PASSWORD=your_admin_password
```

#### 5.1.3 Update `.gitignore`

Pastikan file produksi tidak masuk git:

```gitignore
# Production environment files
apps/api/.env.production
apps/web/.env.production
*.env.local
```

#### 5.1.4 Update `README.md` atau Buat `DEPLOY.md`

Tambahkan section deployment self-hosted:

```markdown
## Deployment Self-Hosted (Proxmox LXC)

Lihat dokumentasi lengkap:
- `docs/implementasi-infra.md` — Setup infrastruktur
- `docs/implementasi-codebase.md` — Setup codebase
- `docs/Analisa.md` — Analisa dan checklist gabungan

Quick deploy:
\`\`\`bash
# Di CT 102 (10.0.0.12)
cd /var/www/beritakarya-prod
bash scripts/deploy.sh
\`\`\`
```

### 5.2 Perubahan yang TIDAK Dibutuhkan

| Komponen | Alasan Tidak Berubah |
|----------|---------------------|
| `prisma/schema.prisma` | Schema tetap sama, hanya koneksi yang berubah |
| `apps/api/src/modules/*` | Semua 18 controller tetap sama, siteMiddleware tetap jalan |
| `apps/web/app/[site]/*` | Semua halaman multi-site tetap sama |
| `apps/api/src/services/storage.service.ts` | S3 client sudah compatible, hanya endpoint yang berubah via .env |
| `docker-compose.yml` | Tetap untuk development, tidak untuk production |
| `Dockerfile` (api & web) | Tetap untuk CI/CD, tidak untuk LXC production |
| `.github/workflows/*` | Tetap untuk CI, deploy bisa ditambahkan nanti |
| `apps/api/src/ai/*` | OpenAI integration tetap sama |
| `apps/api/src/auth/*` | JWT auth tetap sama, tidak pakai Supabase Auth |

---

## 6. Fase 5: Testing & Validation

### 6.1 Pre-Deploy Checklist (Di CT 102)

```bash
# 1. Verifikasi koneksi ke CT 101
nc -zv 10.0.0.11 5432  # PostgreSQL
nc -zv 10.0.0.11 6379  # Redis
nc -zv 10.0.0.11 7700  # Meilisearch

# 2. Verifikasi Node.js & pnpm
node --version    # v20.x
pnpm --version    # 10.x

# 3. Verifikasi PM2
pm2 --version

# 4. Verifikasi Caddy
caddy version
```

### 6.2 Post-Deploy Checklist

```bash
# 1. PM2 status
pm2 status
# Expected: 2 beritakarya-api online

# 2. API health
curl -s http://localhost:3001/health | jq .
# Expected: {"status":"healthy","database":"connected",...}

# 3. API via subdomain
curl -s -o /dev/null -w "%{http_code}" https://api.beritakarya.co/api-docs
# Expected: 200

# 4. Media CDN
curl -s -o /dev/null -w "%{http_code}" https://media.beritakarya.co/minio/health/live
# Expected: 200

# 5. API docs
curl -s -o /dev/null -w "%{http_code}" https://api.beritakarya.co/api-docs
# Expected: 200

# 6. Database connection from app
curl -s http://localhost:3001/api/v1/sites | jq '.data | length'
# Expected: > 0 (ada data site dari seed)

# 7. Frontend (Vercel)
curl -s -o /dev/null -w "%{http_code}" https://beritakarya.co
# Expected: 200

# 8. Multi-site subdomain (Vercel)
curl -s -o /dev/null -w "%{http_code}" https://bandung.beritakarya.co
# Expected: 200 (atau redirect ke login jika site belum ada)

# 9. PM2 memory usage
pm2 monit
# Expected: masing-masing worker < 800MB (API)
```

### 6.3 Stress Test (Opsional)

```bash
# Install autocannon
npm install -g autocannon

# Test API endpoint
autocannon -c 10 -d 30 http://localhost:3001/health

# Expected:
# - Latency avg < 100ms
# - Requests/sec > 1000
# - No errors
```

---

## 7. Mapping Kredensial

### 7.1 Sumber Kredensial

| Kredensial | Dihasilkan di | Digunakan di | Disimpan di |
|------------|---------------|--------------|-------------|
| PostgreSQL password | CT 101 (psql) | CT 102 (`.env`) | Password manager |
| Redis password | CT 101 (`redis.conf`) | CT 102 (`.env`) | Password manager |
| Meilisearch master key | CT 101 (systemd) | CT 102 (`.env`) | Password manager |
| MinIO root password | CT 101 (systemd) | CT 102 (`.env`) | Password manager |
| JWT secret | Generate random | CT 102 (`.env`) | Password manager |
| OpenAI API key | OpenAI dashboard | CT 102 (`.env`) | Password manager |
| SMTP credentials | Mailgun/SES dashboard | CT 102 (`.env`) | Password manager |
| Cloudflare tunnel token | Cloudflare dashboard | CT 102 (systemd) | Cloudflare dashboard |
| Admin seed password | Generate random | CT 102 (`.env`) | Password manager |

### 7.2 Contoh Generate Secrets

```bash
# JWT Secret (64 char hex)
openssl rand -hex 32

# Reset Secret (random string)
openssl rand -base64 48

# Redis Password (32 char)
openssl rand -base64 24

# Meilisearch Master Key (32+ char)
openssl rand -base64 32

# Admin Password
openssl rand -base64 16
```

---

## 8. Checklist Perubahan Codebase

### 8.1 File Baru yang Perlu Dibuat

| # | File | Lokasi | Tujuan | Status |
|---|------|--------|--------|--------|
| 1 | `ecosystem.config.js` | Root project | PM2 configuration | ✅ |
| 2 | `.env.example.selfhosted` | `apps/api/` | Referensi env untuk self-hosted | ✅ |
| 3 | `scripts/deploy.sh` | Root project | Script deploy otomatis | ✅ |
| 4 | `scripts/setup-production.sh` | Root project | Script setup awal | ✅ |

### 8.2 File yang Perlu Diupdate

| # | File | Perubahan | Status |
|---|------|-----------|--------|
| 1 | `.gitignore` | Tambahkan `.env.production` | ✅ |
| 2 | `README.md` | Tambahkan section deployment self-hosted | ✅ |

### 8.3 File yang TIDAK Perlu Diubah

| File | Alasan |
|------|--------|
| `prisma/schema.prisma` | Schema tidak berubah |
| `Dockerfile` (api & web) | Tetap untuk CI/CD |
| `turbo.json` | Pipeline tidak berubah |
| Semua source code di `src/` | Tidak ada logic change (kecuali CORS cleanup di `main.ts`) |

### 8.4 Urutan Eksekusi

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                          │
│                                                             │
│  Infra (CT 101)                                             │
│    │                                                        │
│    ├── PostgreSQL siap ──────┐                              │
│    ├── Redis siap ───────────┤                              │
│    └── Meilisearch siap ─────┤                              │
│                              ▼                              │
│  Infra (CT 102) — API Only                                  │
│    │                                                        │
│    ├── Node.js + pnpm install                               │
│    ├── Clone repo ───────────┐                              │
│    └── Buat .env ────────────┤                              │
│                              ▼                              │
│  Codebase (API Only)                                        │
│    │                                                        │
│    ├── pnpm install                                         │
│    ├── db:generate ───────────┐                             │
│    ├── db:migrate:deploy ─────┤                             │
│    ├── db:seed ───────────────┤                             │
│    └── pnpm --filter api build┤                             │
│                               ▼                             │
│  PM2 (API Only)                                             │
│    │                                                        │
│    ├── pm2 start ecosystem.config.js                        │
│    ├── pm2 save                                             │
│    └── pm2 startup                                          │
│          │                                                  │
│          ▼                                                  │
│  Caddy + Cloudflare Tunnel                                  │
│    │                                                        │
│    ├── Konfigurasi Caddyfile (API + Media)                  │
│    ├── systemctl restart caddy                              │
│    └── cloudflared setup                                    │
│          │                                                  │
│          ▼                                                  │
│  Vercel (Frontend)                                          │
│    │                                                        │
│    ├── Hubungkan repo ke Vercel                             │
│    ├── Set environment variables                            │
│    └── Auto-deploy setiap push ke main                      │
│          │                                                  │
│          ▼                                                  │
│  Verifikasi                                                 │
│    │                                                        │
│    ├── Health check API (self-hosted)                       │
│    ├── Buka https://beritakarya.co (Vercel)                 │
│    ├── Test subdomain (Vercel wildcard)                     │
│    └── Test koneksi DB                                      │
└─────────────────────────────────────────────────────────────┘
```

---

> **Dokumen ini mengikuti `implementasi-infra.md` sebagai sumber kebenaran. Semua nilai (IP, port, kredensial) mengacu ke infra yang sudah ditentukan. Jika ada konflik antara dokumen ini dan infra, **infra yang menang**.
