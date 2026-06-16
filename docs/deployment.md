# Deployment Guide

Panduan deploy BeritaKarya ke berbagai environment.

## Deployment Options

| Platform | Frontend | Backend | Database |
|----------|----------|---------|----------|
| Vercel + Railway | ✅ | ✅ | Supabase |
| VPS (Docker) | ✅ | ✅ | Self-hosted |
| Vercel + VPS | ✅ | ✅ | Self-hosted |

## Option 1: Vercel (Frontend) + Railway (Backend)

### Frontend (Vercel)

1. Connect repository ke Vercel
2. Set root directory ke `apps/web`
3. Environment variables:
   - `NEXT_PUBLIC_API_URL` = URL backend Railway
   - `NEXT_PUBLIC_URL` = URL frontend Vercel
4. Deploy otomatis saat push ke `main`

### Backend (Railway)

1. Connect repository ke Railway
2. Set root directory ke `apps/api`
3. Add PostgreSQL service
4. Environment variables:
   - `DATABASE_URL` = Railway PostgreSQL URL
   - `JWT_SECRET` = Random secret (min 32 chars)
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = Frontend Vercel URL
5. Deploy otomatis saat push ke `main`

## Option 2: VPS dengan Docker

### Prasyarat

- VPS dengan Docker dan Docker Compose terinstall
- Domain name (opsional)
- SSL certificate (Let's Encrypt)

### Steps

```bash
# 1. Clone repository
git clone https://github.com/akunisinecoc-jpg/beritakarya-v.0.1.git
cd beritakarya-v.0.1

# 2. Setup environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit .env files dengan production values

# 3. Build dan jalankan
docker compose up -d

# 4. Check status
docker compose ps
docker compose logs -f api
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL 15 |
| redis | 6379 | Redis 7 |
| meilisearch | 7700 | Search engine |
| api | 3001 | Backend API |
| web | 3000 | Frontend |

### Database Migration

```bash
# Run migrations
docker compose exec api npx prisma migrate deploy

# Seed database (opsional)
docker compose exec api npx prisma db seed
```

### SSL dengan Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push/PR to main | Lint, type-check, build, test, E2E |
| `deploy.yml` | Push to main | Build & push Docker images to GHCR |
| `backup.yml` | Daily 2 AM UTC | Database backup |

### Deploy Workflow

```yaml
# Trigger: push to main
# Steps:
# 1. Build Docker images (api + web)
# 2. Push to GitHub Container Registry (GHCR)
# 3. Deploy to staging (configurable)
```

### Manual Deploy

```bash
# Trigger deploy workflow manually
gh workflow run deploy.yml
```

## Environment Variables (Production)

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Allowed frontend URL |

### Recommended

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis for rate limiting |
| `SENTRY_DSN` | Error tracking |
| `SMTP_HOST` | Email sending |
| `S3_ENDPOINT` | File storage |

## Monitoring

### Health Checks

- API: `GET /health` — Database dan Meilisearch status
- Docker: HEALTHCHECK instructions di Dockerfiles

### Logs

```bash
# Docker logs
docker compose logs -f api
docker compose logs -f web

# PM2 logs (jika pakai PM2)
pm2 logs
```

### Sentry

Set `SENTRY_DSN` environment variable untuk error tracking otomatis.

## Backup

### Automated (GitHub Actions)

Daily backup dijalankan otomatis via `backup.yml` workflow. Backup disimpan sebagai GitHub artifact dengan retensi 7 hari.

### Manual

```bash
# Backup database
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup_20260616.sql.gz | psql $DATABASE_URL
```

## Rollback

```bash
# Docker rollback
docker compose down
git checkout <previous-commit>
docker compose up -d --build

# Railway rollback
# Via dashboard: select previous deployment → redeploy
```
