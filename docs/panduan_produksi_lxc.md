# Panduan Konfigurasi LXC Container BeritaKarya: DB, App, & Monitor (Production-Ready)

Dokumen ini menyediakan panduan langkah-demi-langkah yang terperinci untuk mengonfigurasi tiga LXC Container di Proxmox VE (VLAN 20) agar siap digunakan di lingkungan produksi (*production-ready*).

Berdasarkan dokumen arsitektur dan topologi jaringan, berikut adalah alokasi container kita:
- **CT 101 (`lxc-1-db`)**: `10.0.0.11` — Menjalankan PostgreSQL 15, Redis 7, dan Meilisearch v1.6.
- **CT 102 (`lxc-2-app`)**: `10.0.0.12` — Menjalankan Express API (PM2), Caddy, dan Cloudflare Tunnel. Frontend (Next.js) di-deploy ke **Vercel**.
- **CT 103 (`lxc-3-monitor`)**: `10.0.0.13` — Menjalankan Prometheus, Grafana, dan Exporters.

---

## BAB 1: Tuning Infrastruktur & Keamanan LXC (Global)

Sebelum masuk ke konfigurasi masing-masing layanan, lakukan tuning dasar pada setiap LXC Container untuk performa tinggi dan keamanan produksi.

### 1.1 Optimasi Limit System File (`/etc/security/limits.conf`)
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

### 1.2 Tuning Sysctl untuk Performa Jaringan (`/etc/sysctl.d/99-production.conf`)
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

## BAB 2: Konfigurasi `lxc-1-db` (Database, Cache, & Search)

Container ini dialokasikan 2 Core CPU dan 4 GB RAM. Layanan yang akan diinstal: PostgreSQL 15, Redis 7, dan Meilisearch v1.6.

### 2.1 Menginstal PostgreSQL 15, Redis 7, dan Meilisearch
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

### 2.2 Tuning PostgreSQL 15 untuk Produksi (RAM 4 GB)
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

#### Pengaturan Autentikasi (`/etc/postgresql/15/main/pg_hba.conf`):
Izinkan container aplikasi `lxc-2-app` (`10.0.0.12`) mengakses database menggunakan enkripsi password md5/scram-sha-256:

```text
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    beritakarya     berita_user     10.0.0.12/32            scram-sha-256
host    beritakarya     berita_user     10.0.0.13/32            scram-sha-256 # Untuk monitoring
```

#### Membuat Database dan User:
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

### 2.3 Tuning Redis 7 untuk Produksi
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

### 2.4 Konfigurasi Meilisearch v1.6
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

### 2.5 Script Backup Database Otomatis (Cron)
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

## BAB 3: Konfigurasi `lxc-2-app` (API Server)

Container ini dialokasikan 2 Core CPU dan 4 GB RAM untuk menjalankan backend Express API. Frontend (Next.js) di-deploy ke **Vercel**, tidak di container ini.

### 3.1 Install Node.js LTS, PNPM, PM2, dan Caddy
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

### 3.2 Deployment Aplikasi BeritaKarya
Clone repositori proyek ini ke direktori `/var/www/beritakarya-prod`:

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_REPOSITORI_ANDA> beritakarya-prod
cd beritakarya-prod

# Pasang dependency monorepo menggunakan pnpm
pnpm install --frozen-lockfile
```

### 3.3 Konfigurasi Environment File (`.env`) untuk Produksi
Konfigurasikan environment file di masing-masing aplikasi.

#### 3.3.1 backend API: `/var/www/beritakarya-prod/apps/api/.env`
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

#### 3.3.2 Frontend (Vercel — Tidak Perlu di Server)

Frontend di-deploy ke **Vercel**. Environment variables diatur di **Vercel Dashboard** → Project → Settings → Environment Variables:

| Variable | Nilai |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.beritakarya.co` |
| `NEXT_PUBLIC_URL` | `https://beritakarya.co` |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` |

> Tidak perlu buat `.env.production` di server. Cukup set di Vercel Dashboard.

### 3.4 Build API & Inisialisasi Database
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

### 3.5 Konfigurasi PM2 Process Manager
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

### 3.6 Konfigurasi Caddy Reverse Proxy
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

### 3.7 Integrasi Cloudflare Tunnel
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

## BAB 4: Konfigurasi `lxc-3-monitor` (Monitoring Stack)

Container ini dialokasikan 2 Core CPU dan 2 GB RAM. Layanan yang akan diinstal: Prometheus, Grafana, dan Exporter untuk pemantauan menyeluruh.

### 4.1 Pemasangan Prometheus & Grafana
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

### 4.2 Mengonfigurasi Prometheus Scraping Target
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

### 4.3 Menginstal Exporters pada Container Target

#### 4.3.1 Pasang Node Exporter di SEMUA Container (`101`, `102`, `103`)
Di masing-masing container, jalankan:
```bash
apt update && apt install -y prometheus-node-exporter
systemctl restart prometheus-node-exporter
systemctl enable prometheus-node-exporter
```

#### 4.3.2 Pasang PostgreSQL Exporter di Container DB (`10.0.0.11`)
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

#### 4.3.3 Pasang Redis Exporter di Container DB (`10.0.0.11`)
```bash
# Unduh dan pasang Redis Exporter
apt update && apt install -y prometheus-redis-exporter

# Sesuaikan konfigurasi jika Redis menggunakan password. Edit /etc/default/prometheus-redis-exporter:
# ARGS="-redis.addr 10.0.0.11:6379 -redis.password GantiDenganPasswordRedisKuatAnda!"

systemctl restart prometheus-redis-exporter
systemctl enable prometheus-redis-exporter
```

### 4.4 Integrasi Dashboard dan Alerting di Grafana
1. Buka Grafana di browser: `http://10.0.0.13:3000` (Login awal: `admin`/`admin`).
2. Masuk ke **Connections** → **Data Sources** → Klik **Add data source** → Pilih **Prometheus**.
3. Atur URL ke `http://localhost:9090` dan klik **Save & test**.
4. **Import Dashboards**:
   - Untuk performa VM/LXC: Klik **Dashboards** → **New** → **Import** → Masukkan ID **1860** (Node Exporter Full) → Klik Load dan pilih datasource Prometheus.
   - Untuk PostgreSQL: Import ID **9628** (PostgreSQL Database Dashboard).
   - Untuk Redis: Import ID **763** (Redis Dashboard).

---

## BAB 5: Pengujian Kesiapan Produksi (*Verification & Readiness*)

Setelah semua container terkonfigurasi, kita harus memvalidasi integritas sistem.

### 5.1 Verifikasi Konektivitas Jaringan
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

### 5.2 Jalankan Script Verifikasi Internal BeritaKarya
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

Lihat [Konfigurasi MikroTik & Proxmox VE](#konfigurasi-mikrotik--proxmox-ve) di bawah untuk topologi lengkap.



---

## Konfigurasi MikroTik & Proxmox VE

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