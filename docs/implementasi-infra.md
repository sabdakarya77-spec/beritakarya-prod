# Implementasi Plan: Infrastruktur Produksi LXC BeritaKarya

> **Prinsip**: Infrastruktur adalah **kepastian**. Codebase menyesuaikan dengan infra.
> **Keputusan Arsitektur**: Backend & database **self-hosted** di LXC Container. Frontend (Next.js) di-deploy ke **Vercel**.
> **Referensi**: `panduan_produksi_lxc.md`, `mikrotik-tutorial-expanded.md`
> **Tanggal**: 18 Juni 2026

---

## Daftar Isi

1. [Ringkasan Arsitektur](#1-ringkasan-arsitektur)
2. [Fase 1: MikroTik & Jaringan](#2-fase-1-mikrotik--jaringan)
3. [Fase 2: Proxmox VE Host](#3-fase-2-proxmox-ve-host)
4. [Fase 3: CT 101 — Database](#4-fase-3-ct-101--database)
5. [Fase 4: CT 102 — Application](#5-fase-4-ct-102--application)
6. [Fase 5: CT 103 — Monitoring](#6-fase-5-ct-103--monitoring)
7. [Fase 6: Verifikasi & Go-Live](#7-fase-6-verifikasi--go-live)
8. [Catatan Pasca-Deploy](#8-catatan-pasca-deploy)

---

## 1. Ringkasan Arsitektur

### 1.1 Topologi Final

```
Internet
    │
    ├──────────────────────────────────────────┐
    │                                          │
    ▼                                          ▼
┌──────────────┐                    ┌──────────────────┐
│ Vercel       │                    │ Cloudflare Tunnel │
│ (Frontend)   │                    │ (*.api subdomain)  │
│ Next.js SSR  │                    └────────┬─────────┘
│ Wildcard     │                             │
│ subdomain    │                             ▼
└──────────────┘                    ┌──────────────────┐
                                    │ CT 102           │
                                    │ lxc-2-app        │
                                    │ 10.0.0.12        │
                                    │                  │
                                    │ Express API      │
                                    │ Caddy            │
                                    └────────┬─────────┘
                                             │ 5432,6379,
                                             │ 7700,9000
                                             ▼
                                    ┌──────────────────┐
                                    │ CT 101           │
                                    │ lxc-1-db         │
                                    │ 10.0.0.11        │
                                    │                  │
                                    │ PostgreSQL 15    │
                                    │ Redis 7          │
                                    │ Meilisearch v1.6 │
                                    │ MinIO (S3)       │
                                    └──────────────────┘

Proxmox Host: 192.168.10.50 (VLAN 10 Management)
MikroTik Router: 192.168.10.1 (VLAN 10), 10.0.0.1 (VLAN 20)

                                    ┌──────────────────┐
                                    │ CT 103           │
                                    │ lxc-3-monitor    │
                                    │ 10.0.0.13        │
                                    │                  │
                                    │ Prometheus       │
                                    │ Grafana          │
                                    │ Exporters        │
                                    └──────────────────┘
```

**Catatan Arsitektur**:
- **Frontend (Next.js)** di-deploy ke **Vercel** — hemat ~2 GB RAM di CT 102, dapat CDN + auto-scaling + wildcard subdomain unlimited
- **Backend (Express API)** tetap self-hosted di CT 102
- **Database & services** tetap di CT 101
- Vercel memanggil API di `api.beritakarya.co` via Cloudflare Tunnel

### 1.2 Alokasi Resource (Final)

| Container | Hostname | IP | CPU | RAM | Disk | Layanan |
|-----------|----------|-----|-----|-----|------|---------|
| CT 101 | `lxc-1-db` | `10.0.0.11` | 2 core | 4 GB | 64 GB | PostgreSQL 15, Redis 7, Meilisearch v1.6, MinIO |
| CT 102 | `lxc-2-app` | `10.0.0.12` | 2 core | 4 GB | 20 GB | Node.js 20, PM2 (API only), Caddy, Cloudflare Tunnel |
| CT 103 | `lxc-3-monitor` | `10.0.0.13` | 2 core | 2 GB | 10 GB | Prometheus, Grafana, Node Exporter |

### 1.3 Keputusan Arsitektur

| Keputusan | Alasan |
|-----------|--------|
| **Frontend di Vercel** | Next.js SSR di Vercel — hemat ~2 GB RAM di CT 102, dapat CDN edge, auto-scaling, wildcard subdomain unlimited |
| **Backend self-hosted** | Express API tetap di CT 102 — kontrol penuh atas database, cron, AI features |
| **Tanpa Docker** | LXC sudah isolasi, Docker menambah overhead RAM ~300MB per host tanpa manfaat signifikan |
| **Native install** | Service langsung dikelola systemd, lebih transparan untuk debugging dan monitoring |
| **VLAN 20 static IP** | Server tidak boleh pakai DHCP, IP harus konsisten untuk koneksi antar-service |
| **CT 101 tanpa internet** | Database tidak boleh akses internet (firewall rule #3 di MikroTik) |
| **MinIO untuk media** | S3-compatible, drop-in replacement Supabase Storage, full self-hosted |
| **Caddy bukan Nginx** | Auto-SSL, config lebih sederhana, cocok untuk single-server |
| **Cloudflare Tunnel** | Zero-trust, tidak perlu port forwarding, SSL termination di edge untuk API |
| **Cloudflare CDN untuk media** | Cache static media dari MinIO, mengurangi beban CT 101 |

---

## 2. Fase 1: MikroTik & Jaringan

**Estimasi waktu**: 30-45 menit
**Referensi**: `mikrotik-tutorial-expanded.md` — Bagian 4

### 2.1 Checklist

- [x] **1.1** Buat bridge `bridge-local` dengan VLAN filtering
- [x] **1.2** Daftarkan port: Ether2 (trunk), Ether3-5 (access VLAN 10)
- [x] **1.3** Buat interface VLAN: `vlan10-LAN`, `vlan20-SRV`
- [x] **1.4** Assign IP gateway: `192.168.10.1` (VLAN 10), `10.0.0.1` (VLAN 20)
- [x] **1.5** Setup DHCP server untuk VLAN 10 (range `.100-.254`)
- [x] **1.6** Konfigurasi bridge VLAN table (tagged/untagged)
- [x] **1.7** Aktifkan VLAN filtering
- [x] **1.8** Setup WAN: DHCP client di Ether1, NAT masquerade

### 2.2 Firewall Rules (Urutan Penting)

```routeros
/ip firewall filter
# 1. Accept established/related
add action=accept chain=forward connection-state=established,related

# 2. Drop invalid
add action=drop chain=forward connection-state=invalid

# 3. Block DB dari internet (KRITIS)
add action=drop chain=forward src-address=10.0.0.11 out-interface=ether1

# 4. Admin → Server (full access)
add action=accept chain=forward src-address=192.168.10.0/24 dst-address=10.0.0.0/24

# 5. Block Server → Admin (lateral movement prevention)
add action=drop chain=forward connection-state=new src-address=10.0.0.0/24 dst-address=192.168.10.0/24

# 6. Inter-container: App → DB (hanya port yang dibutuhkan)
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=5432 protocol=tcp comment="App to PostgreSQL"
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=6379 protocol=tcp comment="App to Redis"
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=7700 protocol=tcp comment="App to Meilisearch"
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=9000 protocol=tcp comment="App to MinIO API"
add action=accept chain=forward src-address=10.0.0.12 dst-address=10.0.0.11 dst-port=9001 protocol=tcp comment="App to MinIO Console"

# 7. Inter-container: Monitor → DB (exporters)
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.11 dst-port=9187 protocol=tcp
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.11 dst-port=9121 protocol=tcp
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.11 dst-port=9100 protocol=tcp

# 8. Inter-container: Monitor → App (node exporter)
add action=accept chain=forward src-address=10.0.0.13 dst-address=10.0.0.12 dst-port=9100 protocol=tcp

# 9. Drop inter-container lainnya
add action=drop chain=forward src-address=10.0.0.0/24 dst-address=10.0.0.0/24

# 10. Server → Internet (hanya CT 102 yang perlu)
add action=accept chain=forward src-address=10.0.0.12 out-interface=ether1
```

### 2.3 Verifikasi Fase 1

```bash
# Dari PC Admin (VLAN 10)
ping 192.168.10.1    # Gateway MikroTik
ping 192.168.10.50   # Proxmox Host (setelah fase 2)
```

---

## 3. Fase 2: Proxmox VE Host

**Estimasi waktu**: 1-2 jam
**Referensi**: `mikrotik-tutorial-expanded.md` — Bagian 5

### 3.1 Checklist

- [ ] **2.1** Download ISO Proxmox VE 8.x
- [ ] **2.2** Buat USB bootable (Rufus/dd)
- [ ] **2.3** Install Proxmox (ext4 filesystem, timezone Asia/Jakarta)
- [ ] **2.4** Konfigurasi network saat install: IP `192.168.10.50`, gateway `192.168.10.1`
- [ ] **2.5** Akses Web UI `https://192.168.10.50:8006`
- [ ] **2.6** Nonaktifkan enterprise repo, aktifkan community repo
- [ ] **2.7** `apt full-upgrade -y`
- [ ] **2.8** Install `ifupdown2`, `curl`, `wget`, `git`, `htop`, `net-tools`, `lsof`
- [ ] **2.9** Konfigurasi VLAN-aware bridge (`vmbr0` + `vmbr0.10`)
- [ ] **2.10** Verifikasi: `ip addr show vmbr0.10` → `192.168.10.50/24`

### 3.2 Network Config (`/etc/network/interfaces`)

```text
auto lo
iface lo inet loopback

iface enp3s0 inet manual

auto vmbr0
iface vmbr0 inet manual
        bridge-ports enp3s0
        bridge-stp off
        bridge-fd 0
        bridge-vlan-aware yes
        bridge-vids 2-4094

auto vmbr0.10
iface vmbr0.10 inet static
        address 192.168.10.50/24
        gateway 192.168.10.1
        dns-nameservers 1.1.1.1 8.8.8.8
```

### 3.3 Membuat LXC Container

Download template Debian 12:
```bash
pveam download local debian-12-standard_12.7-1_amd64.tar.zst
```

Buat container (CLI):
```bash
# CT 101 — Database + Storage
pct create 101 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname lxc-1-db \
  --password "GantiDenganPasswordKuat!" \
  --storage local-lvm \
  --rootfs local-lvm:64 \
  --cores 2 \
  --memory 4096 \
  --swap 2048 \
  --net0 name=eth0,bridge=vmbr0,tag=20,ip=10.0.0.11/24,gw=10.0.0.1 \
  --nameserver 1.1.1.1 \
  --start 1

# CT 102 — Application
pct create 102 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname lxc-2-app \
  --password "GantiDenganPasswordKuat!" \
  --storage local-lvm \
  --rootfs local-lvm:20 \
  --cores 4 \
  --memory 6144 \
  --swap 3072 \
  --net0 name=eth0,bridge=vmbr0,tag=20,ip=10.0.0.12/24,gw=10.0.0.1 \
  --nameserver 1.1.1.1 \
  --start 1

# CT 103 — Monitoring
pct create 103 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
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

### 3.4 Verifikasi Fase 2

```bash
pct list
# Expected: 101 running, 102 running, 103 running

pct enter 101
ip addr show eth0   # → 10.0.0.11/24
ping -c 3 10.0.0.1  # Gateway VLAN 20
exit
```

---

## 4. Fase 3: CT 101 — Database & Storage

**Estimasi waktu**: 2-3 jam
**Referensi**: `panduan_produksi_lxc.md` — BAB 1 & 2

### 4.1 Checklist Global Tuning

- [x] **3.1** Optimasi `/etc/security/limits.conf` (nofile 65536)
- [x] **3.2** Tuning sysctl (`/etc/sysctl.d/99-production.conf`)
- [x] **3.3** Install Node Exporter (`prometheus-node-exporter`)

### 4.2 Checklist PostgreSQL 15

- [x] **3.4** Install PostgreSQL 15 dari official repo
- [x] **3.5** Tuning `postgresql.conf`:
  - `listen_addresses = '10.0.0.11'`
  - `max_connections = 100`
  - `shared_buffers = 1GB`
  - `effective_cache_size = 3GB`
  - `work_mem = 10MB`
- [x] **3.6** Konfigurasi `pg_hba.conf`:
  - `host beritakarya berita_user 10.0.0.12/32 scram-sha-256`
  - `host beritakarya berita_user 10.0.0.13/32 scram-sha-256`
- [x] **3.7** Buat database `beritakarya` dan user `berita_user`
- [x] **3.8** Enable & start PostgreSQL: `systemctl enable --now postgresql`

### 4.3 Checklist Redis 7

- [x] **3.9** Install Redis 7 dari official repo
- [x] **3.10** Konfigurasi `/etc/redis/redis.conf`:
  - `bind 10.0.0.11`
  - `protected-mode yes`
  - `requirepass <PASSWORD_KUAT>`
  - `maxmemory 512mb`
  - `maxmemory-policy allkeys-lru`
  - Rename commands berbahaya (FLUSHDB, FLUSHALL, DEBUG)
- [x] **3.11** Enable & start Redis: `systemctl enable --now redis-server`

### 4.4 Checklist Meilisearch v1.6

- [x] **3.12** Download binary Meilisearch ke `/usr/local/bin/meilisearch`
- [x] **3.13** Buat systemd service (`/etc/systemd/system/meilisearch.service`)
- [x] **3.14** Konfigurasi: `--http-addr 10.0.0.11:7700 --master-key <KEY_MIN_32_CHAR> --env production`
- [x] **3.15** Buat data directory: `mkdir -p /var/lib/meilisearch`
- [x] **3.16** Enable & start Meilisearch

### 4.5 Checklist MinIO (S3-Compatible Storage)

- [x] **3.17** Download binary MinIO ke `/usr/local/bin/minio`
- [x] **3.18** Buat data directory: `mkdir -p /var/lib/minio/{media,kyc}`
- [x] **3.19** Buat systemd service (`/etc/systemd/system/minio.service`)
- [x] **3.20** Konfigurasi: `--address 10.0.0.11:9000 --console-address 10.0.0.11:9001`
- [x] **3.21** Enable & start MinIO
- [x] **3.22** Buat bucket `media` dan `kyc` via MinIO Client (`mc`)
- [x] **3.23** Buat access key untuk aplikasi

#### Install MinIO

```bash
# Download binary
wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
chmod +x /usr/local/bin/minio

# Buat user minio
useradd -r minio -s /sbin/nologin
chown -R minio:minio /var/lib/minio
```

#### Systemd Service (`/etc/systemd/system/minio.service`)

```ini
[Unit]
Description=MinIO S3-Compatible Storage
After=network.target

[Service]
Type=simple
User=minio
Group=minio
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=<PASSWORD_MINIO_MIN_8_CHAR>"
ExecStart=/usr/local/bin/minio server /var/lib/minio --address 10.0.0.11:9000 --console-address 10.0.0.11:9001
Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

#### Setup Bucket & Access Key

```bash
# Install MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Setup alias ke local MinIO
mc alias set local http://10.0.0.11:9000 minioadmin <PASSWORD_MINIO>

# Buat bucket
mc mb local/media
mc mb local/kyc

# Buat access key untuk aplikasi (simpan output!)
mc admin user add local beritakarya <PASSWORD_APP_USER>
mc admin policy set readwrite user=beritakarya

# ATAU gunakan root credentials langsung di .env (simpler untuk single-server)
```

### 4.6 Checklist Backup

- [x] **3.24** Buat script `/usr/local/bin/backup_db.sh`
- [x] **3.25** Tambahkan cron: `0 2 * * * root /usr/local/bin/backup_db.sh`
- [x] **3.26** Test backup manual: `bash /usr/local/bin/backup_db.sh`
- [x] **3.27** Konfigurasi backup retensi 3 hari (bukan 7) karena disk sharing dengan MinIO

**CATATAN PENTING — Disk Sharing:**
CT 101 (64 GB) menjalankan DB + MinIO di disk yang sama. Backup PostgreSQL harus hemat tempat:
- Retensi backup: **3 hari** (bukan 7) untuk menghemat ~8 GB
- Monitor disk usage secara ketat: `df -h` harus < 75%
- Jika media > 40 GB, pertimbangkan tambah disk atau pindah MinIO ke storage terpisah

### 4.7 Checklist Monitoring Exporters

- [x] **3.28** Install PostgreSQL Exporter (`postgres_exporter`)
- [x] **3.29** Buat user `postgres_exporter` di PostgreSQL dengan role `pg_monitor`
- [x] **3.30** Buat systemd service untuk postgres_exporter
- [x] **3.31** Install Redis Exporter (`prometheus-redis-exporter`)
- [x] **3.32** Konfigurasi Redis Exporter dengan password

### 4.8 Port yang Harus Terbuka di CT 101

| Port | Service | Dari |
|------|---------|------|
| 5432 | PostgreSQL | CT 102 (App) |
| 6379 | Redis | CT 102 (App) |
| 7700 | Meilisearch | CT 102 (App) |
| 9000 | MinIO API (S3) | CT 102 (App) |
| 9001 | MinIO Console | Admin (opsional, via VLAN 10) |
| 9100 | Node Exporter | CT 103 (Monitor) |
| 9187 | PostgreSQL Exporter | CT 103 (Monitor) |
| 9121 | Redis Exporter | CT 103 (Monitor) |

### 4.9 Alokasi Disk CT 101 (64 GB)

| Komponen | Estimasi | Catatan |
|----------|----------|---------|
| OS + system | ~3 GB | Debian 12 base |
| PostgreSQL (DB + WAL) | ~4-6 GB | Bergantung jumlah artikel |
| Redis | ~1 GB | maxmemory 512mb + persistence |
| Meilisearch | ~1-2 GB | Search index |
| MinIO (binary) | ~100 MB | Binary only |
| PostgreSQL backup (3 hari) | ~6-12 GB | Retensi dipersingkat |
| **Subtotal sistem** | **~15-23 GB** | |
| **Sisa untuk media (MinIO)** | **~41-49 GB** | Estimasi 100rb+ foto |

### 4.10 Kredensial yang Harus Dicatat

Simpan di password manager, **bukan di file**:

| Service | Credential | Nilai |
|---------|-----------|-------|
| PostgreSQL | User | `berita_user` |
| PostgreSQL | Password | `<ISI>` |
| PostgreSQL | Exporter User | `postgres_exporter` |
| PostgreSQL | Exporter Password | `<ISI>` |
| Redis | Password | `<ISI>` |
| Meilisearch | Master Key | `<ISI_MIN_32_CHAR>` |
| MinIO | Root User | `minioadmin` |
| MinIO | Root Password | `<ISI>` |
| MinIO | App User | `beritakarya` |
| MinIO | App Password | `<ISI>` |

---

## 5. Fase 4: CT 102 — Application

**Estimasi waktu**: 2-3 jam
**Referensi**: `panduan_produksi_lxc.md` — BAB 1 & 3

### 5.1 Checklist Global Tuning

- [x] **4.1** Optimasi `/etc/security/limits.conf` (nofile 65536)
- [x] **4.2** Tuning sysctl (`/etc/sysctl.d/99-production.conf`)
- [x] **4.3** Install Node Exporter (`prometheus-node-exporter`)

### 5.2 Checklist Runtime

- [x] **4.4** Install Node.js 20 LTS (NodeSource)
- [x] **4.5** Install pnpm global: `npm install -g pnpm`
- [x] **4.6** Install PM2 global: `npm install -g pm2`
- [x] **4.7** Install Caddy (dari official repo)

> **Catatan**: Frontend (Next.js) di-deploy ke **Vercel**, tidak perlu di CT 102. CT 102 hanya menjalankan Express API.

### 5.3 Checklist Deploy Aplikasi (API Only)

- [x] **4.8** Clone repo ke `/var/www/beritakarya-prod`
- [x] **4.9** Buat `.env` untuk API (lihat `implementasi-codebase.md` untuk nilai yang benar)
- [x] **4.10** `pnpm install --frozen-lockfile`
- [x] **4.11** `pnpm --filter @beritakarya/api db:generate`
- [x] **4.12** `pnpm --filter @beritakarya/api db:migrate:deploy`
- [x] **4.13** `pnpm --filter @beritakarya/api db:seed`
- [x] **4.14** Build API: `pnpm --filter @beritakarya/api build`

> **Catatan**: Frontend di-deploy ke Vercel via Git push. Tidak perlu build web di CT 102.

### 5.4 Checklist PM2

- [x] **4.17** Buat `ecosystem.config.js` (lihat konfigurasi di bawah)
- [x] **4.18** `pm2 start ecosystem.config.js`
- [x] **4.19** `pm2 save`
- [x] **4.20** `pm2 startup` (ikuti instruksi output)

### 5.5 PM2 Configuration (`ecosystem.config.js`)

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

**Catatan Penting:**
- Hanya **beritakarya-api** — frontend (Next.js) di-deploy ke Vercel
- `instances: 2` dengan RAM 4 GB masih aman
- Total estimasi RAM: 2×800M = 1.6 GB + OS ~1.5 GB = ~3.1 GB (dari 4 GB, sisa ~0.9 GB headroom)
- Bisa naikkan ke 3-4 instances jika traffic tinggi (cukup RAM karena frontend sudah di Vercel)

### 5.6 Checklist Caddy

- [x] **4.21** Edit `/etc/caddy/Caddyfile` (lihat konfigurasi di bawah)
- [x] **4.22** `systemctl restart caddy`

### 5.7 Caddy Configuration (`/etc/caddy/Caddyfile`)

**PENTING**: Frontend (Next.js) di-deploy ke Vercel. Caddy di CT 102 hanya menangani **API** dan **media**.

```caddy
# ============================================================
# Backend REST API
# ============================================================
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

# ============================================================
# Media CDN (MinIO via Cloudflare)
# ============================================================
media.beritakarya.co {
    reverse_proxy 10.0.0.11:9000

    encode gzip zstd

    # Cache static media di Caddy layer
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

**Yang dihapus** (karena frontend di Vercel):
- Block `*.beritakarya.co` (wildcard routing ke Next.js)
- Block `www.beritakarya.co` (redirect)
- Block `beritakarya.co` (frontend utama)

**Wildcard subdomain** untuk multi-site (`bandung.beritakarya.co`, `surabaya.beritakarya.co`) sekarang di-handle oleh **Vercel**, bukan Caddy.

### 5.8 Checklist Cloudflare Tunnel & DNS

- [x] **4.23** Install `cloudflared`
- [x] **4.24** `cloudflared tunnel login`
- [x] **4.25** `cloudflared tunnel create beritakarya-api-tunnel`
- [x] **4.26** Konfigurasi tunnel → `http://localhost:80` (Caddy)
- [x] **4.27** `cloudflared service install <TUNNEL_TOKEN>`
- [x] **4.28** `systemctl enable --now cloudflared`

#### DNS Configuration (Cloudflare Dashboard)

| Type | Name | Content | Proxy | TTL | Keterangan |
|------|------|---------|-------|-----|------------|
| CNAME | `api` | `<TUNNEL_ID>.cfargotunnel.com` | ✅ Proxied | Auto | API backend (via Cloudflare Tunnel) |
| CNAME | `media` | `<TUNNEL_ID>.cfargotunnel.com` | ✅ Proxied | Auto | Media MinIO (via Cloudflare Tunnel) |

> **Catatan**: Domain utama (`beritakarya.co`) dan wildcard (`*.beritakarya.co`) diatur di **Vercel**, bukan di Cloudflare DNS untuk server ini. Hanya `api` dan `media` yang diarahkan ke self-hosted server.

#### Vercel Domain Configuration

Di Vercel Dashboard → Project → Settings → Domains:

1. Tambahkan `beritakarya.co` → Vercel berikan CNAME target
2. Tambahkan `*.beritakarya.co` (wildcard) → Vercel handle semua subdomain
3. Di Cloudflare DNS, buat CNAME untuk `beritakarya.co` mengarah ke Vercel

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `beritakarya.co` | `cname.vercel-dns.com` | ✅ Proxied | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | ✅ Proxied | Auto |
| CNAME | `*` | `cname.vercel-dns.com` | ✅ Proxied | Auto |

> Wildcard `*` diarahkan ke Vercel. Semua subdomain (`bandung`, `surabaya`, dll) di-handle oleh Next.js di Vercel.

#### Cloudflare Tunnel Routing

Konfigurasi di Cloudflare Dashboard → Zero Trust → Networks → Tunnels:

| Service | URL |
|---------|-----|
| `api.beritakarya.co` | `http://localhost:80` |
| `media.beritakarya.co` | `http://localhost:80` |

Config file `/root/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # API dan Media saja — frontend di Vercel
  - hostname: api.beritakarya.co
    service: http://localhost:80
  - hostname: media.beritakarya.co
    service: http://localhost:80
  - service: http_status:404
```

> Hanya `api` dan `media` yang masuk ke server ini. Frontend tidak melewati Cloudflare Tunnel.

### 5.9 Port yang Harus Terbuka di CT 102

| Port | Service | Dari |
|------|---------|------|
| 80 | Caddy (HTTP) | Cloudflare Tunnel |
| 443 | Caddy (HTTPS) | Cloudflare Tunnel |
| 3001 | Express API | Caddy (localhost) |
| 9100 | Node Exporter | CT 103 (Monitor) |

> **Dihapus**: Port 3000 (Next.js) dan 9000 (MinIO via Caddy) — frontend di Vercel, media diakses langsung dari CT 101.

### 5.10 Checklist Cron Scheduler

Codebase BeritaKarya memiliki endpoint `/api/cron/*` yang dirancang untuk dipanggil secara periodik (cleanup expired tokens, KYC cleanup, pageview retention, dll). Di self-hosted, perlu scheduler manual via crontab.

- [x] **4.29** Buat cron script `/usr/local/bin/beritakarya-cron.sh`
- [x] **4.30** Tambahkan ke crontab

#### Cron Script (`/usr/local/bin/beritakarya-cron.sh`)

```bash
#!/bin/bash
# beritakarya-cron.sh — Trigger cron endpoints BeritaKarya
# Dipanggil oleh crontab setiap 5 menit

API_URL="http://localhost:3001"
CRON_SECRET="<ISI_DENGAN_CRON_SECRET_DARI_ENV>"

# Cleanup expired tokens & KYC
curl -s -X POST "$API_URL/api/cron/cleanup" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" > /dev/null 2>&1

# Pageview retention cleanup
curl -s -X POST "$API_URL/api/cron/pageview-cleanup" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" > /dev/null 2>&1
```

#### Crontab Entry

```bash
chmod +x /usr/local/bin/beritakarya-cron.sh
echo "*/5 * * * * root /usr/local/bin/beritakarya-cron.sh" >> /etc/crontab
```

> **Catatan**: `CRON_SECRET` harus sama dengan nilai di `.env` API. Jika tidak diset, cron endpoints akan return 401.

---

## 6. Fase 5: CT 103 — Monitoring

**Estimasi waktu**: 1-2 jam
**Referensi**: `panduan_produksi_lxc.md` — BAB 1 & 4

### 6.1 Checklist Global Tuning

- [x] **5.1** Optimasi `/etc/security/limits.conf` (nofile 65536)
- [x] **5.2** Tuning sysctl (`/etc/sysctl.d/99-production.conf`)
- [x] **5.3** Install Node Exporter (`prometheus-node-exporter`)

### 6.2 Checklist Prometheus

- [x] **5.4** Install Prometheus (`apt install prometheus`)
- [x] **5.5** Edit `/etc/prometheus/prometheus.yml` (lihat konfigurasi di bawah)
- [x] **5.6** Enable & start: `systemctl enable --now prometheus`

### 6.3 Prometheus Configuration (`/etc/prometheus/prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporters'
    static_configs:
      - targets: ['10.0.0.11:9100']
        labels:
          instance: 'db'
      - targets: ['10.0.0.12:9100']
        labels:
          instance: 'app'
      - targets: ['10.0.0.13:9100']
        labels:
          instance: 'monitor'

  - job_name: 'postgres_exporter'
    static_configs:
      - targets: ['10.0.0.11:9187']

  - job_name: 'redis_exporter'
    static_configs:
      - targets: ['10.0.0.11:9121']
```

### 6.4 Checklist Grafana

- [x] **5.7** Install Grafana (`apt install grafana`)
- [x] **5.8** Enable & start: `systemctl enable --now grafana-server`
- [x] **5.9** Akses `http://10.0.0.13:3000` (login: `admin`/`admin`)
- [x] **5.10** Tambahkan Prometheus data source: `http://localhost:9090`
- [x] **5.11** Import dashboard:
  - ID **1860** — Node Exporter Full
  - ID **9628** — PostgreSQL Database
  - ID **763** — Redis Dashboard

### 6.5 Checklist Alerting

- [x] **5.12** Konfigurasi Grafana alert rules:
  - CPU > 80% selama 5 menit
  - RAM > 85% selama 5 menit
  - Disk > 80% selama 5 menit
  - PostgreSQL down selama 1 menit
- [x] **5.13** Setup notifikasi (email/Slack/Discord)

### 6.6 Port yang Harus Terbuka di CT 103

| Port | Service | Dari |
|------|---------|------|
| 3000 | Grafana | Admin (VLAN 10 via MikroTik) |
| 9090 | Prometheus | Localhost only |
| 9100 | Node Exporter | Localhost only |

---

## 7. Fase 6: Verifikasi & Go-Live

**Estimasi waktu**: 1-2 jam

### 7.1 Checklist Verifikasi Jaringan

- [x] **6.1** Dari CT 102: `nc -zv 10.0.0.11 5432` → PostgreSQL connected
- [x] **6.2** Dari CT 102: `nc -zv 10.0.0.11 6379` → Redis connected
- [x] **6.3** Dari CT 102: `nc -zv 10.0.0.11 7700` → Meilisearch connected
- [x] **6.4** Dari CT 101: `ping google.com` → **GAGAL** (diblokir firewall, ini yang benar)
- [x] **6.5** Dari CT 102: `ping google.com` → Berhasil

### 7.2 Checklist Verifikasi Aplikasi

- [x] **6.6** `pm2 status` → beritakarya-api online
- [x] **6.7** `curl http://localhost:3001/health` → `{"status":"healthy"}`
- [x] **6.8** Buka `https://beritakarya.co` di browser → Site tampil (Vercel)
- [x] **6.9** Buka `https://api.beritakarya.co/api-docs` → Swagger tampil (self-hosted)
- [x] **6.10** Login dengan admin seed credentials → Berhasil
- [x] **6.11** Buka `https://bandung.beritakarya.co` → Subdomain berfungsi (Vercel wildcard)

### 7.3 Checklist Verifikasi Monitoring

- [x] **6.12** Buka Grafana `http://10.0.0.13:3000` → Dashboard tampil
- [x] **6.13** Node Exporter targets UP di Prometheus (`http://10.0.0.13:9090/targets`)
- [x] **6.14** PostgreSQL Exporter target UP
- [x] **6.15** Redis Exporter target UP

### 7.4 Checklist Verifikasi Backup

- [x] **6.16** Jalankan manual: `bash /usr/local/bin/backup_db.sh`
- [x] **6.17** Verifikasi file backup ada di `/var/backups/postgresql/`
- [x] **6.18** Verifikasi cron berjalan: `grep backup_db /etc/crontab`

---

## 8. Catatan Pasca-Deploy

### 8.1 Monitoring Harian

| Item | Command | Expected |
|------|---------|----------|
| PM2 status | `pm2 status` | beritakarya-api online, restart count = 0 |
| Disk usage | `df -h` | < 80% used |
| PostgreSQL connections | `psql -c "SELECT count(*) FROM pg_stat_activity;"` | < 80 |
| Redis memory | `redis-cli info memory` | used_memory < maxmemory |
| Vercel dashboard | https://vercel.com | No deployment errors, healthy status |

### 8.2 Backup Strategy

| Backup | Lokasi | Frekuensi | Retensi |
|--------|--------|-----------|---------|
| PostgreSQL dump | `/var/backups/postgresql/` | Harian 02:00 | 7 hari |
| Off-site (manual) | NAS/S3 | Mingguan | 30 hari |
| Code (git) | GitHub | Setiap push | Permanent |

### 8.3 Update Procedure

**Backend (self-hosted di CT 102):**

```bash
# 1. Backup database dulu
bash /usr/local/bin/backup_db.sh

# 2. Update code
cd /var/www/beritakarya-prod
git pull origin main
pnpm install --frozen-lockfile

# 3. Generate & migrate jika ada schema change
pnpm --filter @beritakarya/api db:generate
pnpm --filter @beritakarya/api db:migrate:deploy

# 4. Build API
pnpm --filter @beritakarya/api build

# 5. Restart PM2
pm2 reload ecosystem.config.js
```

**Frontend (Vercel):**

```bash
# Frontend auto-deploy dari Git push ke main branch
# Cek status di Vercel Dashboard → Deployments
# Tidak perlu aksi manual di server
```

### 8.4 Rollback Procedure

**Backend (self-hosted):**

```bash
# 1. Restore database
pg_restore -U berita_user -h 10.0.0.11 -d beritakarya -c /var/backups/postgresql/beritakarya_backup_<DATE>.dump

# 2. Rollback code
cd /var/www/beritakarya-prod
git log --oneline -5  # Cari commit sebelumnya
git checkout <COMMIT_HASH>
pnpm install --frozen-lockfile
pnpm --filter @beritakarya/api build

# 3. Restart
pm2 reload ecosystem.config.js
```

**Frontend (Vercel):**

```bash
# Di Vercel Dashboard → Deployments → cari deployment sebelumnya → "Promote to Production"
# Atau revert commit di Git, Vercel auto-deploy versi sebelumnya
```

---

> **Dokumen ini adalah referensi utama untuk infrastruktur. Codebase harus menyesuaikan dengan nilai-nilai yang ditentukan di sini (IP, port, credential format, dll). Lihat `implementasi-codebase.md` untuk detail penyesuaian codebase.**
