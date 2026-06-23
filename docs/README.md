# Documentation

Dokumentasi teknis BeritaKarya — platform CMS media digital multi-situs.

## Arsitektur & Analisis

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | Arsitektur sistem, multi-tenant, design decisions |
| [Analisa](Analisa.md) | Analisis mendalam infra + codebase, gap analysis, rekomendasi |

## Infrastruktur & Produksi

| Document | Description |
|----------|-------------|
| [Panduan Produksi LXC](panduan_produksi_lxc.md) | Konfigurasi 3 LXC Container (CT 101-103) untuk produksi |
| [MikroTik Tutorial](mikrotik-tutorial-expanded.md) | Topologi jaringan MikroTik & Proxmox VE |

## Fitur

| Document | Description |
|----------|-------------|
| [Ads / Iklan](ads.md) | Dokumentasi sistem slot iklan (AdSpace, AdBooking) |

## UI/UX

| Document | Description |
|----------|-------------|
| [Kategori Dashboard](../plan-ui/ux/katagori.md) | Plan perbaikan UI/UX halaman dashboard categories |

## Quick Links

- [CLAUDE.md](../CLAUDE.md) — Project overview untuk Claude Code
- API Docs — http://localhost:3001/api-docs (Swagger, saat API berjalan)

## Prinsip Deployment

- **Infra = kepastian**, codebase menyesuaikan
- **Hybrid**: Frontend di **Vercel**, backend & database self-hosted di LXC
- **Backend native** (tanpa Docker) di LXC container
- **Multi-tenant** via wildcard subdomain (`*.beritakarya.co`) — di-handle Vercel
