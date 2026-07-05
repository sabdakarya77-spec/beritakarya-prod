# Infrastructure — BeritaKarya

> Panduan infrastruktur BeritaKarya: arsitektur sistem, konfigurasi LXC container, dan topologi jaringan MikroTik.

---

## 1. Architecture Overview

Arsitektur sistem BeritaKarya — platform CMS media digital multi-situs.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    Next.js 16 (App Router)                   │
│                    React 18 + Tailwind CSS                   │
│                    Zustand (state management)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                        Backend API                           │
│                    Express.js 4 + TypeScript                 │
│                    Prisma ORM + PostgreSQL                   │
│                    Redis (rate limiting)                     │
│                    Meilisearch (search)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Infrastructure (Self-Hosted LXC)                │
│                                                             │
│  MikroTik Router (Gateway, Firewall, VLAN)                  │
│       │                                                     │
│       └── VLAN 20 (10.0.0.0/24) — Server                   │
│           ├── CT 101 (10.0.0.11) — Database & Storage       │
│           │   ├── PostgreSQL 15                              │
│           │   ├── Redis 7                                    │
│           │   ├── Meilisearch v1.6                           │
│           │   └── MinIO (S3-compatible media storage)        │
│           ├── CT 102 (10.0.0.12) — API Server                │
│           │   ├── Express API (PM2 cluster)                  │
│           │   ├── Caddy (reverse proxy, API + Media)         │
│           │   └── Cloudflare Tunnel                          │
│                                                             │
│  External: Vercel (Frontend Next.js, wildcard subdomain)     │
│           └── CT 103 (10.0.0.13) — Monitoring               │
│               ├── Prometheus                                  │
│               ├── Grafana                                     │
│               └── Exporters (Node, PG, Redis)                │
│                                                             │
│  External: Cloudflare (DNS/Tunnel/CDN), OpenAI (AI API)     │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
beritakarya/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules (auth, article, etc.)
│   │   │   ├── middleware/      # Express middleware
│   │   │   ├── services/        # Business logic services
│   │   │   ├── lib/             # Utilities (redis, logger, env, etc.)
│   │   │   ├── cron/            # Scheduled tasks
│   │   │   ├── db/              # Prisma client
│   │   │   ├── ai/              # OpenAI integration
│   │   │   └── test/            # Test setup & fixtures
│   │   └── prisma/              # Schema & migrations
│   └── web/                    # Frontend Next.js
│       ├── app/[site]/         # Multi-site routing
│       ├── components/         # UI components
│       ├── store/              # Zustand stores
│       ├── lib/                # Utilities
│       └── tests/e2e/          # Playwright E2E tests
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared ESLint/TS config
├── docs/                       # Documentation
└── .github/workflows/          # CI/CD pipelines
```

### Backend Architecture

#### Module Pattern

Setiap fitur diorganisasikan sebagai module dengan struktur:

```
modules/<feature>/
├── <feature>.controller.ts     # Route handlers (HTTP layer)
├── <feature>.service.ts        # Business logic
├── <feature>.repository.ts     # Database access (Prisma)
├── <feature>.validator.ts      # Input validation (Zod)
└── <feature>.test.ts           # Unit tests
```

#### Key Modules

| Module | Endpoint | Description |
|--------|----------|-------------|
| auth | `/api/v1/auth` | Login, register, refresh, logout |
| article | `/api/v1/articles` | CRUD + editorial workflow |
| user | `/api/v1/users` | User management |
| category | `/api/v1/categories` | Global & site categories |
| site | `/api/v1/sites` | Multi-site management |
| media | `/api/v1/media` | File upload & management |
| ai | `/api/v1/ai` | AI features (rewrite, expand, headline, seo, grammar, readability, fact-check, objectivity, caption, summarize, translate, image-gen) |
| kyc | `/api/v1/kyc` | Identity verification |
| ad | `/api/v1/ads` | Advertisement system |
| notification | `/api/v1/notifications` | In-app notifications |
| comment | `/api/v1/comments` | Article comments |
| analytics | `/api/v1/analytics` | Page views & stats |
| audit | `/api/v1/audit` | Audit logs |

#### Middleware Pipeline

```
Request → CORS → Helmet → JWT Verify → Rate Limit → Site Middleware
  → Auth Middleware → Route Handler → Error Middleware → Response
```

#### Authentication Flow

1. User login → API validates credentials
2. API generates JWT access token (HttpOnly cookie)
3. API generates refresh token (stored in DB)
4. Subsequent requests: JWT verified by `jwtVerify` middleware
5. Token expired → Client calls `/auth/refresh` with refresh token
6. Logout → Tokens blacklisted/deleted

### Frontend Architecture

#### Multi-Site Routing

```
/[site]/                    # Site homepage
/[site]/artikel/[slug]      # Article page
/[site]/dashboard/          # Dashboard (auth required)
/[site]/dashboard/articles  # Article management
/[site]/dashboard/ads       # Ad management
/[site]/p/[slug]            # Static pages
```

#### State Management

- **Zustand stores**: `authStore`, `editorStore`
- **Server state**: Fetched via API calls (no React Query)
- **Local state**: React `useState` for UI state

#### Component Organization

```
components/
├── ui/               # Reusable UI components (NewsCard, SmartImage, Skeleton, FullScreenSearch, etc.)
├── layout/           # Navbar, SiteFooter, PublicSiteLayout, Container, MobileBottomNav
├── berita/           # News-specific components (MagazineBentoHero, dll.)
├── editor/           # TipTap rich text editor
├── legal/            # Legal document components
├── marketing/        # Landing page components
└── pages/            # Page-level components (SiteHomePage)
```

#### Accessibility

Frontend mengikuti standar WCAG 2.1 AA:

- **Focus management**: Global `:focus-visible` outline dengan `brand-red`, `prefers-reduced-motion` untuk menonaktifkan animasi
- **Keyboard navigation**: FullScreenSearch punya focus trap dan Escape handler; Navbar dropdown mendukung Enter/Space/Escape
- **ARIA attributes**: `role="dialog"` pada overlay, `aria-expanded`/`aria-haspopup` pada dropdown, `role="status"` pada skeleton loaders, `aria-live` pada search results
- **Skip-to-content**: Link "Langsung ke konten" sebelum navbar untuk keyboard/screen reader users
- **Touch targets**: Minimum 44px untuk semua elemen interaktif (bookmark buttons, nav icons, social icons, category chips)
- **Color contrast**: Navbar menggunakan `dark:` prefix untuk theme-aware colors; `--color-*` dan `--status-*` punya dark mode overrides

#### Design System Tokens

CSS custom properties di `globals.css` (light/dark):

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--brand-red` | #B91C1C | #EF4444 | Primary brand color |
| `--brand-text` | #0F172A | #F8FAFC | Primary text |
| `--brand-text-muted` | #64748B | #94A3B8 | Secondary text |
| `--bg-main` | #F8FAFC | #020617 | Page background |

Tailwind config memetakan token ini ke `brand-*` classes dengan opacity modifier support.

### Multi-Tenant Architecture

BeritaKarya menggunakan model **shared-database multi-tenant** dengan `siteId` sebagai partition key.

#### Site Resolution Flow

```
User → Subdomain (bandung.beritakarya.co)
     → Caddy wildcard handler
     → Next.js middleware (proxy.ts)
     ├── Parse Host header → siteId = "bandung"
     ├── Set cookie: siteId=bandung
     └── Rewrite: / → /bandung/
          → API call with X-Site-ID header
          → siteMiddleware validates siteId
          → Prisma: WHERE siteId = 'bandung'
```

#### Corporate Asset Inheritance

Branch sites inherit legal/branding fields from `pusat` (central) site at read time:
- `socialLinks`, `footerText`, `googleIndexingConfig`
- `aboutUs`, `codeOfEthics`, `editorial`, `advertising`
- `privacyPolicy`, `termsOfService`, `mediaSiber`

#### Site-Scoped Entities

All major tables have `siteId` foreign key: `User`, `Article`, `Category`, `Media`, `Advertisement`, `Comment`, `PageView`, `AuditLog`, `Notification`.

### Database Schema

#### Core Models

| Model | Description |
|-------|-------------|
| Site | Multi-site configuration |
| User | Users with KYC and AI quota fields |
| Article | Articles with versioning, workflow, and multi-category (max 3) |
| ArticleVersion | Article version history |
| ArticleCategory | Article-category many-to-many junction |
| Category | Global and site-specific categories |
| SiteCategory | Site-category junction for global category allowlists |
| Media | Uploaded files |
| Advertisement | Ad banners and slots |
| AdPackage | Ad pricing packages |
| AdBooking | Ad booking transactions |
| Comment | Article comments |
| Notification | In-app notifications |
| AuditLog | Editorial audit trail |
| PageView | Page view tracking |
| AIUsage | AI feature usage tracking |
| KYCViewLog | KYC document access log |
| Invitation | User invitations |
| RefreshToken | JWT refresh tokens |
| BlacklistedToken | Revoked tokens |

#### Article Workflow

```
draft → submitted → review → revision → approved → scheduled → published
                                                      ↓
                                              archived / rejected
```

### Security

- JWT HttpOnly cookies (not localStorage)
- CORS whitelist
- Redis-based rate limiting
- Helmet.js security headers
- Input sanitization (DOMPurify)
- KYC lock after failed attempts
- Soft delete with `deletedAt`
- AI quota limits per user/role

---

### Catatan Perubahan

#### Next.js Proxy Convention (19 Juni 2026)

Next.js 16 mengubah naming convention untuk edge middleware:

| Versi | File | Export | Status |
|-------|------|--------|--------|
| ≤ 15 | `middleware.ts` | `export function middleware()` | Deprecated di v16 |
| **16+** | **`proxy.ts`** | **`export function proxy()`** | **Current convention** |

**Riwayat perubahan di repo ini:**
1. Awalnya file bernama `proxy.ts` → di-rename ke `middleware.ts` (Phase 1 cleanup, mengikuti dokumentasi Next.js lama)
2. Build menghasilkan warning: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
3. Di-rename balik ke `proxy.ts` dengan export `proxy()` — warning hilang, build bersih

**Fungsi `proxy.ts`:**
- Subdomain routing: `bandung.beritakarya.co` → `siteId = "bandung"`
- Auth guard: `/dashboard` tanpa token → redirect ke `/login`
- URL rewrite: `/` → `/{siteId}/` secara internal
- Cookie `siteId` untuk client-side multi-site context

**Referensi**: `apps/web/proxy.ts`

---

## 2. Panduan Konfigurasi LXC Container

Dokumen ini menyediakan panduan langkah-demi-langkah yang terperinci untuk mengonfigurasi tiga LXC Container di Proxmox VE (VLAN 20) agar siap digunakan di lingkungan produksi (*production-ready*).

Berdasarkan dokumen arsitektur dan topologi jaringan, berikut adalah alokasi container kita:
- **CT 101 (`lxc-1-db`)**: `10.0.0.11` — Menjalankan PostgreSQL 15, Redis 7, dan Meilisearch v1.6.
- **CT 102 (`lxc-2-app`)**: `10.0.0.12` — Menjalankan Express API (PM2), Caddy, dan Cloudflare Tunnel. Frontend (Next.js) di-deploy ke **Vercel**.
- **CT 103 (`lxc-3-monitor`)**: `10.0.0.13` — Menjalankan Prometheus, Grafana, dan Exporters.

---

### BAB 1: Tuning Infrastruktur & Keamanan LXC (Global)

Sebelum masuk ke konfigurasi masing-masing layanan, lakukan tuning dasar pada setiap LXC Container untuk performa tinggi dan keamanan produksi.

#### 1.1 Optimasi Limit System File (`/etc/security/limits.conf`)
Secara default, Linux membatasi jumlah file yang terbuka (*open files*) untuk setiap user. Untuk menangani beban tinggi di App dan DB, tingkatkan limit ini.

Jalankan perintah berikut di ketiga container:
```bash
cat << 'EOF' >> /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF
```

#### 1.2 Tuning Sysctl untuk Performa Jaringan (`/etc/sysctl.d/99-production.conf`)
Tambahkan parameter berikut untuk mengoptimalkan stack jaringan kernel di semua container:
```bash
cat << 'EOF' > /etc/sysctl.d/99-production.conf
# Tingkatkan batas antrean koneksi
net.core.somaxconn = 32768

# Tingkatkan kapasitas memory buffer untuk TCP
net.ipv4.tcp_max_syn_backlog = 16384
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Mengaktifkan TCP Fast Open jika didukung
net.ipv4.tcp_fastopen = 3

# Optimasi penanganan koneksi TIME_WAIT
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
EOF

# Terapkan perubahan
sysctl -p /etc/sysctl.d/99-production.conf
```

---

### BAB 2: Konfigurasi `lxc-1-db` (Database, Cache, & Search)

Container ini dialokasikan 2 Core CPU dan 4 GB RAM. Layanan yang akan diinstal: PostgreSQL 15, Redis 7, dan Meilisearch v1.6.

#### 2.1 Menginstal PostgreSQL 15, Redis 7, dan Meilisearch
Jalankan langkah-langkah berikut di dalam `lxc-1-db` (`10.0.0.11`):

```bash
# 1. Update system dan pasang dependencies dasar
apt update && apt install -y curl gnupg2 lsb-release postgresql-common apt-transport-https ca-certificates

# 2. Tambahkan Repositori Resmi PostgreSQL
/usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y

# 3. Tambahkan Repositori Resmi Redis
curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/redis.list

# 4. Install PostgreSQL 15 & Redis 7
apt update
apt install -y postgresql-15 redis-server

# 5. Pasang Meilisearch v1.6 secara native (systemd)
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.6.2/meilisearch-linux-amd64 -o /usr/local/bin/meilisearch
chmod +x /usr/local/bin/meilisearch
```

#### 2.2 Tuning PostgreSQL 15 untuk Produksi (RAM 4 GB)
Ubah file konfigurasi `/etc/postgresql/15/main/postgresql.conf`:

```ini
# Buka koneksi dari jaringan internal VLAN 20
listen_addresses = '10.0.0.11'
max_connections = 100

# Tuning Memori untuk RAM 4 GB (Dialokasikan ~2 GB untuk Postgres)
shared_buffers = 1GB                    # 25% dari total RAM
effective_cache_size = 3GB              # 75% dari total RAM
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1                  # Nilai rendah untuk storage SSD
effective_io_concurrency = 200
work_mem = 10MB
huge_pages = off
min_wal_size = 1GB
max_wal_size = 4GB
```

##### Pengaturan Autentikasi (`/etc/postgresql/15/main/pg_hba.conf`):
Izinkan container aplikasi `lxc-2-app` (`10.0.0.12`) mengakses database menggunakan enkripsi password md5/scram-sha-256:

```text
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    beritakarya     berita_user     10.0.0.12/32            scram-sha-256
host    beritakarya     berita_user     10.0.0.13/32            scram-sha-256 # Untuk monitoring
```

##### Membuat Database dan User:
```bash
# Pindah ke user postgres dan buka psql
su - postgres -c "psql"
```
Di dalam console psql, jalankan query berikut:
```sql
CREATE DATABASE beritakarya;
CREATE USER berita_user WITH PASSWORD 'BuatPasswordSangatKuatDisini';
GRANT ALL PRIVILEGES ON DATABASE beritakarya TO berita_user;
ALTER DATABASE beritakarya OWNER TO berita_user;
\q
```

Mulai ulang layanan PostgreSQL:
```bash
systemctl restart postgresql
systemctl enable postgresql
```

#### 2.3 Tuning Redis 7 untuk Produksi
Edit file konfigurasi `/etc/redis/redis.conf`:

```ini
# Bind hanya ke IP internal VLAN 20
bind 10.0.0.11
protected-mode yes
port 6379

# Autentikasi
requirepass GantiDenganPasswordRedisKuatAnda!

# Manajemen Memori (Limit ke 512MB dari 4GB RAM)
maxmemory 512mb
maxmemory-policy allkeys-lru

# Disable command berbahaya di produksi demi keamanan
rename-command FLUSHDB "FLUSHDB_DISABLED"
rename-command FLUSHALL "FLUSHALL_DISABLED"
rename-command DEBUG "DEBUG_DISABLED"
```

Mulai ulang dan aktifkan layanan Redis:
```bash
systemctl restart redis-server
systemctl enable redis-server
```

#### 2.4 Konfigurasi Meilisearch v1.6
Buat systemd service untuk menjalankan Meilisearch secara aman di latar belakang.

Buat file `/etc/systemd/system/meilisearch.service`:
```ini
[Unit]
Description=Meilisearch v1.6 Search Engine
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/meilisearch --db-path /var/lib/meilisearch/data.ms --http-addr 10.0.0.11:7700 --master-key GantiDenganKeyMasterMeilisearchKuatMinimal32Karakter! --env production
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Jalankan perintah berikut untuk menginisialisasi folder data dan memulai layanan:
```bash
mkdir -p /var/lib/meilisearch
systemctl daemon-reload
systemctl start meilisearch
systemctl enable meilisearch
```

#### 2.5 Script Backup Database Otomatis (Cron)
Buat script backup otomatis untuk PostgreSQL yang berjalan setiap malam pukul 02:00.

Buat file `/usr/local/bin/backup_db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y-%m-%d_%H%M%S)
DB_NAME="beritakarya"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR
pg_dump -U postgres -h localhost -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_backup_$DATE.dump"

# Hapus backup yang lebih tua dari 7 hari
find $BACKUP_DIR -type f -name "${DB_NAME}_backup_*.dump" -mtime +$RETENTION_DAYS -delete
```
Jadikan executable dan tambahkan ke cron:
```bash
chmod +x /usr/local/bin/backup_db.sh
echo "0 2 * * * root /usr/local/bin/backup_db.sh" >> /etc/crontab
```

---

### BAB 3: Konfigurasi `lxc-2-app` (API Server)

Container ini dialokasikan 2 Core CPU dan 4 GB RAM untuk menjalankan backend Express API. Frontend (Next.js) di-deploy ke **Vercel**, tidak di container ini.

#### 3.1 Install Node.js LTS, PNPM, PM2, dan Caddy
Jalankan langkah-langkah berikut di `lxc-2-app` (`10.0.0.12`):

```bash
# 1. Install Node.js v20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git build-essential

# 2. Pasang PNPM secara global (paket manager monorepo)
npm install -g pnpm

# 3. Pasang PM2 secara global (process manager produksi)
npm install -g pm2

# 4. Pasang Caddy sebagai reverse proxy modern dengan SSL otomatis
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
```

#### 3.2 Deployment Aplikasi BeritaKarya
Clone repositori proyek ini ke direktori `/var/www/beritakarya-prod`:

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_REPOSITORI_ANDA> beritakarya-prod
cd beritakarya-prod

# Pasang dependency monorepo menggunakan pnpm
pnpm install --frozen-lockfile
```

#### 3.3 Konfigurasi Environment File (`.env`) untuk Produksi
Konfigurasikan environment file di masing-masing aplikasi.

##### 3.3.1 backend API: `/var/www/beritakarya-prod/apps/api/.env`
Salin file `.env.example` ke `.env` dan sesuaikan nilainya:
```ini
NODE_ENV=production
PORT=3001
API_URL=https://api.beritakarya.co          # Ganti dengan domain production API Anda
NEXT_PUBLIC_API_URL=https://api.beritakarya.co

# Koneksi Database mengarah ke lxc-1-db (10.0.0.11)
DATABASE_URL="postgresql://berita_user:BuatPasswordSangatKuatDisini@10.0.0.11:5432/beritakarya?schema=public&connection_limit=20"
DIRECT_URL="postgresql://berita_user:BuatPasswordSangatKuatDisini@10.0.0.11:5432/beritakarya?schema=public"

# Redis & Meilisearch mengarah ke lxc-1-db (10.0.0.11)
REDIS_HOST=10.0.0.11
REDIS_PORT=6379
REDIS_PASSWORD=GantiDenganPasswordRedisKuatAnda!
MEILISEARCH_HOST=http://10.0.0.11:7700
MEILISEARCH_KEY=GantiDenganKeyMasterMeilisearchKuatMinimal32Karakter!

# Security Secrets
JWT_SECRET=BuatRandom64CharHexStringDisiniUntukKeamananJWT
RESET_SECRET=BuatRandomSecretKeyLainDisiniUntukResetPassword
CORS_ORIGIN=https://beritakarya.co          # Domain utama frontend Anda
COOKIE_DOMAIN=.beritakarya.co

# MinIO Storage (BUKAN AWS S3 — ini MinIO self-hosted di CT 101)
# Variabel pakai prefix S3_ karena MinIO menggunakan protokol S3 yang sama
STORAGE_TYPE="s3"
S3_ENDPOINT="http://10.0.0.11:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="GantiDenganPasswordMinIOKuat!"
S3_FORCE_PATH_STYLE=true
S3_BUCKET="kyc"
S3_MEDIA_BUCKET="media"
# URL publik media melalui Caddy → MinIO
SUPABASE_STORAGE_PUBLIC_URL="https://media.beritakarya.co"

# Integrasi AI
OPENAI_API_KEY=sk-proj-YourProductionOpenAIApiKey
AI_MODEL=gpt-4o

# Email (SMTP) untuk OTP, Notifikasi Editorial, dll.
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS="Redaksi BeritaKarya <redaksi@beritakarya.co>"
SMTP_HOST=smtp.mailgun.org                  # Atau SMTP AWS SES / Gmail
SMTP_PORT=587
SMTP_USER=postmaster@beritakarya.co
SMTP_PASS=password_smtp_anda

# Sentry Monitoring
SENTRY_DSN=https://your_sentry_dsn_here

PAGEVIEW_RETENTION_DAYS=90
SEED_ADMIN_EMAIL=admin@beritakarya.co
SEED_ADMIN_PASSWORD=PasswordAdminAwal123!
```

##### 3.3.2 Frontend (Vercel — Tidak Perlu di Server)

Frontend di-deploy ke **Vercel**. Environment variables diatur di **Vercel Dashboard** → Project → Settings → Environment Variables:

| Variable | Nilai |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co` |
| `NEXT_PUBLIC_URL` | `https://beritakarya.co` |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` |

> Tidak perlu buat `.env.production` di server. Cukup set di Vercel Dashboard.

#### 3.4 Build API & Inisialisasi Database
Jalankan proses build di direktori root project:

```bash
# Generate Prisma client
pnpm --filter @beritakarya/api db:generate

# Jalankan migrasi schema database ke PostgreSQL target
pnpm --filter @beritakarya/api db:migrate:deploy

# Jalankan seeder database untuk data role quota awal dan superadmin
pnpm --filter @beritakarya/api db:seed

# Build API saja (frontend di Vercel, tidak perlu build di server)
pnpm --filter @beritakarya/api build
```

> **Catatan**: Tidak perlu build `apps/web` — frontend di-deploy ke Vercel via Git push.

#### 3.5 Konfigurasi PM2 Process Manager
Buat file konfigurasi `/var/www/beritakarya-prod/ecosystem.config.js` untuk mengelola proses API dengan PM2:

> **Catatan**: Hanya API — frontend (Next.js) di-deploy ke Vercel.

```javascript
module.exports = {
  apps: [
    {
      name: 'beritakarya-api',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/beritakarya-prod',
      instances: 2,                     // 2 workers (hemat RAM, cukup untuk 2 core)
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

**Estimasi RAM**: 2 × 800M = 1.6 GB + OS ~1 GB = ~2.6 GB dari 4 GB (aman).

Jalankan PM2 dan konfigurasikan autostart saat VM/LXC booting:
```bash
# Mulai semua aplikasi
pm2 start ecosystem.config.js

# Simpan list process PM2 saat ini
pm2 save

# Setup script auto-start pada system boot
pm2 startup
# Jalankan perintah output yang diberikan oleh sistem (biasanya perintah sudo/systemctl)
```

#### 3.6 Konfigurasi Caddy Reverse Proxy
Caddy hanya menangani **API** dan **media**. Frontend di-deploy ke Vercel.

Edit `/etc/caddy/Caddyfile`:
```caddy
# Backend REST API
api.beritakarya.co {
    reverse_proxy localhost:3001

    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-XSS-Protection "1; mode=block"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    log {
        output file /var/log/caddy/access_api.log {
            roll_size 50mb
            roll_keep 7
        }
    }
}

# Media (MinIO di CT 101)
media.beritakarya.co {
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
    }
}
```
Mulai ulang Caddy:
```bash
systemctl restart caddy
```

#### 3.7 Integrasi Cloudflare Tunnel
Cloudflare Tunnel mengekspos **API** dan **media** ke internet. Frontend di Vercel, tidak melewati tunnel.

```bash
# Unduh dan pasang cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb

# Login ke Cloudflare
cloudflared tunnel login

# Buat tunnel baru
cloudflared tunnel create beritakarya-api-tunnel

# Konfigurasi tunnel di /root/.cloudflared/config.yml:
# Hanya api dan media — frontend di Vercel
```

Config file `/root/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.beritakarya.co
    service: http://localhost:80
  - hostname: media.beritakarya.co
    service: http://localhost:80
  - service: http_status:404
```

```bash
# Jalankan tunnel sebagai systemd service
cloudflared service install <TUNNEL_TOKEN>
systemctl start cloudflared
systemctl enable cloudflared
```

**DNS di Cloudflare Dashboard:**

| Type | Name | Content | Keterangan |
|---|---|---|---|
| CNAME | `api` | `<TUNNEL_ID>.cfargotunnel.com` | API backend |
| CNAME | `media` | `<TUNNEL_ID>.cfargotunnel.com` | Media MinIO |
| CNAME | `beritakarya.co` | `cname.vercel-dns.com` | Frontend Vercel |
| CNAME | `*` | `cname.vercel-dns.com` | Wildcard Vercel |

---

### BAB 4: Konfigurasi `lxc-3-monitor` (Monitoring Stack)

Container ini dialokasikan 2 Core CPU dan 2 GB RAM. Layanan yang akan diinstal: Prometheus, Grafana, dan Exporter untuk pemantauan menyeluruh.

#### 4.1 Pemasangan Prometheus & Grafana
Jalankan langkah-langkah berikut di `lxc-3-monitor` (`10.0.0.13`):

```bash
# 1. Update system dan pasang dependencies dasar
apt update && apt install -y gpg systemd prometheus

# 2. Pasang Repositori Resmi Grafana
mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | tee /etc/apt/sources.list.d/grafana.list

# 3. Pasang Grafana OSS
apt update && apt install -y grafana

# 4. Mulai Layanan Grafana
systemctl daemon-reload
systemctl start grafana-server
systemctl enable grafana-server
```

#### 4.2 Mengonfigurasi Prometheus Scraping Target
Konfigurasikan Prometheus untuk menarik metrik sistem dari ketiga container via Node Exporter.

Edit file `/etc/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # System Metrics (Semua Container LXC)
  - job_name: 'node_exporters'
    static_configs:
      - targets: ['10.0.0.11:9100'] # lxc-1-db
        labels:
          instance: 'db'
      - targets: ['10.0.0.12:9100'] # lxc-2-app
        labels:
          instance: 'app'
      - targets: ['10.0.0.13:9100'] # lxc-3-monitor (Local)
        labels:
          instance: 'monitor'

  # PostgreSQL Metrics
  - job_name: 'postgres_exporter'
    static_configs:
      - targets: ['10.0.0.11:9187']

  # Redis Metrics
  - job_name: 'redis_exporter'
    static_configs:
      - targets: ['10.0.0.11:9121']
```
Mulai ulang Prometheus:
```bash
systemctl restart prometheus
systemctl enable prometheus
```

#### 4.3 Menginstal Exporters pada Container Target

##### 4.3.1 Pasang Node Exporter di SEMUA Container (`101`, `102`, `103`)
Di masing-masing container, jalankan:
```bash
apt update && apt install -y prometheus-node-exporter
systemctl restart prometheus-node-exporter
systemctl enable prometheus-node-exporter
```

##### 4.3.2 Pasang PostgreSQL Exporter di Container DB (`10.0.0.11`)
```bash
# Unduh binary pg_exporter
wget https://github.com/prometheus-community/postgres_exporter/releases/download/v0.15.0/postgres_exporter-0.15.0.linux-amd64.tar.gz
tar -xvf postgres_exporter-0.15.0.linux-amd64.tar.gz
mv postgres_exporter-0.15.0.linux-amd64/postgres_exporter /usr/local/bin/

# Buat user postgres_exporter untuk keamanan di DB console (psql)
# psql -U postgres -d beritakarya
# CREATE USER postgres_exporter WITH PASSWORD 'PasswordExporterAman123!';
# GRANT pg_monitor to postgres_exporter;

# Buat Systemd Service untuk Postgres Exporter
cat << 'EOF' > /etc/systemd/system/postgres_exporter.service
[Unit]
Description=Prometheus PostgreSQL Exporter
After=network.target

[Service]
User=root
Environment=DATA_SOURCE_NAME="postgresql://postgres_exporter:PasswordExporterAman123!@10.0.0.11:5432/beritakarya?sslmode=disable"
ExecStart=/usr/local/bin/postgres_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start postgres_exporter
systemctl enable postgres_exporter
```

##### 4.3.3 Pasang Redis Exporter di Container DB (`10.0.0.11`)
```bash
# Unduh dan pasang Redis Exporter
apt update && apt install -y prometheus-redis-exporter

# Sesuaikan konfigurasi jika Redis menggunakan password. Edit /etc/default/prometheus-redis-exporter:
# ARGS="-redis.addr 10.0.0.11:6379 -redis.password GantiDenganPasswordRedisKuatAnda!"

systemctl restart prometheus-redis-exporter
systemctl enable prometheus-redis-exporter
```

#### 4.4 Integrasi Dashboard dan Alerting di Grafana
1. Buka Grafana di browser: `http://10.0.0.13:3000` (Login awal: `admin`/`admin`).
2. Masuk ke **Connections** → **Data Sources** → Klik **Add data source** → Pilih **Prometheus**.
3. Atur URL ke `http://localhost:9090` dan klik **Save & test**.
4. **Import Dashboards**:
   - Untuk performa VM/LXC: Klik **Dashboards** → **New** → **Import** → Masukkan ID **1860** (Node Exporter Full) → Klik Load dan pilih datasource Prometheus.
   - Untuk PostgreSQL: Import ID **9628** (PostgreSQL Database Dashboard).
   - Untuk Redis: Import ID **763** (Redis Dashboard).

---

### BAB 5: Pengujian Kesiapan Produksi (*Verification & Readiness*)

Setelah semua container terkonfigurasi, kita harus memvalidasi integritas sistem.

#### 5.1 Verifikasi Konektivitas Jaringan
Pastikan tidak ada blokir firewall antar-LXC dalam VLAN 20.

Dari container aplikasi `lxc-2-app` (`10.0.0.12`), lakukan test ping dan cek port:
```bash
# Test koneksi ke Postgres (Port 5432) di lxc-1-db
nc -zv 10.0.0.11 5432
# Expected: Connection to 10.0.0.11 5432 port [tcp/postgresql] succeeded!

# Test koneksi ke Redis (Port 6379) di lxc-1-db
nc -zv 10.0.0.11 6379
# Expected: Connection to 10.0.0.11 6379 port [tcp/redis] succeeded!

# Test koneksi ke Meilisearch (Port 7700) di lxc-1-db
nc -zv 10.0.0.11 7700
# Expected: Connection to 10.0.0.11 7700 port [tcp/*] succeeded!
```

#### 5.2 Jalankan Script Verifikasi Internal BeritaKarya
Pindah ke direktori API backend di `lxc-2-app` (`10.0.0.12`) dan jalankan skrip pengujian bawaan:

```bash
cd /var/www/beritakarya-prod/apps/api

# 1. Jalankan Verifikasi Skema Offline
pnpm ts-node verify-database.ts
# Hasil yang diharapkan: Semua check (Schema, Multi-tenancy, Soft Delete, AI Quota, Indexes) berstatus PASSED.

# 2. Jalankan Uji Kesiapan Koneksi & Fungsionalitas Database Online
# Pastikan variabel DATABASE_URL menunjuk ke server PostgreSQL
pnpm ts-node test-database-readiness.ts
# Hasil yang diharapkan: "ALL TESTS PASSED - Database is production-ready!"
```


### Daftar Alokasi IP & VLAN

Lihat bagian 3 (Panduan Topologi Jaringan MikroTik & Proxmox) di bawah untuk topologi lengkap.



---

### Konfigurasi MikroTik & Proxmox VE

Konfigurasi jaringan (MikroTik RouterOS, Proxmox VE, VLAN, firewall) tidak termasuk dalam panduan ini. Lihat dokumentasi terpisah:

→ **[mikrotik-tutorial-expanded.md](./mikrotik-tutorial-expanded.md)** — Panduan lengkap setup MikroTik dari nol (VLAN, bridge, DHCP, firewall) dan Proxmox VE (VLAN-aware bridge, LXC container creation).

**Ringkasan Topologi:**

| VLAN | Subnet | Gateway | Kegunaan |
|------|--------|---------|----------|
| VLAN 10 (Admin) | `192.168.10.0/24` | `192.168.10.1` | Admin PC/Laptop, Proxmox Web UI |
| VLAN 20 (Server) | `10.0.0.0/24` | `10.0.0.1` | CT 101, CT 102, CT 103 |

| Perangkat | IP | VLAN |
|-----------|-----|------|
| Proxmox Host | `192.168.10.50` | 10 |
| CT 101 (Database) | `10.0.0.11` | 20 |
| CT 102 (App Stack) | `10.0.0.12` | 20 |
| CT 103 (Monitor) | `10.0.0.13` | 20 |

---

Dengan seluruh konfigurasi di atas, infrastruktur LXC, Database PostgreSQL/Redis/Meilisearch, Aplikasi Express/Next.js, serta Monitoring Prometheus/Grafana milik BeritaKarya kini siap dideploy untuk melayani trafik pengguna secara aman dan andal di lingkungan produksi.

---

## 3. Panduan Topologi Jaringan MikroTik & Proxmox

> **Dokumen ini**: Panduan merancang dan mengkonfigurasi topologi jaringan dari awal menggunakan satu unit **MikroTik Router** sebagai pusat jaringan (gateway, DHCP, firewall, dan routing) untuk home server **Proxmox VE** yang menjalankan workload **BeritaKarya**.
>
> **Tujuan**: Memisahkan jaringan rumah (LAN/WiFi) dengan jaringan server (Production) demi keamanan menggunakan **VLAN**, serta mengintegrasikannya dengan Proxmox tanpa memerlukan port forwarding (menggunakan Cloudflare Tunnel).

---

### 1. Topologi Fisik & Logis

#### 1.1 Diagram Jaringan (Physical & Logical)

```text
                           ┌──────────────────┐
                           │   ISP Internet   │
                           └────────┬─────────┘
                                    │ (Bridge Mode / DHCP Client)
                                    ▼ [Ether1 (WAN)]
                           ┌──────────────────┐
                           │ MikroTik Router  │
                           │    (Gateway)     │
                           └─┬──────────────┬─┘
                             │              │
                    [Ether2] │              │ [Ether3 - Ether5]
               (VLAN Trunk)  │              │ (Access Ports)
                             ▼              ▼
                     ┌──────────────┐┌──────────────┐
                     │ Proxmox Host ││ Personal PC, │
                     │  (Server)    ││ Smart TV, &  │
                     └──────┬───────┘│ Home AP (WiFi)│
                            │        └──────────────┘
            ┌───────────────┼───────────────┐
            │ VLAN 10       │ VLAN 20       │ VLAN 20
            ▼ (Management)  ▼ (Database)    ▼ (App Stack)
     ┌──────────────┐┌──────────────┐┌──────────────┐
     │ Proxmox WebUI││    CT 101    ││    CT 102    │
     │ 192.168.10.50││   lxc-1-db   ││  lxc-2-app   │
     └──────────────┘│  10.0.0.11   ││  10.0.0.12   │
                     └──────────────┘└──────────────┘
```

---

### 3. Detail Alokasi IP & VLAN (Opsi A)

Jika Anda memilih **Opsi A (Rekomendasi)**, berikut adalah rancangan segmentasi jaringannya:

| Nama Jaringan | ID VLAN | Subnet | IP Gateway (MikroTik) | Range DHCP | Kegunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WAN** | - | *Dynamic (ISP)* | - | - | Koneksi ke Internet (Modem ISP) |
| **VLAN_LAN (Admin)** | `10` | `192.168.10.0/24` | `192.168.10.1` | `192.168.10.100 - .254` | PC Admin, Laptop, AP WiFi Rumah, Host Proxmox WebUI |
| **VLAN_SRV (Server)**| `20` | `10.0.0.0/24` | `10.0.0.1` | *Static Only* (Lease via Mac) | LXC Container BeritaKarya (Database, App, Monitor) |

#### Alokasi IP Perangkat (Opsi A):
- **MikroTik Router**:
  - `192.168.10.1` (IP LAN Gateway)
  - `10.0.0.1` (IP Server Gateway)
- **Proxmox Host (Management Web UI)**: `192.168.10.50` (VLAN 10)
- **CT 101 (lxc-1-db)**: `10.0.0.11` (VLAN 20)
- **CT 102 (lxc-2-app)**: `10.0.0.12` (VLAN 20)
- **CT 103 (lxc-3-monitor)**: `10.0.0.13` (VLAN 20)

---

### 4. Konfigurasi MikroTik (Opsi A - Rekomendasi)

Berikut langkah konfigurasi menggunakan **RouterOS CLI** (dapat diinput via New Terminal di Winbox atau SSH).

#### 4.1 Persiapan Bridge & Port
Kita akan membuat satu Bridge utama bernama `bridge-local` dan mengaktifkan **VLAN Filtering** di dalamnya.

```routeros
# 1. Buat Bridge
/interface bridge
add name=bridge-local vlan-filtering=no comment="Bridge Utama"

# 2. Tambahkan Port Fisik ke Bridge
# Ether2 terhubung ke Proxmox (Trunk Port)
# Ether3, 4, 5 terhubung ke PC/AP (Access Port untuk VLAN 10 secara default)
/interface bridge port
add bridge=bridge-local interface=ether2 comment="Ke Proxmox Host"
add bridge=bridge-local interface=ether3 pvid=10 comment="Ke PC/AP Admin"
add bridge=bridge-local interface=ether4 pvid=10
add bridge=bridge-local interface=ether5 pvid=10
```

#### 4.2 Definisikan VLAN Interface pada MikroTik
Agar MikroTik dapat memiliki IP Address di masing-masing VLAN and berfungsi sebagai gateway.

```routeros
# Buat interface VLAN yang menginduk ke bridge-local
/interface vlan
add interface=bridge-local name=vlan10-LAN vlan-id=10
add interface=bridge-local name=vlan20-SRV vlan-id=20
```

#### 4.3 Alokasikan IP Address & DHCP Server
Kita akan memberikan IP ke interface VLAN dan mengatur DHCP Server untuk VLAN 10 (LAN). VLAN 20 (Server) menggunakan IP Static demi konsistensi infrastruktur.

```routeros
# 1. Assign IP Address ke Interface VLAN
/ip address
add address=192.168.10.1/24 interface=vlan10-LAN network=192.168.10.0
add address=10.0.0.1/24 interface=vlan20-SRV network=10.0.0.0

# 2. Setup Pool DHCP untuk VLAN 10
/ip pool
add name=pool-vlan10 ranges=192.168.10.100-192.168.10.254

# 3. Buat DHCP Server untuk VLAN 10
/ip dhcp-server
add address-pool=pool-vlan10 disabled=no interface=vlan10-LAN name=dhcp-vlan10

# 4. Daftarkan Network DHCP
/ip dhcp-server network
add address=192.168.10.0/24 dns-server=1.1.1.1,8.8.8.8 gateway=192.168.10.1
```

#### 4.4 Konfigurasi VLAN Table (Bridge VLAN)
Menentukan bagaimana paket ber-tag (tagged) dan tidak ber-tag (untagged) dilewatkan pada port bridge.

```routeros
/interface bridge vlan
# VLAN 10: Tagged di bridge-local (agar RouterOS bisa baca) dan Ether2 (Trunk), Untagged di Ether3,4,5 (Access)
add bridge=bridge-local tagged=bridge-local,ether2 untagged=ether3,ether4,ether5 vlan-ids=10

# VLAN 20: Tagged di bridge-local (untuk gateway) dan Ether2 (Trunk ke Proxmox)
add bridge=bridge-local tagged=bridge-local,ether2 vlan-ids=20
```

#### 4.5 Aktifkan VLAN Filtering di Bridge
**PENTING**: Lakukan langkah ini hanya jika Anda yakin konfigurasi di atas sudah benar. Jika Anda terhubung ke router via Ether3/4/5, Anda tidak akan terputus karena port tersebut sudah dikonfigurasi masuk ke VLAN 10.

```routeros
/interface bridge set bridge-local vlan-filtering=yes
```

#### 4.6 Konfigurasi Internet (WAN) & NAT
Asumsi modem ISP terhubung ke **Ether1**. Kita akan meminta IP otomatis dari ISP (DHCP Client) dan mengaktifkan NAT Masquerade.

```routeros
# 1. DHCP Client di Ether1 (WAN)
/ip dhcp-client
add disabled=no interface=ether1 use-peer-dns=yes use-peer-ntp=yes

# 2. NAT Masquerade agar LAN dan Server bisa akses internet
/ip firewall nat
add action=masquerade chain=srcnat out-interface=ether1 comment="NAT ke Internet"
```

---

### 5. Instalasi & Konfigurasi Proxmox VE Host (Opsi A)

Bagian ini mencakup seluruh proses dari nol: mulai dari membuat USB bootable, instalasi Proxmox VE, konfigurasi awal pasca-install, pengaturan network VLAN, hingga pembuatan LXC Container yang terhubung ke VLAN 20.

---

#### 5.0 Persiapan: Download & Buat USB Bootable

##### 5.0.1 Download ISO Proxmox VE

Unduh ISO terbaru dari situs resmi Proxmox:

```
https://www.proxmox.com/en/downloads/proxmox-virtual-environment/iso
```

Pilih versi **Proxmox VE 8.x** (versi terbaru yang tersedia). File ISO berukuran sekitar ~1.3 GB.

##### 5.0.2 Buat USB Bootable

**Menggunakan Rufus (Windows):**
1. Download Rufus dari `https://rufus.ie`
2. Colokkan USB Flash Drive minimal **4 GB**
3. Buka Rufus:
   - **Device**: Pilih USB Anda
   - **Boot selection**: Klik `SELECT` → pilih file ISO Proxmox
   - **Partition scheme**: `GPT` (untuk sistem UEFI modern) atau `MBR` (untuk sistem lama)
   - **File system**: biarkan default (`FAT32`)
4. Klik **START** → pilih mode **Write in ISO Image mode (Recommended)**
5. Tunggu hingga selesai (sekitar 2-3 menit)

**Menggunakan `dd` (Linux/macOS):**
```bash
# Ganti /dev/sdX dengan device USB Anda (cek dengan lsblk)
sudo dd if=proxmox-ve_8.x-1.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

> **Perhatian:** Pastikan target `of=` adalah USB Anda, bukan disk sistem! Double-check dengan `lsblk` sebelum menjalankan perintah ini.

---

#### 5.1 Instalasi Proxmox VE

##### 5.1.1 Boot dari USB

1. Colokkan USB bootable ke mesin server (PC/mini PC yang akan jadi Proxmox host)
2. Nyalakan mesin → masuk ke **BIOS/UEFI** (biasanya tekan `F2`, `F12`, `DEL`, atau `ESC` saat booting)
3. Di menu BIOS:
   - Pastikan **Secure Boot** di-**disable**
   - Pastikan **Virtualization Technology (VT-x / AMD-V)** di-**enable**
   - Set **Boot Order**: USB di urutan pertama
4. Simpan dan restart → mesin akan boot ke installer Proxmox

##### 5.1.2 Proses Installer Proxmox VE

**Layar 1 — Pilih mode install:**
Pilih **`Install Proxmox VE (Graphical)`**

**Layar 2 — License Agreement:**
Baca dan klik **`I Agree`**

**Layar 3 — Target Harddisk:**
- Pilih disk yang akan digunakan untuk instalasi (misal `sda` atau `nvme0n1`)
- Klik **`Options`** untuk mengatur filesystem:
  - **`ext4`**: Pilihan standar, cocok untuk kebanyakan kasus
  - **`ZFS (RAID0)`**: Pilih ini jika ingin fitur snapshot dan checksum (butuh lebih banyak RAM, minimal 8 GB)
- Klik **`Next`**

**Layar 4 — Lokasi & Zona Waktu:**
- **Country**: `Indonesia`
- **Time zone**: `Asia/Jakarta`
- **Keyboard Layout**: `U.S. English`
- Klik **`Next`**

**Layar 5 — Password & Email Admin:**
- **Password**: Buat password root yang kuat (minimal 12 karakter)
- **Confirm**: Ulangi password
- **Email**: Masukkan email admin (untuk notifikasi sistem)
- Klik **`Next`**

**Layar 6 — Konfigurasi Jaringan (PENTING):**

> Di sinilah kita set IP sementara agar bisa akses Web UI pertama kali. IP ini akan kita **ganti nanti** setelah VLAN dikonfigurasi.

- **Management Interface**: Pilih NIC fisik yang terhubung ke jaringan (misal `enp3s0` atau `eth0`)
- **Hostname (FQDN)**: `proxmox.beritakarya.local`
- **IP Address**: `192.168.10.50` *(sesuai alokasi VLAN 10)*
- **Netmask**: `255.255.255.0`
- **Gateway**: `192.168.10.1` *(IP MikroTik VLAN 10)*
- **DNS Server**: `1.1.1.1`

> **Catatan:** Jika MikroTik belum dikonfigurasi saat ini, isi sementara dengan IP jaringan yang sedang aktif (misal `192.168.1.50`, gateway `192.168.1.1`). IP ini bisa diubah setelah Proxmox terinstall.

- Klik **`Next`**

**Layar 7 — Summary:**
Review semua konfigurasi, pastikan sudah benar, lalu klik **`Install`**

**Proses instalasi** berlangsung sekitar 5-10 menit. Setelah selesai, installer akan menampilkan pesan sukses dan meminta restart.

1. Cabut USB Flash Drive
2. Klik **`Reboot`**

---

#### 5.2 Akses Pertama ke Web UI Proxmox

Setelah server restart, Proxmox siap diakses melalui browser.

##### 5.2.1 Buka Web UI

Dari PC Admin yang terhubung ke jaringan yang sama, buka browser dan akses:

```
https://192.168.10.50:8006
```

> Browser akan menampilkan **peringatan keamanan** karena sertifikat SSL self-signed. Klik **Advanced** → **Proceed** (aman untuk jaringan lokal).

Login dengan:
- **User**: `root`
- **Password**: *(password yang dibuat saat instalasi)*
- **Realm**: `Linux PAM standard authentication`

##### 5.2.2 Abaikan Peringatan Subscription

Proxmox akan menampilkan popup **"No valid subscription"**. Ini normal untuk penggunaan personal/non-enterprise. Klik **OK** untuk menutupnya.

---

#### 5.3 Konfigurasi Awal Pasca Install

Sebelum mengkonfigurasi jaringan VLAN, lakukan beberapa langkah penting ini terlebih dahulu.

##### 5.3.1 Nonaktifkan Repository Enterprise (Berbayar)

Secara default Proxmox menggunakan repository enterprise yang membutuhkan lisensi berbayar. Kita perlu menggantinya ke repository gratis.

Buka **Shell** melalui Web UI: **Proxmox Node** → **Shell**, lalu jalankan:

```bash
# 1. Nonaktifkan repo enterprise
echo "# deb https://enterprise.proxmox.com/debian/pve bookworm pve-enterprise" \
  > /etc/apt/sources.list.d/pve-enterprise.list

# 2. Nonaktifkan repo Ceph enterprise (jika ada)
if [ -f /etc/apt/sources.list.d/ceph.list ]; then
  sed -i 's|^deb|# deb|' /etc/apt/sources.list.d/ceph.list
fi

# 3. Tambahkan repo komunitas (gratis, no-subscription)
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" \
  > /etc/apt/sources.list.d/pve-no-subscription.list

# 4. Update package list
apt update
```

##### 5.3.2 Update Sistem

```bash
apt full-upgrade -y
```

Tunggu hingga proses update selesai. Jika ada pertanyaan konfirmasi tentang file konfigurasi, pilih **`N`** (keep existing config).

##### 5.3.3 Install Package Pendukung

```bash
apt install -y \
  ifupdown2 \
  curl \
  wget \
  git \
  htop \
  net-tools \
  lsof
```

> `ifupdown2` sangat penting — ini adalah versi modern dari ifupdown yang memungkinkan perintah `ifreload -a` berjalan tanpa perlu reboot saat mengubah konfigurasi network.

##### 5.3.4 (Opsional) Nonaktifkan Popup Subscription via Script

```bash
# Patch UI untuk menghilangkan popup "No valid subscription" permanen
sed -Ezi.bak "s/(Ext.Msg.show\(\{.*?title: gettext\('No valid sub)/void\(\{ \/\/\1/g" \
  /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js

# Restart layanan web Proxmox
systemctl restart pveproxy
```

---

#### 5.4 Konfigurasi Network VLAN-Aware

Ini adalah inti konfigurasi Proxmox untuk mendukung topologi **Opsi A (Centralized VLAN)**. Kita akan mengubah bridge `vmbr0` menjadi VLAN-aware dan menambahkan interface manajemen di VLAN 10.

##### 5.4.1 Cek Interface Fisik yang Tersedia

Sebelum mengedit konfigurasi, identifikasi nama NIC fisik server:

```bash
ip link show
# atau
ls /sys/class/net/
```

Catat nama interface fisik yang terhubung ke MikroTik `ether2`. Biasanya bernama `enp3s0`, `enp2s0`, `eth0`, dll. Panduan ini menggunakan `enp3s0` sebagai contoh — **sesuaikan dengan NIC Anda**.

##### 5.4.2 Backup Konfigurasi Network Lama

```bash
cp /etc/network/interfaces /etc/network/interfaces.bak
```

##### 5.4.3 Edit File `/etc/network/interfaces`

```bash
nano /etc/network/interfaces
```

Hapus seluruh isi yang ada, lalu ganti dengan konfigurasi berikut:

```text
auto lo
iface lo inet loopback

# ============================================================
# Interface Fisik — Terhubung ke MikroTik Ether2 (Trunk)
# ============================================================
iface enp3s0 inet manual
# Interface fisik dikosongkan (tidak diberi IP langsung).
# IP dikelola melalui bridge vmbr0 dan sub-interface VLAN.

# ============================================================
# vmbr0 — Bridge Utama, VLAN-Aware
# Menerima tagged frame dari MikroTik dan mendistribusikan
# ke VM/LXC berdasarkan VLAN Tag masing-masing.
# ============================================================
auto vmbr0
iface vmbr0 inet manual
        bridge-ports enp3s0
        bridge-stp off
        bridge-fd 0
        bridge-vlan-aware yes
        bridge-vids 2-4094
# bridge-vlan-aware yes  = aktifkan VLAN filtering
# bridge-vids 2-4094     = izinkan semua VLAN ID melewati bridge

# ============================================================
# vmbr0.10 — Interface Manajemen Host Proxmox (VLAN 10)
# IP statis 192.168.10.50 agar Web UI tetap bisa diakses
# dari PC Admin di VLAN 10.
# ============================================================
auto vmbr0.10
iface vmbr0.10 inet static
        address 192.168.10.50/24
        gateway 192.168.10.1
        dns-nameservers 1.1.1.1 8.8.8.8
# Catatan: vmbr0.10 = sub-interface VLAN ID 10 pada bridge vmbr0
```

Simpan file: **`Ctrl+X`** → **`Y`** → **`Enter`**

##### 5.4.4 Terapkan Konfigurasi Network Tanpa Reboot

```bash
ifreload -a
```

> Perintah ini memuat ulang semua interface sesuai file `/etc/network/interfaces` tanpa memutus sesi SSH secara permanen. Jika koneksi SSH sempat putus sebentar, tunggu 10-15 detik lalu hubungkan kembali ke IP `192.168.10.50`.

##### 5.4.5 Verifikasi Network Proxmox Host

```bash
# Cek interface yang aktif
ip addr show vmbr0
ip addr show vmbr0.10

# Pastikan IP 192.168.10.50 sudah terpasang
ip addr show vmbr0.10 | grep "inet "

# Cek routing — pastikan ada default route via 192.168.10.1
ip route show

# Ping gateway MikroTik
ping -c 4 192.168.10.1

# Ping internet
ping -c 4 1.1.1.1
```

Output yang diharapkan:
```text
PING 192.168.10.1 (192.168.10.1) 56(84) bytes of data.
64 bytes from 192.168.10.1: icmp_seq=1 ttl=64 time=0.5 ms
...
```

---

#### 5.5 Verifikasi VLAN-Aware di Web UI Proxmox

Setelah konfigurasi CLI diterapkan, verifikasi hasilnya di Web UI:

1. Buka Web UI: `https://192.168.10.50:8006`
2. Masuk ke **Proxmox Node** → **System** → **Network**
3. Pastikan `vmbr0` memiliki keterangan **VLAN aware: Yes**
4. Pastikan `vmbr0.10` terdaftar dengan IP `192.168.10.50/24`

Jika konfigurasi tampil benar di UI, Proxmox Host sudah siap menerima VLAN traffic dari MikroTik.

---

#### 5.6 Download Template LXC Container

Sebelum membuat container, download template OS yang akan digunakan (Debian 12 Bookworm direkomendasikan karena ringan dan kompatibel).

##### 5.6.1 Via Web UI

1. Di Web UI, klik **`local`** (storage default) → **`CT Templates`**
2. Klik **`Templates`**
3. Cari **`debian-12-standard`**
4. Klik **`Download`** dan tunggu hingga selesai

##### 5.6.2 Via CLI (Lebih Cepat)

```bash
# Lihat daftar template yang tersedia
pveam available | grep debian

# Download template Debian 12
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# Verifikasi template sudah terunduh
pveam list local
```

---

#### 5.7 Membuat LXC Container (CT 101 — Database)

Kita akan membuat **CT 101** untuk layanan database (`lxc-1-db`) dengan IP statis `10.0.0.11` di VLAN 20.

##### 5.7.1 Via Web UI Proxmox

1. Klik **`Create CT`** di pojok kanan atas Web UI
2. Isi form wizard secara berurutan:

**Tab General:**
| Field | Value |
|:------|:------|
| Node | `proxmox` |
| CT ID | `101` |
| Hostname | `lxc-1-db` |
| Password | *(buat password root container)* |
| Confirm password | *(ulangi password)* |

**Tab Template:**
| Field | Value |
|:------|:------|
| Storage | `local` |
| Template | `debian-13-standard_13.1-2_amd64.tar.zst` |

**Tab Disks:**
| Field | Value |
|:------|:------|
| Storage | `local-lvm` |
| Disk size (GiB) | `20` (sesuaikan kebutuhan DB) |

**Tab CPU:**
| Field | Value |
|:------|:------|
| Cores | `2` |

**Tab Memory:**
| Field | Value |
|:------|:------|
| Memory (MiB) | `4096` |
| Swap (MiB) | `2048` |

**Tab Network:**
| Field | Value |
|:------|:------|
| Name | `eth0` |
| Bridge | `vmbr0` |
| **VLAN Tag** | **`20`** ← Penting! |
| IPv4 | `Static` |
| IPv4/CIDR | `10.0.0.11/24` |
| Gateway (IPv4) | `10.0.0.1` |
| IPv6 | `DHCP` atau kosongkan |

**Tab DNS:**
| Field | Value |
|:------|:------|
| DNS domain | `local` |
| DNS servers | `1.1.1.1` |

3. Klik **`Finish`** — container akan dibuat dalam beberapa detik

##### 5.7.2 Via CLI (Alternatif)

```bash
pct create 101 local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst \
  --hostname lxc-1-db \
  --password "GantiDenganPasswordKuat!" \
  --storage local-lvm \
  --rootfs local-lvm:20 \
  --cores 2 \
  --memory 4096 \
  --swap 2048 \
  --net0 name=eth0,bridge=vmbr0,tag=20,ip=10.0.0.11/24,gw=10.0.0.1 \
  --nameserver 1.1.1.1 \
  --start 1
```

> Flag `--start 1` akan langsung menjalankan container setelah dibuat.

---

#### 5.8 Membuat LXC Container (CT 102 — API Server)

Ulangi proses yang sama untuk **CT 102** (`lxc-2-app`) — container ini menjalankan Express API dan Cloudflare Tunnel. Frontend (Next.js) di-deploy ke **Vercel**.

##### Via CLI:

```bash
pct create 102 local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst \
  --hostname lxc-2-app \
  --password "GantiDenganPasswordKuat!" \
  --storage local-lvm \
  --rootfs local-lvm:20 \
  --cores 2 \
  --memory 4096 \
  --swap 2048 \
  --net0 name=eth0,bridge=vmbr0,tag=20,ip=10.0.0.12/24,gw=10.0.0.1 \
  --nameserver 1.1.1.1 \
  --start 1
```

> CT 102 cukup **2 core, 4 GB RAM** karena hanya menjalankan API. Frontend di Vercel.

---

#### 5.9 Membuat LXC Container (CT 103 — Monitor)

**CT 103** (`lxc-3-monitor`) untuk stack monitoring (Grafana, Prometheus, dll).

##### Via CLI:

```bash
pct create 103 local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst \
  --hostname lxc-3-monitor \
  --password "GantiDenganPasswordKuat!" \
  --storage local-lvm \
  --rootfs local-lvm:10 \
  --cores 2 \
  --memory 2048 \
  --swap 1024 \
  --net0 name=eth0,bridge=vmbr0,tag=20,ip=10.0.0.13/24,gw=10.0.0.1 \
  --nameserver 1.1.1.1 \
  --start 1
```

---

#### 5.10 Verifikasi Container & Koneksi VLAN 20

##### 5.10.1 Cek Status Semua Container

```bash
# Lihat status semua CT
pct list
```

Output yang diharapkan:
```text
VMID  Status   Lock  Name
101   running        lxc-1-db
102   running        lxc-2-app
103   running        lxc-3-monitor
```

##### 5.10.2 Masuk ke Console CT 101 dan Uji Koneksi

```bash
# Masuk ke shell CT 101
pct enter 101
```

Di dalam container, jalankan:

```bash
# Cek IP sudah benar
ip addr show eth0
# Expected: inet 10.0.0.11/24

# Ping gateway MikroTik VLAN 20
ping -c 3 10.0.0.1
# Expected: 64 bytes from 10.0.0.1 ...

# Ping antar container (ke CT 102)
ping -c 3 10.0.0.12
# Expected: 64 bytes from 10.0.0.12 ...

# Keluar dari container
exit
```

##### 5.10.3 Masuk ke Console CT 102 dan Uji Internet

```bash
pct enter 102
```

```bash
# Ping internet
ping -c 3 1.1.1.1
# Expected: 64 bytes from 1.1.1.1 ...

# Test DNS resolution
ping -c 3 google.com
# Expected: 64 bytes dari IP Google

exit
```

##### 5.10.4 Update Package di Semua Container

Jalankan update pada masing-masing container setelah koneksi internet terverifikasi:

```bash
# CT 101
pct exec 101 -- bash -c "apt update && apt upgrade -y"

# CT 102
pct exec 102 -- bash -c "apt update && apt upgrade -y"

# CT 103
pct exec 103 -- bash -c "apt update && apt upgrade -y"
```

---

#### 5.11 (Opsional) Konfigurasi SSH Key untuk Akses Container

Agar bisa SSH langsung dari PC Admin ke container tanpa password:

```bash
# Di PC Admin (bukan di Proxmox), generate SSH key jika belum ada
ssh-keygen -t ed25519 -C "admin@beritakarya"

# Copy public key ke masing-masing container
# Ganti 192.168.10.50 dengan IP Proxmox, dan 101/102/103 dengan CT ID
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@192.168.10.50

# Dari Proxmox host, copy key ke container
# Atau gunakan pct exec untuk inject key langsung
pct exec 101 -- bash -c "mkdir -p /root/.ssh && echo 'PASTE_PUBLIC_KEY_ANDA_DISINI' >> /root/.ssh/authorized_keys && chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys"
```

Setelah itu, dari PC Admin di VLAN 10, Anda bisa SSH langsung ke container:

```bash
ssh root@10.0.0.11  # CT 101 - Database
ssh root@10.0.0.12  # CT 102 - App Stack
ssh root@10.0.0.13  # CT 103 - Monitor
```
