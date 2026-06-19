# Documentation

Dokumentasi lengkap untuk BeritaKarya.

## Arsitektur & Analisis

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | Arsitektur sistem, multi-tenant, design decisions |
| [Analisa](Analisa.md) | Analisis mendalam infra + codebase, checklist gabungan |

## Deployment Produksi (Self-Hosted LXC)

| Document | Description |
|----------|-------------|
| **[Implementasi Infra](implementasi-infra.md)** | **Plan infrastruktur LXC** — MikroTik, Proxmox, CT 101-103 (referensi utama) |
| **[Implementasi Codebase](implementasi-codebase.md)** | **Plan penyesuaian codebase** — env vars, PM2, build script |
| [Panduan Produksi LXC](panduan_produksi_lxc.md) | Panduan teknis konfigurasi LXC container |
| [MikroTik Tutorial](mikrotik-tutorial-expanded.md) | Panduan topologi jaringan MikroTik & Proxmox VE |

## Lainnya

| Document | Description |
|----------|-------------|
| [WordPress Import](wordpress-import.md) | Panduan impor berita lama dengan tanggal asli |
| [Contributing](../CONTRIBUTING.md) | Cara berkontribusi ke project |

## Quick Links

- [CLAUDE.md](../CLAUDE.md) — Project overview untuk Claude Code
- [UI/UX Audit](../audit_UI_UX.md) — Audit komprehensif dan rencana perbaikan UI/UX
- API Docs — http://localhost:3001/api-docs (Swagger, saat API berjalan)

## Prinsip Deployment

- **Infra = kepastian**, codebase menyesuaikan
- **Hybrid**: Frontend di **Vercel**, backend & database self-hosted di LXC
- **Backend native** (tanpa Docker) di LXC container
- **Multi-tenant** via wildcard subdomain (`*.beritakarya.co`) — di-handle Vercel

## Planned Documentation

- [x] UI/UX Audit & Improvement Plan (`audit_UI_UX.md`)
- [x] Infrastructure Analysis (`Analisa.md`)
- [x] Implementation Plans (`implementasi-infra.md`, `implementasi-codebase.md`)
- [ ] Design System specs
- [ ] API Reference (Swagger annotations)
- [ ] Changelog
