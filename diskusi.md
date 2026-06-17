# Diskusi: Deployment BeritaKarya ke Home Server

> **Status**: 📋 Plan — Belum diimplementasikan
>
> **Dokumen deploy utama**: [`docs/ssl_plan_vercel.md`](./ssl_plan_vercel.md) — **SATU-SATUNYA** sumber kebenaran untuk deployment.
>
> **Update terakhir**: 17 Juni 2026

---

## Konteks

BeritaKarya adalah multi-site digital media CMS dengan stack:
- **Backend**: Express.js, TypeScript, Prisma, PostgreSQL 15
- **Frontend**: Next.js 16 (App Router) → **deploy ke Vercel**
- **Cache**: Redis 7
- **Search**: Meilisearch v1.6
- **AI**: OpenAI API (GPT-4o)

Target: **API & database** di home server, **frontend** di Vercel.

---

## Spesifikasi Server

| Komponen | Spesifikasi |
|----------|-------------|
| CPU | AMD Ryzen 7 8700F (8 core / 16 thread) |
| RAM | 32 GB |
| Storage | SSHD 1 TB (hybrid SSD+HDD) |
| GPU | AMD RX 6700 XT (12 GB VRAM) |

---

## Arsitektur Split Deployment

### Kenapa Split?

Project **sudah dirancang untuk split deployment**:
- `apps/web/.env.local` → `NEXT_PUBLIC_API_URL=https://web-production-aa8a.up.railway.app`
- `apps/web/vercel.json` sudah ada (region: `sin1`)
- `apps/web/lib/api.ts` → browser pakai relative path (proxy), SSR pakai direct URL
- `apps/web/next.config.mjs` → rewrite `/api/v1/*` ke API server
- Auth-gated pages semuanya `use client` (dashboard), tidak SSR

### Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   VERCEL (Frontend)                    HOME SERVER (Backend)          │
│   ┌─────────────────────┐             ┌─────────────────────────────┐│
│   │                     │             │    Proxmox VE               ││
│   │   Next.js (SSR)     │             │    Ryzen 7 8700F            ││
│   │   App Router        │             │    32 GB RAM                ││
│   │                     │             │    SSHD 1 TB                ││
│   │   ┌───────────────┐ │             │                             ││
│   │   │  Pages (SSR)  │ │   fetch()   │  ┌───────────────────────┐  ││
│   │   │  - artikel    │─┼─────────────┼─►│  LXC-2: API Stack     │  ││
│   │   │  - sitemap    │ │   (direct)  │  │                       │  ││
│   │   │  - manifest   │ │             │  │  ┌─────────────────┐  │  ││
│   │   └───────────────┘ │             │  │  │    Caddy        │  │  ││
│   │                     │             │  │  │  :80 / :443     │  │  ││
│   │   ┌───────────────┐ │             │  │  │  (reverse proxy)│  │  ││
│   │   │  Client-side  │ │   /api/v1/* │  │  └────────┬────────┘  │  ││
│   │   │  (use client) │─┼─────────────┼──┼───────────┤           │  ││
│   │   │  - dashboard  │ │  (rewrite   │  │  ┌────────▼────────┐  │  ││
│   │   │  - auth       │ │   proxy)    │  │  │   Express API   │  │  ││
│   │   │  - editor     │ │             │  │  │   :3001         │  │  ││
│   │   └───────────────┘ │             │  │  └────────┬────────┘  │  ││
│   │                     │             │  │           │           │  ││
│   └─────────────────────┘             │  │  ┌────────▼────────┐  │  ││
│            │                          │  │  │  Meilisearch   │  │  ││
│            │                          │  │  │  :7700         │  │  ││
│            ▼                          │  │  └─────────────────┘  │  ││
│   ┌─────────────────────┐             │  │                       │  ││
│   │     Browser         │             │  │  IP: 10.0.0.12       │  ││
│   │     (User)          │             │  │  RAM: 4-6 GB         │  ││
│   └─────────────────────┘             │  │  CPU: 4 core         │  ││
│                                       │  └───────────────────────┘  ││
│                                       │                             ││
│                                       │  ┌───────────────────────┐  ││
│                                       │  │  LXC-1: Database      │  ││
│                                       │  │                       │  ││
│                                       │  │  ┌─────────────────┐  │  ││
│                                       │  │  │   PostgreSQL    │  │  ││
│                                       │  │  │   :5432         │  │  ││
│                                       │  │  └─────────────────┘  │  ││
│                                       │  │                       │  ││
│                                       │  │  ┌─────────────────┐  │  ││
│                                       │  │  │     Redis       │  │  ││
│                                       │  │  │     :6379       │  │  ││
│                                       │  │  └─────────────────┘  │  ││
│                                       │  │                       │  ││
│                                       │  │  IP: 10.0.0.11       │  ││
│                                       │  │  RAM: 2-4 GB         │  ││
│                                       │  │  CPU: 2 core         │  ││
│                                       │  └───────────────────────┘  ││
│                                       │                             ││
│                                       │  ┌───────────────────────┐  ││
│                                       │  │  LXC-3: Monitoring    │  ││
│                                       │  │                       │  ││
│                                       │  │  - Uptime Kuma        │  ││
│                                       │  │  - Grafana            │  ││
│                                       │  │  - Prometheus         │  ││
│                                       │  │                       │  ││
│                                       │  │  IP: 10.0.0.13       │  ││
│                                       │  │  RAM: 1-2 GB         │  ││
│                                       │  │  CPU: 2 core         │  ││
│                                       │  └───────────────────────┘  ││
│                                       └─────────────────────────────┘│
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐ │
│   │              Cloudflare Tunnel (免费)                            │ │
│   │              api.beritakarya.co → 10.0.0.12:443                 │ │
│   │              - Automatic TLS                                     │ │
│   │              - No port forwarding needed                         │ │
│   │              - DDoS protection                                   │ │
│   └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Kenapa Nginx Tidak Perlu?

### Perbandingan Reverse Proxy untuk Kasus Ini

| Aspek | Caddy | Nginx |
|-------|-------|-------|
| Konfigurasi | 5-10 baris | 30-50 baris |
| Auto HTTPS | Built-in | Perlu Certbot |
| Static files | Tidak perlu (Vercel handle) | Tidak perlu |
| SSR rendering | Tidak perlu (Vercel handle) | Tidak perlu |
| API proxy saja | ✅ Cukup | Overkill |
| Auto-renew cert | Otomatis | Perlu cron certbot |

### Kenapa Caddy Cukup?

Karena traffic ke home server **hanya API calls**, bukan full website:

```
Traffic Flow:

Browser ──► Vercel (Next.js)
              │
              ├── Static files (CSS, JS, images) → Vercel CDN
              ├── SSR pages → Vercel Edge
              └── /api/v1/* → Cloudflare Tunnel → Caddy → Express
                                                        → PostgreSQL
                                                        → Redis
                                                        → Meilisearch
```

Yang perlu di-handle Caddy:
1. Terima request `/api/v1/*` dari Cloudflare Tunnel
2. Proxy ke Express `:3001`
3. HTTPS termination (dari Cloudflare Tunnel)
4. Rate limiting dasar

**Tidak perlu**:
- ❌ Serve static files
- ❌ Handle SSR
- ❌ WebSocket
- ❌ Load balancing (single server)
- ❌ Complex routing rules

### Kenapa Tetap Bisa Pakai Nginx?

Kalau lebih familiar dengan Nginx, tidak masalah. Tapi config-nya lebih verbose:

```nginx
# Nginx (30+ baris)
server {
    listen 443 ssl;
    server_name api.beritakarya.co;

    ssl_certificate /etc/letsencrypt/live/api.beritakarya.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.beritakarya.co/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

```caddyfile
# Caddy (3 baris)
api.beritakarya.co {
    reverse_proxy localhost:3001
}
```

**Rekomendasi**: Caddy untuk simplicity. Nginx kalau butuh fine-grained control.

---

## Request Flow Diagram

### Flow 1: Public Page (SSR)

```
┌──────────┐     ┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Browser │────►│  Vercel  │────►│  Cloudflare     │────►│  Caddy       │
│          │     │  (SSR)   │     │  Tunnel         │     │  :443        │
└──────────┘     └────┬─────┘     └─────────────────┘     └──────┬───────┘
                      │                                          │
                      │  GET /artikel/judul-artikel              │
                      │                                          │
                      │     fetch(API_URL/api/v1/articles/...)   │
                      │     (server-side, tanpa cookie)          │
                      │                                          │
                      │                              ┌───────────▼────────┐
                      │                              │   Express API      │
                      │                              │   :3001            │
                      │                              └───────────┬────────┘
                      │                                          │
                      │                              ┌───────────▼────────┐
                      │                              │   PostgreSQL       │
                      │                              │   :5432            │
                      │                              └────────────────────┘
                      │                                          │
                      │     ◄─── HTML (rendered) ────────────────┘
                      │
          ◄───────────┘
          HTML response
```

### Flow 2: Client-side API Call (Auth, Dashboard)

```
┌──────────┐     ┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Browser │────►│  Vercel  │────►│  Cloudflare     │────►│  Caddy       │
│          │     │  (proxy) │     │  Tunnel         │     │  :443        │
│  /api/*  │     │  rewrite │     │                 │     └──────┬───────┘
└──────────┘     └──────────┘     └─────────────────┘            │
     │                                                          │
     │  Cookie: session=xxx (httpOnly)                    ┌─────▼──────┐
     │  Header: X-Site-ID: xxx                            │  Express   │
     │                                                    │  API       │
     │                                                    └─────┬──────┘
     │                                                          │
     │                              ┌───────────────────────────┼──────────┐
     │                              │                           │          │
     │                        ┌─────▼──────┐  ┌─────────▼──┐  ┌▼────────┐ │
     │                        │ PostgreSQL │  │   Redis    │  │ Meili   │ │
     │                        │   :5432    │  │   :6379    │  │  :7700  │ │
     │                        └────────────┘  └────────────┘  └─────────┘ │
     │                              │                           │         │
     │                              └───────────────────────────┘         │
     │                                          │                         │
     │     ◄─── JSON response ──────────────────┘                         │
     │                                                                    │
◄────┘
JSON
```

### Flow 3: Authentication (Login)

```
┌──────────┐     ┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Browser │────►│  Vercel  │────►│  Cloudflare     │────►│  Caddy       │
│          │     │  (proxy) │     │  Tunnel         │     │  :443        │
│  POST    │     │  rewrite │     │                 │     └──────┬───────┘
│  /auth   │     └──────────┘     └─────────────────┘            │
│  /login  │                                                    │
└────┬─────┘                                          ┌─────────▼────────┐
     │                                                │   Express API    │
     │                                                │   POST /auth/    │
     │                                                │   login          │
     │                                                └─────────┬────────┘
     │                                                          │
     │                                                ┌─────────▼────────┐
     │                                                │   PostgreSQL     │
     │                                                │   (verify user)  │
     │                                                └─────────┬────────┘
     │                                                          │
     │                                                ┌─────────▼────────┐
     │                                                │   Redis          │
     │                                                │   (rate limit    │
     │                                                │    check)        │
     │                                                └─────────┬────────┘
     │                                                          │
     │     ◄─── Set-Cookie: session=xxx ────────────────────────┘
     │          (httpOnly, secure, sameSite=none)
     │          (domain: .beritakarya.co)
     │
     │  Cookie tersimpan di browser, dikirim ke Vercel domain
     │  Vercel proxy meneruskan cookie ke API
     │
◄────┘
200 OK + Cookie
```

---

## LXC-1: Database Stack

### Profil

| Item | Detail |
|------|--------|
| **Nama** | `lxc-1-db` |
| **OS Template** | Debian 12 (minimal) |
| **RAM** | 2 GB (burst 4 GB) |
| **CPU** | 2 core |
| **Disk** | 20 GB (root) + bind-mount `/data/pve/lxc-1-db` |
| **IP** | `10.0.0.11` (static) |
| **Fungsi** | Database utama dan caching |

### Service

```
LXC-1: Database Stack
│
├── PostgreSQL 15
│   ├── Port: 5432 (internal only)
│   ├── Data: /data/pve/lxc-1-db/postgres/
│   ├── Config: tuned untuk 2 GB RAM
│   │   ├── shared_buffers = 512MB
│   │   ├── effective_cache_size = 1536MB
│   │   ├── work_mem = 16MB
│   │   └── max_connections = 100
│   └── Database: beritakarya
│
├── Redis 7
│   ├── Port: 6379 (internal only)
│   ├── Data: /data/pve/lxc-1-db/redis/
│   ├── Maxmemory: 512MB
│   ├── Policy: allkeys-lru
│   └── Password protected: ya
│
└── Docker Compose
    └── docker-compose.yml (2 service)
```

### Docker Compose

```yaml
# /opt/lxc-1-db/docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: bk-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: beritakarya
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - /data/pve/lxc-1-db/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d beritakarya"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: bk-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - /data/pve/lxc-1-db/redis:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 768M
```

### Backup Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Backup Flow                           │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  PostgreSQL  │    │    Redis     │    │  Proxmox  │  │
│  │  pg_dump     │    │  RDB/AOF     │    │  Snapshot │  │
│  └──────┬───────┘    └──────┬───────┘    └─────┬─────┘  │
│         │                   │                   │        │
│         ▼                   ▼                   ▼        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              /data/pve/lxc-1-db/backups/          │   │
│  │                                                    │   │
│  │  ├── daily/     (retensi: 7 hari)                 │   │
│  │  ├── weekly/    (retensi: 4 minggu)               │   │
│  │  └── monthly/   (retensi: 6 bulan)                │   │
│  └────────────────────────────────────────────────────┘   │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────────┐                                     │
│  │  External Drive  │  (rsync mingguan)                   │
│  └──────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

### Cron Jobs

```bash
# /etc/cron.d/beritakarya-backup
0 2 * * *   root /opt/scripts/backup-db.sh daily
0 3 * * 0   root /opt/scripts/backup-db.sh weekly
0 4 1 * *   root /opt/scripts/backup-db.sh monthly
0 5 * * *   root /opt/scripts/cleanup-backups.sh
```

---

## LXC-2: API Stack

### Profil

| Item | Detail |
|------|--------|
| **Nama** | `lxc-2-app` |
| **OS Template** | Debian 12 (minimal) |
| **RAM** | 4 GB (burst 6 GB) |
| **CPU** | 4 core |
| **Disk** | 15 GB (root) + bind-mount `/data/pve/lxc-2-app` |
| **IP** | `10.0.0.12` (static) |
| **Fungsi** | API server, search engine, reverse proxy |

### Service

```
LXC-2: API Stack
│
├── Caddy (Reverse Proxy)
│   ├── Port: 80 (HTTP)
│   ├── Port: 443 (HTTPS)
│   ├── Auto TLS dari Cloudflare Tunnel
│   ├── Rate limiting
│   └── Security headers
│
├── Express API (Backend)
│   ├── Port: 3001 (internal only)
│   ├── Mode: node dist/main.js
│   ├── Connects to: PostgreSQL :5432 (via 10.0.0.11)
│   ├── Connects to: Redis :6379 (via 10.0.0.11)
│   ├── Connects to: Meilisearch :7700 (local)
│   ├── Swagger: /api-docs
│   └── Health check: /health
│
├── Meilisearch v1.6
│   ├── Port: 7700 (internal only)
│   ├── Data: /data/pve/lxc-2-app/meili/
│   ├── Index: articles
│   └── Master key: protected
│
└── Docker Compose
    └── docker-compose.yml (3 service)
```

### Docker Compose

```yaml
# /opt/lxc-2-app/docker-compose.yml
version: "3.9"

services:
  caddy:
    image: caddy:2-alpine
    container_name: bk-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - /data/pve/lxc-2-app/caddy/data:/data
      - /data/pve/lxc-2-app/caddy/config:/config

  api:
    build:
      context: ../../apps/api
      dockerfile: Dockerfile
    container_name: bk-api
    restart: unless-stopped
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@10.0.0.11:5432/beritakarya
      REDIS_URL: redis://:${REDIS_PASSWORD}@10.0.0.11:6379
      MEILI_URL: http://meilisearch:7700
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    expose:
      - "3001"
    depends_on:
      meilisearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: bk-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    volumes:
      - /data/pve/lxc-2-app/meili:/meili_data
    expose:
      - "7700"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
```

### Caddyfile

```caddyfile
# /opt/lxc-2-app/Caddyfile

# Cloudflare Tunnel → Caddy → Express
:443 {
    # API endpoints
    handle /api/* {
        reverse_proxy api:3001
    }

    # Health check (for Uptime Kuma)
    handle /health {
        reverse_proxy api:3001
    }

    # Swagger docs
    handle /api-docs* {
        reverse_proxy api:3001
    }

    # Block everything else
    handle {
        respond "Not Found" 404
    }
}
```

### Environment Variables

```bash
# /opt/lxc-2-app/.env

# Database (LXC-1)
DB_USER=beritakarya
DB_PASSWORD=<strong-password>
DATABASE_URL=postgresql://beritakarya:<strong-password>@10.0.0.11:5432/beritakarya

# Redis (LXC-1)
REDIS_PASSWORD=<strong-password>
REDIS_URL=redis://:<strong-password>@10.0.0.11:6379

# Meilisearch (local)
MEILI_MASTER_KEY=<strong-key>
MEILI_URL=http://meilisearch:7700

# JWT
JWT_SECRET=<very-strong-secret>
JWT_REFRESH_SECRET=<very-strong-refresh-secret>

# CORS
CORS_ORIGIN=https://beritakarya.co,https://www.beritakarya.co,https://beritakarya-v-0-1-web.vercel.app

# Cookie
COOKIE_DOMAIN=.beritakarya.co

# OpenAI
OPENAI_API_KEY=sk-xxx

# Environment
NODE_ENV=production
```

### Cloudflare Tunnel Setup

```
┌─────────────────────────────────────────────────────────────┐
│                Cloudflare Tunnel Flow                        │
│                                                             │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │  Browser │────►│  Cloudflare  │────►│  cloudflared   │  │
│  │          │     │  Edge        │     │  (di LXC-2)    │  │
│  │  HTTPS   │     │              │     │                │  │
│  │  request │     │  TLS termin. │     │  Tunnel agent  │  │
│  └──────────┘     │  DDoS prot.  │     └───────┬────────┘  │
│                   │  CDN cache   │             │            │
│                   └──────────────┘             │            │
│                                                │            │
│                                    ┌───────────▼──────────┐ │
│                                    │  Caddy :443          │ │
│                                    │  (localhost)         │ │
│                                    └───────────┬──────────┘ │
│                                                │            │
│                                    ┌───────────▼──────────┐ │
│                                    │  Express API :3001   │ │
│                                    └──────────────────────┘ │
│                                                             │
│  Setup:                                                     │
│  1. Install cloudflared di LXC-2                            │
│  2. cloudflared tunnel login                                │
│  3. cloudflared tunnel create beritakarya-api               │
│  4. cloudflared tunnel route dns beritakarya-api api.beritakarya.co │
│  5. cloudflared tunnel run beritakarya-api                  │
│  6. Buat systemd service untuk auto-start                   │
└─────────────────────────────────────────────────────────────┘
```

---

## LXC-3: Monitoring & Utilities

### Profil

| Item | Detail |
|------|--------|
| **Nama** | `lxc-3-monitor` |
| **OS Template** | Debian 12 (minimal) |
| **RAM** | 1 GB (burst 2 GB) |
| **CPU** | 2 core |
| **Disk** | 10 GB (root) + bind-mount `/data/pve/lxc-3-monitor` |
| **IP** | `10.0.0.13` (static) |
| **Fungsi** | Monitoring, observability, management |

### Service

```
LXC-3: Monitoring & Utilities
│
├── Uptime Kuma
│   ├── Port: 3002 (web UI)
│   ├── Monitor: HTTP (API health), TCP (PostgreSQL), Ping
│   ├── Alert: Telegram / Email / Discord
│   └── Data: /data/pve/lxc-3-monitor/uptime-kuma/
│
├── Prometheus
│   ├── Port: 9090 (internal)
│   ├── Scrape: node_exporter, cadvisor
│   ├── Retention: 30 days
│   └── Data: /data/pve/lxc-3-monitor/prometheus/
│
├── Grafana
│   ├── Port: 3000 (web UI)
│   ├── Datasource: Prometheus
│   └── Data: /data/pve/lxc-3-monitor/grafana/
│
└── Docker Compose
    └── docker-compose.yml (3-4 service)
```

### Docker Compose

```yaml
# /opt/lxc-3-monitor/docker-compose.yml
version: "3.9"

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: bk-uptime-kuma
    restart: unless-stopped
    ports:
      - "3002:3001"
    volumes:
      - /data/pve/lxc-3-monitor/uptime-kuma:/app/data

  prometheus:
    image: prom/prometheus:latest
    container_name: bk-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - /data/pve/lxc-3-monitor/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    container_name: bk-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /data/pve/lxc-3-monitor/grafana:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    depends_on:
      - prometheus
```

### Monitoring Targets

```
┌─────────────────────────────────────────────────────────────┐
│                MONITORING TARGETS                            │
│                                                             │
│  Uptime Kuma:                                               │
│  ├── HTTP: https://api.beritakarya.co/health (every 60s)    │
│  ├── HTTP: https://beritakarya.co (every 60s)               │
│  ├── TCP: 10.0.0.11:5432 (PostgreSQL)                       │
│  ├── TCP: 10.0.0.11:6379 (Redis)                            │
│  ├── TCP: 10.0.0.12:7700 (Meilisearch)                      │
│  └── Ping: 10.0.0.11, 10.0.0.12 (host connectivity)        │
│                                                             │
│  Prometheus:                                                │
│  ├── node_exporter di setiap LXC (CPU, RAM, Disk)           │
│  ├── cadvisor di setiap LXC (Docker container stats)        │
│  └── Custom metrics dari Express API (jika ada)             │
│                                                             │
│  Grafana:                                                   │
│  ├── Dashboard: Overview (semua LXC)                        │
│  ├── Dashboard: Database (PG queries, connections)          │
│  ├── Dashboard: API (request rate, latency, errors)         │
│  └── Dashboard: System (CPU, RAM, Disk per LXC)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Network Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NETWORK TOPOLOGY                             │
│                                                                      │
│                            INTERNET                                  │
│                               │                                      │
│                    ┌──────────▼──────────┐                           │
│                    │     Cloudflare      │                           │
│                    │     Edge Network    │                           │
│                    │                     │                           │
│                    │  beritakarya.co     │                           │
│                    │  (Vercel - Frontend)│                           │
│                    │                     │                           │
│                    │  api.beritakarya.co │                           │
│                    │  (Tunnel → Home)    │                           │
│                    └──────────┬──────────┘                           │
│                               │                                      │
│                    Cloudflare Tunnel (outbound)                      │
│                               │                                      │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                   Home LAN (192.168.1.0/24)                  │   │
│  │                            │                                  │   │
│  │                       ┌────▼─────┐                            │   │
│  │                       │  Router  │                            │   │
│  │                       │  NAT     │                            │   │
│  │                       └────┬─────┘                            │   │
│  │                            │                                  │   │
│  │                    ┌───────▼───────┐                          │   │
│  │                    │    Proxmox    │                          │   │
│  │                    │    Host       │                          │   │
│  │                    │  192.168.1.x  │                          │   │
│  │                    └───────┬───────┘                          │   │
│  │                            │                                  │   │
│  │           ┌────────────────┼────────────────┐                 │   │
│  │           │                │                │                 │   │
│  │    ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐          │   │
│  │    │   LXC-1     │  │   LXC-2    │  │   LXC-3     │          │   │
│  │    │  Database   │  │  API Stack │  │  Monitor    │          │   │
│  │    │ 10.0.0.11   │  │ 10.0.0.12  │  │ 10.0.0.13   │          │   │
│  │    └──────┬──────┘  └─────┬──────┘  └──────┬──────┘          │   │
│  │           │               │                │                  │   │
│  │           └───────────────┼────────────────┘                  │   │
│  │                           │                                   │   │
│  │                    Internal Network                           │   │
│  │                    10.0.0.0/24                                │   │
│  │                    (bridge: vmbr0)                            │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Firewall Rules:                                                     │
│  ├── Tidak perlu port forwarding (Cloudflare Tunnel pakai outbound) │
│  ├── SSH → Proxmox host only (dari LAN)                             │
│  ├── LXC inter-communication: allowed (10.0.0.x)                   │
│  └── Cloudflare Tunnel: outbound only (tidak perlu open port)       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Ringkasan Resource

```
┌─────────────────────────────────────────────────────────────┐
│               RESOURCE ALLOCATION SUMMARY                     │
│                                                              │
│  Total: 32 GB RAM | 8 core/16 thread | SSHD 1 TB            │
│                                                              │
│  RAM:                                                        │
│  ├── Proxmox Host        ██░░░░░░░░░░░░░░  2 GB             │
│  ├── LXC-1 Database      ████████░░░░░░░░  2-4 GB           │
│  ├── LXC-2 API Stack     ████████████░░░░  4-6 GB           │
│  ├── LXC-3 Monitoring    ████░░░░░░░░░░░░  1-2 GB           │
│  ├── ──────────────────────────────────────                  │
│  ├── Total Used          ████████████████░  9-14 GB          │
│  └── Free                ████████████████░  18-23 GB         │
│                                                              │
│  CPU:                                                        │
│  ├── Proxmox Host        ██░░░░░░░░░░░░░░  1 core           │
│  ├── LXC-1 Database      ████░░░░░░░░░░░░  2 core           │
│  ├── LXC-2 API Stack     ████████░░░░░░░░  4 core           │
│  ├── LXC-3 Monitoring    ████░░░░░░░░░░░░  2 core           │
│  ├── ──────────────────────────────────────                  │
│  ├── Total Used          ██████████████░░  9 core            │
│  └── Free                ████░░░░░░░░░░░░  7 core            │
│                                                              │
│  Disk:                                                       │
│  ├── Proxmox + LXC root  ████████░░░░░░░░  ~50 GB           │
│  ├── PostgreSQL data     ████░░░░░░░░░░░░  ~20 GB           │
│  ├── Meilisearch index   ██░░░░░░░░░░░░░░  ~10 GB           │
│  ├── Backups             ████████████░░░░  ~100 GB          │
│  ├── Docker images       ████████░░░░░░░░  ~30 GB           │
│  ├── ──────────────────────────────────────                  │
│  ├── Total Used          ████████████░░░░  ~210 GB          │
│  └── Free                ██████████████████  ~790 GB        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tantangan & Solusi

| Tantangan | Solusi |
|-----------|--------|
| Home server harus reachable dari Vercel | Cloudflare Tunnel (gratis, auto TLS, no port forwarding) |
| SSR latency (Vercel → Home server) | `revalidate` caching agresif, server di Indonesia (latency ~20-50ms) |
| Cookie auth lintas domain | Next.js rewrite proxy (sudah ada), cookie di domain Vercel |
| CORS | Sudah diizinkan (`*.vercel.app` regex), tambah domain custom di `CORS_ORIGIN` |
| Uptime tidak se-stabil cloud | UPS, monitoring (Uptime Kuma), graceful degradation di code |
| Cron jobs (Vercel → Home) | Ganti dengan local cron atau external service (cron-job.org) |
| HTTPS wajib | Cloudflare Tunnel auto-handle TLS |

---

## Langkah Implementasi

> **Lihat juga**: [`docs/ssl_plan_vercel.md`](./ssl_plan_vercel.md) untuk panduan detail Cloudflare + DNS setup.

### Phase 1: Proxmox Setup
1. [ ] Install Proxmox VE di home server
2. [ ] Konfigurasi network (bridge vmbr0, static IP)
3. [ ] Buat 3 LXC container (Debian 12 minimal)
4. [ ] Setup bind-mount storage di setiap LXC
5. [ ] Install Docker + Docker Compose di setiap LXC

### Phase 2: Database (LXC-1)
6. [ ] Deploy PostgreSQL + Redis
7. [ ] Run Prisma migration
8. [ ] Seed database
9. [ ] Setup backup cron

### Phase 3: API (LXC-2)
10. [ ] Build Docker image untuk Express API
11. [ ] Deploy Caddy + Express + Meilisearch
12. [ ] Setup environment variables
13. [ ] Test API locally (curl dari Proxmox host)

### Phase 4: Tunnel & Deploy
14. [ ] Setup Cloudflare Tunnel di LXC-2
15. [ ] Konfigurasi DNS (api.beritakarya.co → tunnel)
16. [ ] Update Vercel env: `NEXT_PUBLIC_API_URL=https://api.beritakarya.co`
17. [ ] Deploy web ke Vercel
18. [ ] Test end-to-end

### Phase 5: Monitoring (LXC-3)
19. [ ] Deploy Uptime Kuma + Prometheus + Grafana
20. [ ] Konfigurasi monitoring targets
21. [ ] Setup alerts (Telegram/Email)

### Phase 6: Hardening
22. [ ] Firewall rules
23. [ ] SSH key-only
24. [ ] Fail2ban
25. [ ] SSL/TLS verification
26. [ ] Load testing
