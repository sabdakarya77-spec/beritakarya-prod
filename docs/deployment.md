# Deployment Guide

Panduan deploy BeritaKarya.

## Arsitektur Deployment

| Layer | Platform | Keterangan |
|-------|----------|------------|
| Frontend (Next.js) | Vercel (Hobby, gratis) | CDN global, auto-deploy dari `main` |
| DNS + SSL | Cloudflare (Free, gratis) | Wildcard SSL, DDoS protection |
| API (Express.js) | Home Server (Proxmox VE) | Via Cloudflare Tunnel |
| Database | Home Server | PostgreSQL + Redis + Meilisearch |

```
Browser → Cloudflare → Vercel (Next.js frontend)
                     → Cloudflare Tunnel → Caddy → Express API → PostgreSQL
```

> **Panduan lengkap**: [`docs/ssl_plan_vercel.md`](./ssl_plan_vercel.md)

---

## Quick Reference

### Frontend (Vercel)

- Auto-deploy dari push ke `main`
- Config: `apps/web/vercel.json` (region: `sin1`)
- Domain: `beritakarya.co` + wildcard `*.beritakarya.co`

### API (Home Server)

- Deploy via Docker Compose di LXC-2 (Proxmox)
- Reverse proxy: Caddy
- Expose: Cloudflare Tunnel → `api.beritakarya.co`
- Tidak perlu port forwarding

### Environment Variables

**Vercel (`apps/web`):**

```env
NEXT_PUBLIC_API_URL=https://api.beritakarya.co
NEXT_PUBLIC_URL=https://beritakarya.co
```

**Home Server (`apps/api`):**

```env
DATABASE_URL=postgresql://user:pass@10.0.0.11:5432/beritakarya
REDIS_URL=redis://:pass@10.0.0.11:6379
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://beritakarya.co,https://www.beritakarya.co
COOKIE_DOMAIN=.beritakarya.co
NODE_ENV=production
```

---

## CI/CD

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push/PR to main | Lint, type-check, build, test, E2E |
| `deploy.yml` | Push to main | Build & push Docker images to GHCR |
| `backup.yml` | Daily 2 AM UTC | Database backup |

---

## Backup & Rollback

### Backup

```bash
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Rollback

```bash
docker compose down
git checkout <previous-commit>
docker compose up -d --build
```
