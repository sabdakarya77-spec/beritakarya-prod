# Proxmox VE Setup Guide — BeritaKarya Home Server

> **Status**: 📋 Plan — Belum diimplementasikan
>
> **Arsitektur**: LXC-1 (DB native) + LXC-2 (API Docker) + LXC-3 (Monitor Docker) + VM-4 (AI GPU PT)
>
> **Update terakhir**: 17 Juni 2026

---

## Spesifikasi Server

| Komponen | Spesifikasi |
|----------|-------------|
| CPU | AMD Ryzen 7 8700F (8 core / 16 thread) |
| RAM | 32 GB |
| Storage | SSHD 1 TB (hybrid SSD+HDD) |
| GPU | AMD RX 6700 XT (12 GB VRAM) |

---

## 1. Install Proxmox VE

### 1.1 Download ISO

```
URL: https://www.proxmox.com/en/downloads
File: proxmox-ve_8.x.iso
```

### 1.2 Create Bootable USB

```bash
# Windows: gunakan Rufus atau Ventoy
# Linux:
dd if=proxmox-ve_8.x.iso of=/dev/sdX bs=4M status=progress
```

### 1.3 Install

1. Boot dari USB
2. Pilih **Install Proxmox VE (Graphical)**
3. Target disk: pilih SSHD 1 TB
4. Country: Indonesia
5. Timezone: Asia/Jakarta
6. Keyboard: US
7. Password & email: sesuai kebutuhan
8. Network:
   - Management interface: `enp0s3` (sesuaikan)
   - Hostname: `pve.home.lan`
   - IP: `192.168.1.100/24`
   - Gateway: `192.168.1.1`
9. Install → Reboot

### 1.4 Post-Install Access

```
URL: https://192.168.1.100:8006
Username: root
Password: <password-saat-install>
```

### 1.5 Disable Enterprise Repository (Free)

```bash
# Disable enterprise repo
rm /etc/apt/sources.list.d/pve-enterprise.list

# Add no-subscription repo
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

# Update
apt update && apt dist-upgrade -y
```

---

## 2. Konfigurasi Network

### 2.1 Network Architecture

```
Internet
    │
    └── Router (192.168.1.1)
            │
            └── Proxmox Host (192.168.1.100)
                    │
                    └── vmbr0 (bridge)
                            │
                            ├── LXC-1: 10.0.0.11 (Database)
                            ├── LXC-2: 10.0.0.12 (API)
                            ├── LXC-3: 10.0.0.13 (Monitoring)
                            └── VM-4:  10.0.0.14 (AI Stack)
```

### 2.2 Host Network Config

Edit `/etc/network/interfaces`:

```bash
auto lo
iface lo inet loopback

auto enp0s3
iface enp0s3 inet manual

auto vmbr0
iface vmbr0 inet static
    address 192.168.1.100/24
    gateway 192.168.1.1
    bridge-ports enp0s3
    bridge-stp off
    bridge-fd 0
    # Internal network untuk LXC/VM
    post-up ip route add 10.0.0.0/24 dev vmbr0
```

### 2.3 Apply Network

```bash
# Restart networking (hati-hati, bisa disconnect SSH)
systemctl restart networking

# Atau reboot
reboot
```

### 2.4 Verifikasi

```bash
# Cek bridge
ip addr show vmbr0

# Cek routing
ip route

# Test connectivity
ping -c 3 192.168.1.1
ping -c 3 8.8.8.8
```

---

## 3. Enable IOMMU (GPU Passthrough)

> **Wajib** untuk VM-4 AI Stack dengan RX 6700 XT.

### 3.1 Enable IOMMU di BIOS

```
Reboot → Enter BIOS (Del/F2)
Advanced → CPU Configuration:
  - SVM Mode: Enabled (AMD)
  - IOMMU: Enabled
Save & Exit
```

### 3.2 Enable IOMMU di Proxmox

```bash
# Edit GRUB
nano /etc/default/grub

# Ubah GRUB_CMDLINE_LINUX:
GRUB_CMDLINE_LINUX="amd_iommu=on iommu=pt"

# Apply
update-grub
reboot
```

### 3.3 Verifikasi IOMMU

```bash
# Cek IOMMU groups
dmesg | grep -i iommu
# Expected: AMD-Vi: Interrupt remapping enabled

# Cek GPU di IOMMU group
for d in /sys/kernel/iommu_groups/*/devices/*; do
    n=${d#*/iommu_groups/*}; n=${n%%/*}
    printf 'IOMMU Group %s: ' "$n"
    lspci -nns "${d##*/}"
done | grep -i vga
```

### 3.4 Bind VFIO Driver

```bash
# Cek GPU PCI IDs
lspci -nn | grep -i vga
# Contoh output:
# 03:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Navi 22 [Radeon RX 6700/6700 XT/6750 XT / 6800M/6850M XT] [1002:73df]
# 03:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Navi 21/23 HDMI/DP Audio Controller [1002:ab28]

# Buat VFIO config
nano /etc/modprobe.d/vfio.conf
```

Isi file:

```
options vfio-pci ids=1002:73df,1002:ab28
```

```bash
# Blacklist AMD driver
nano /etc/modprobe.d/blacklist-amdgpu.conf
```

Isi file:

```
blacklist amdgpu
blacklist snd_hda_intel
```

```bash
# Update initramfs
update-initramfs -u -k all
reboot
```

### 3.5 Verifikasi VFIO

```bash
# GPU harusnya pakai vfio-pci, bukan amdgpu
lspci -nnk -s 03:00.0
# Expected: Kernel driver in use: vfio-pci
```

---

## 4. Storage Setup

### 4.1 Buat Directory Bind-Mount

```bash
mkdir -p /data/pve/lxc-1-db
mkdir -p /data/pve/lxc-2-app
mkdir -p /data/pve/lxc-3-monitor
mkdir -p /data/pve/vm-4-ai/models
```

### 4.2 Tambah Storage di Proxmox GUI

**Datacenter → Storage → Add → Directory:**

| ID | Path | Content | Contain |
|----|------|---------|---------|
| `lxc-1-data` | `/data/pve/lxc-1-db` | Container, VZDump backup file | ✓ Container ✓ Backup |
| `lxc-2-data` | `/data/pve/lxc-2-app` | Container, VZDump backup file | ✓ Container ✓ Backup |
| `lxc-3-data` | `/data/pve/lxc-3-monitor` | Container, VZDump backup file | ✓ Container ✓ Backup |
| `vm-4-data` | `/data/pve/vm-4-ai` | Disk image, ISO image | ✓ Disk image ✓ ISO |

### 4.3 Download Template

**Storage → local → Templates → Download:**

| Template | Untuk |
|----------|-------|
| `debian-12-standard` | LXC-1, LXC-2, LXC-3 |

**Upload ISO** (VM-4):

```
Download Ubuntu 22.04 LTS Server ISO
Upload ke storage "vm-4-data" → ISO Images → Upload
```

---

## 5. LXC-1: Database (Native, Tanpa Docker)

### 5.1 Buat Container

**Proxmox GUI → Create CT:**

| Setting | Value |
|---------|-------|
| CT ID | 101 |
| Hostname | `lxc-1-db` |
| Password | `<strong-password>` |
| Template | `debian-12-standard` |
| Disk | 20 GB (local-lvm) |
| RAM | 2048 MB |
| Swap | 512 MB |
| CPU | 2 cores |
| Network | IPv4: Static `10.0.0.11/24`, Gateway: `10.0.0.1` |
| DNS | `1.1.1.1` |

### 5.2 Mount Point

**LXC-101 → Options → Mount Points → Add:**

| Key | Value |
|-----|-------|
| Mount Point | mp0 |
| Storage | `lxc-1-data` |
| Size | 20 GB |
| Mount point | `/data` |

### 5.3 Startup Order

**LXC-101 → Options → Startup:**

| Setting | Value |
|---------|-------|
| Start at boot | ✓ |
| Startup order | 1 |
| Shutdown timeout | 60 |

### 5.4 Start & Setup

```bash
# Start container dari GUI atau:
pct start 101

# Masuk ke container
pct enter 101
```

### 5.5 Setup di dalam LXC-1

```bash
# Update system
apt update && apt upgrade -y

# Install utilities
apt install -y curl wget gnupg2 lsb-release

# ============================================
# POSTGRESQL 15
# ============================================

# Install
apt install -y postgresql-15 postgresql-client-15

# Setup database & user
sudo -u postgres psql <<'EOF'
CREATE USER beritakarya WITH PASSWORD '<strong-password>';
CREATE DATABASE beritakarya OWNER beritakarya;
GRANT ALL PRIVILEGES ON DATABASE beritakarya TO beritakarya;
EOF

# Konfigurasi PostgreSQL
cat > /etc/postgresql/15/main/conf.d/beritakarya.conf <<'EOF'
# Memory (tuned for 2 GB RAM)
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 16MB
maintenance_work_mem = 128MB

# Connections
max_connections = 100

# Performance
wal_buffers = 16MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
EOF

# Allow connections from internal network
cat >> /etc/postgresql/15/main/pg_hba.conf <<'EOF'
# BeritaKarya API (LXC-2)
host    beritakarya    beritakarya    10.0.0.0/24    md5
EOF

# Restart PostgreSQL
systemctl enable postgresql
systemctl restart postgresql

# Verifikasi
sudo -u postgres psql -c "\l"
# Harus muncul database "beritakarya"

# ============================================
# REDIS 7
# ============================================

# Install
apt install -y redis-server

# Konfigurasi
cat > /etc/redis/redis.conf.d/beritakarya.conf <<'EOF'
# Password
requirepass <strong-password>

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Network
bind 0.0.0.0
protected-mode yes

# Persistence
appendonly yes
appendfsync everysec

# Logging
loglevel notice
EOF

# Restart Redis
systemctl enable redis-server
systemctl restart redis-server

# Verifikasi
redis-cli -a <strong-password> ping
# Expected: PONG

# ============================================
# FIREWALL (minimal)
# ============================================

apt install -y ufw
ufw allow from 10.0.0.0/24
ufw allow ssh
ufw enable

# ============================================
# VERIFY
# ============================================

# Dari host Proxmox, test koneksi:
# pct exec 101 -- psql -h localhost -U beritakarya -d beritakarya -c "SELECT 1;"
```

---

## 6. LXC-2: API Stack (Docker)

### 6.1 Buat Container

**Proxmox GUI → Create CT:**

| Setting | Value |
|---------|-------|
| CT ID | 102 |
| Hostname | `lxc-2-app` |
| Password | `<strong-password>` |
| Template | `debian-12-standard` |
| Disk | 15 GB (local-lvm) |
| RAM | 4096 MB |
| Swap | 1024 MB |
| CPU | 4 cores |
| Network | IPv4: Static `10.0.0.12/24`, Gateway: `10.0.0.1` |
| DNS | `1.1.1.1` |

### 6.2 Mount Point

**LXC-102 → Options → Mount Points → Add:**

| Key | Value |
|-----|-------|
| Mount Point | mp0 |
| Storage | `lxc-2-data` |
| Size | 15 GB |
| Mount point | `/data` |

### 6.3 Enable Nesting (untuk Docker di LXC)

**LXC-102 → Options → Features:**

| Setting | Value |
|---------|-------|
| Nesting | ✓ (harus diaktifkan) |

### 6.4 Startup Order

| Setting | Value |
|---------|-------|
| Start at boot | ✓ |
| Startup order | 2 |
| Shutdown timeout | 120 |

### 6.5 Start & Setup

```bash
pct start 102
pct enter 102
```

### 6.6 Setup di dalam LXC-2

```bash
# Update system
apt update && apt upgrade -y

# Install utilities
apt install -y curl wget gnupg2 lsb-release ca-certificates

# ============================================
# DOCKER
# ============================================

# Install Docker
curl -fsSL https://get.docker.com | sh

# Enable & start
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install -y docker-compose

# Verifikasi
docker --version
docker compose version

# ============================================
# TEST KONEKSI KE DATABASE
# ============================================

# Install PostgreSQL client
apt install -y postgresql-client

# Test koneksi
psql -h 10.0.0.11 -U beritakarya -d beritakarya -c "SELECT 1;"
# Harusnya berhasil (password diminta)

# Install Redis client
apt install -y redis-tools

# Test koneksi
redis-cli -h 10.0.0.11 -a <strong-password> ping
# Expected: PONG

# ============================================
# DEPLOY API STACK (Docker Compose)
# ============================================

# Buat directory
mkdir -p /opt/lxc-2-app
cd /opt/lxc-2-app

# Copy docker-compose.yml, Caddyfile, .env dari repo
# (akan diisi saat Phase 3 deployment)

# ============================================
# FIREWALL
# ============================================

apt install -y ufw
ufw allow from 10.0.0.0/24
ufw allow ssh
ufw enable
```

---

## 7. LXC-3: Monitoring (Docker)

### 7.1 Buat Container

**Proxmox GUI → Create CT:**

| Setting | Value |
|---------|-------|
| CT ID | 103 |
| Hostname | `lxc-3-monitor` |
| Password | `<strong-password>` |
| Template | `debian-12-standard` |
| Disk | 10 GB (local-lvm) |
| RAM | 1024 MB |
| Swap | 512 MB |
| CPU | 2 cores |
| Network | IPv4: Static `10.0.0.13/24`, Gateway: `10.0.0.1` |
| DNS | `1.1.1.1` |

### 7.2 Mount Point

**LXC-103 → Options → Mount Points → Add:**

| Key | Value |
|-----|-------|
| Mount Point | mp0 |
| Storage | `lxc-3-data` |
| Size | 10 GB |
| Mount point | `/data` |

### 7.3 Enable Nesting

**LXC-103 → Options → Features:**

| Setting | Value |
|---------|-------|
| Nesting | ✓ |

### 7.4 Startup Order

| Setting | Value |
|---------|-------|
| Start at boot | ✓ |
| Startup order | 3 |
| Shutdown timeout | 60 |

### 7.5 Start & Setup

```bash
pct start 103
pct enter 103
```

### 7.6 Setup di dalam LXC-3

```bash
# Update system
apt update && apt upgrade -y

# Install utilities
apt install -y curl wget

# ============================================
# DOCKER
# ============================================

curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
apt install -y docker-compose

# ============================================
# DEPLOY MONITORING STACK (Docker Compose)
# ============================================

mkdir -p /opt/lxc-3-monitor
cd /opt/lxc-3-monitor

# Copy docker-compose.yml, prometheus.yml dari repo
# (akan diisi saat Phase 5 deployment)

# ============================================
# FIREWALL
# ============================================

apt install -y ufw
ufw allow from 10.0.0.0/24
ufw allow ssh
ufw enable
```

---

## 8. VM-4: AI Stack (GPU Passthrough)

### 8.1 Buat VM

**Proxmox GUI → Create VM:**

| Tab | Setting | Value |
|-----|---------|-------|
| General | VM ID | 400 |
| General | Name | `vm-4-ai` |
| OS | ISO | Ubuntu 22.04 LTS Server |
| OS | Type | Linux 6.x |
| System | Machine | q35 |
| System | BIOS | OVMF (UEFI) |
| System | EFI Disk | local-lvm |
| Disk | Size | 50 GB |
| Disk | Storage | local-lvm |
| CPU | Cores | 4 |
| CPU | Type | host |
| Memory | MiB | 6144 |
| Network | Bridge | vmbr0 |
| Network | Model | VirtIO (paravirtualized) |

### 8.2 Tambah GPU Passthrough

**VM-400 → Hardware → Add → PCI Device:**

| Setting | Value |
|---------|-------|
| Device | `0000:03:00.0` (GPU) |
| All Functions | ✓ |
| PCI-Express | ✓ |
| Primary GPU | ✓ |

> **Catatan**: Cek address GPU dengan `lspci | grep VGA` di host. Sesuaikan jika berbeda.

### 8.3 Edit VM Config

```bash
# Edit /etc/pve/qemu-server/400.conf
# Tambahkan di akhir file:

args: -cpu 'host,+topoext,kvm=off'
```

### 8.4 Install Ubuntu

1. Start VM dari GUI
2. Open Console
3. Install Ubuntu 22.04 LTS Server
4. Saat install:
   - Username: `beritakarya`
   - Password: `<strong-password>`
   - IP: Static `10.0.0.14/24`, Gateway: `10.0.0.1`
   - Install OpenSSH server: ✓

### 8.5 Post-Install Setup di VM-4

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install utilities
sudo apt install -y curl wget gnupg2 lsb-release

# ============================================
# ROCm (AMD GPU Compute)
# ============================================

# Install ROCm 5.7
wget https://repo.radeon.com/amdgpu-install/5.7.1/ubuntu/jammy/amdgpu-install_5.7.1.50701-1_all.deb
sudo apt install -y ./amdgpu-install_5.7.1.50701-1_all.deb
sudo apt install -y rocm-hip-runtime rocm-dev

# Add user ke group
sudo usermod -aG video,render beritakarya

# Reboot untuk apply group
sudo reboot

# Verifikasi ROCm
rocminfo
# Harus muncul info GPU RX 6700 XT

# ============================================
# OLLAMA
# ============================================

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Buat systemd service override untuk ROCm
sudo mkdir -p /etc/systemd/system/ollama.service.d
cat <<'EOF' | sudo tee /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="HSA_OVERRIDE_GFX_VERSION=10.3.0"
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/data/pve/vm-4-ai/models"
EOF

# Reload & restart
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl restart ollama

# Verifikasi Ollama running
curl http://localhost:11434/api/tags
# Expected: {"models":[]}

# Download model
ollama pull llama3:8b

# Test inference
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Hello, introduce yourself in one sentence.",
  "stream": false
}'

# ============================================
# OPEN WEBUI (Optional)
# ============================================

# Install Docker (untuk Open WebUI)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# Deploy Open WebUI
docker run -d \
  --name open-webui \
  --restart always \
  -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  --add-host=host.docker.internal:host-gateway \
  -v /data/pve/vm-4-ai/open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main

# Access: http://10.0.0.14:3000

# ============================================
# FIREWALL
# ============================================

sudo apt install -y ufw
sudo ufw allow from 10.0.0.0/24
sudo ufw allow ssh
sudo ufw enable
```

---

## 9. Monitoring Setup di Host

### 9.1 Install node_exporter di Setiap LXC/VM

```bash
# Di setiap LXC dan VM:
apt install -y prometheus-node-exporter
systemctl enable prometheus-node-exporter
systemctl start prometheus-node-exporter
```

### 9.2 Verifikasi Connectivity

```bash
# Dari Proxmox host:
# LXC-1 (Database)
pct exec 101 -- curl -s http://localhost:9100/metrics | head -5

# LXC-2 (API)
pct exec 102 -- curl -s http://localhost:9100/metrics | head -5

# LXC-3 (Monitoring)
pct exec 103 -- curl -s http://localhost:9100/metrics | head -5

# VM-4 (AI) - via SSH atau ping
ssh beritakarya@10.0.0.14 "curl -s http://localhost:9100/metrics | head -5"
```

---

## 10. Backup & Restore

### 10.1 Proxmox Backup (GUI)

**Datacenter → Backup → Add:**

| Setting | Value |
|---------|-------|
| Storage | local |
| Schedule | Daily 02:00 |
| Selection Mode | All |
| Compression | ZSTD |
| Mode | Snapshot |

### 10.2 Manual Backup

```bash
# Backup LXC-1 (Database)
vzdump 101 --compress zstd --storage local --mode snapshot

# Backup LXC-2 (API)
vzdump 102 --compress zstd --storage local --mode snapshot

# Backup LXC-3 (Monitoring)
vzdump 103 --compress zstd --storage local --mode snapshot

# Backup VM-4 (AI)
vzdump 400 --compress zstd --storage local --mode snapshot
```

### 10.3 Database Backup (di dalam LXC-1)

```bash
# Manual dump
pg_dump -U beritakarya beritakarya > /data/backups/beritakarya_$(date +%Y%m%d).sql

# Cron job
cat > /etc/cron.d/db-backup <<'EOF'
0 2 * * * postgres pg_dump -U beritakarya beritakarya | gzip > /data/backups/beritakarya_$(date +\%Y\%m\%d).sql.gz
EOF
```

---

## 11. Troubleshooting

### 11.1 GPU Passthrough Issues

```bash
# Cek GPU status
lspci -nnk -s 03:00.0
# Harus: Kernel driver in use: vfio-pci

# Cek IOMMU groups
dmesg | grep -i iommu

# Reset GPU jika stuck
echo 1 > /sys/bus/pci/devices/0000:03:00.0/reset
```

### 11.2 LXC Docker Issues

```bash
# Jika Docker tidak jalan di LXC:
# Pastikan nesting enabled di LXC options

# Cek systemd
systemctl status docker

# Restart Docker
systemctl restart docker
```

### 11.3 Network Connectivity

```bash
# Dari host, test semua LXC/VM:
pct exec 101 -- ping -c 3 10.0.0.12
pct exec 102 -- ping -c 3 10.0.0.11
pct exec 103 -- ping -c 3 10.0.0.12

# Cek firewall
ufw status
```

---

## Checklist Setup

### Phase 1: Proxmox Base
- [ ] Install Proxmox VE
- [ ] Disable enterprise repo, enable no-subscription
- [ ] Konfigurasi network (vmbr0 bridge)
- [ ] Enable IOMMU (amd_iommu=on)
- [ ] Bind VFIO driver untuk GPU
- [ ] Buat directory bind-mount (/data/pve/*)
- [ ] Tambah storage di Proxmox GUI
- [ ] Download debian-12 template
- [ ] Upload Ubuntu 22.04 ISO

### Phase 2: LXC-1 (Database)
- [ ] Buat LXC-101 (2 GB RAM, 2 core)
- [ ] Mount point: /data
- [ ] Startup order: 1
- [ ] Install PostgreSQL 15
- [ ] Konfigurasi PostgreSQL (tuned 2 GB)
- [ ] Install Redis 7
- [ ] Konfigurasi Redis (password, maxmemory)
- [ ] Test koneksi dari host

### Phase 3: LXC-2 (API)
- [ ] Buat LXC-102 (4 GB RAM, 4 core)
- [ ] Mount point: /data
- [ ] Enable nesting (untuk Docker)
- [ ] Startup order: 2
- [ ] Install Docker + Docker Compose
- [ ] Test koneksi ke LXC-1 (psql, redis-cli)

### Phase 4: LXC-3 (Monitoring)
- [ ] Buat LXC-103 (1 GB RAM, 2 core)
- [ ] Mount point: /data
- [ ] Enable nesting (untuk Docker)
- [ ] Startup order: 3
- [ ] Install Docker + Docker Compose

### Phase 5: VM-4 (AI Stack)
- [ ] Buat VM-400 (6 GB RAM, 4 core)
- [ ] Tambah GPU passthrough (RX 6700 XT)
- [ ] Install Ubuntu 22.04 LTS
- [ ] Install ROCm driver
- [ ] Install Ollama
- [ ] Set HSA_OVERRIDE_GFX_VERSION=10.3.0
- [ ] Download model (llama3:8b)
- [ ] Test inference
- [ ] (Opsional) Deploy Open WebUI

### Phase 6: Verify All
- [ ] LXC-1: PostgreSQL & Redis running
- [ ] LXC-2: Docker running, bisa connect ke LXC-1
- [ ] LXC-3: Docker running
- [ ] VM-4: Ollama running, GPU detected
- [ ] Semua LXC/VM bisa ping satu sama lain
- [ ] Backup terkonfigurasi
