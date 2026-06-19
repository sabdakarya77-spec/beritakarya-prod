# Transcript: Panduan Jaringan MikroTik & Proxmox (Opsi A)

# Panduan Topologi Jaringan MikroTik & Proxmox VE — BeritaKarya

> **Dokumen ini**: Panduan merancang dan mengkonfigurasi topologi jaringan dari awal menggunakan satu unit **MikroTik Router** sebagai pusat jaringan (gateway, DHCP, firewall, dan routing) untuk home server **Proxmox VE** yang menjalankan workload **BeritaKarya**.
>
> **Tujuan**: Memisahkan jaringan rumah (LAN/WiFi) dengan jaringan server (Production) demi keamanan menggunakan **VLAN**, serta mengintegrasikannya dengan Proxmox tanpa memerlukan port forwarding (menggunakan Cloudflare Tunnel).

---

## 1. Topologi Fisik & Logis

### 1.1 Diagram Jaringan (Physical & Logical)

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

## 3. Detail Alokasi IP & VLAN (Opsi A)

Jika Anda memilih **Opsi A (Rekomendasi)**, berikut adalah rancangan segmentasi jaringannya:

| Nama Jaringan | ID VLAN | Subnet | IP Gateway (MikroTik) | Range DHCP | Kegunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WAN** | - | *Dynamic (ISP)* | - | - | Koneksi ke Internet (Modem ISP) |
| **VLAN_LAN (Admin)** | `10` | `192.168.10.0/24` | `192.168.10.1` | `192.168.10.100 - .254` | PC Admin, Laptop, AP WiFi Rumah, Host Proxmox WebUI |
| **VLAN_SRV (Server)**| `20` | `10.0.0.0/24` | `10.0.0.1` | *Static Only* (Lease via Mac) | LXC Container BeritaKarya (Database, App, Monitor) |

### Alokasi IP Perangkat (Opsi A):
- **MikroTik Router**:
  - `192.168.10.1` (IP LAN Gateway)
  - `10.0.0.1` (IP Server Gateway)
- **Proxmox Host (Management Web UI)**: `192.168.10.50` (VLAN 10)
- **CT 101 (lxc-1-db)**: `10.0.0.11` (VLAN 20)
- **CT 102 (lxc-2-app)**: `10.0.0.12` (VLAN 20)
- **CT 103 (lxc-3-monitor)**: `10.0.0.13` (VLAN 20)

---

## 4. Konfigurasi MikroTik (Opsi A - Rekomendasi)

Berikut langkah konfigurasi menggunakan **RouterOS CLI** (dapat diinput via New Terminal di Winbox atau SSH).

### 4.1 Persiapan Bridge & Port
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

### 4.2 Definisikan VLAN Interface pada MikroTik
Agar MikroTik dapat memiliki IP Address di masing-masing VLAN and berfungsi sebagai gateway.

```routeros
# Buat interface VLAN yang menginduk ke bridge-local
/interface vlan
add interface=bridge-local name=vlan10-LAN vlan-id=10
add interface=bridge-local name=vlan20-SRV vlan-id=20
```

### 4.3 Alokasikan IP Address & DHCP Server
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

### 4.4 Konfigurasi VLAN Table (Bridge VLAN)
Menentukan bagaimana paket ber-tag (tagged) dan tidak ber-tag (untagged) dilewatkan pada port bridge.

```routeros
/interface bridge vlan
# VLAN 10: Tagged di bridge-local (agar RouterOS bisa baca) dan Ether2 (Trunk), Untagged di Ether3,4,5 (Access)
add bridge=bridge-local tagged=bridge-local,ether2 untagged=ether3,ether4,ether5 vlan-ids=10

# VLAN 20: Tagged di bridge-local (untuk gateway) dan Ether2 (Trunk ke Proxmox)
add bridge=bridge-local tagged=bridge-local,ether2 vlan-ids=20
```

### 4.5 Aktifkan VLAN Filtering di Bridge
**PENTING**: Lakukan langkah ini hanya jika Anda yakin konfigurasi di atas sudah benar. Jika Anda terhubung ke router via Ether3/4/5, Anda tidak akan terputus karena port tersebut sudah dikonfigurasi masuk ke VLAN 10.

```routeros
/interface bridge set bridge-local vlan-filtering=yes
```

### 4.6 Konfigurasi Internet (WAN) & NAT
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

## 5. Instalasi & Konfigurasi Proxmox VE Host (Opsi A)

Bagian ini mencakup seluruh proses dari nol: mulai dari membuat USB bootable, instalasi Proxmox VE, konfigurasi awal pasca-install, pengaturan network VLAN, hingga pembuatan LXC Container yang terhubung ke VLAN 20.

---

### 5.0 Persiapan: Download & Buat USB Bootable

#### 5.0.1 Download ISO Proxmox VE

Unduh ISO terbaru dari situs resmi Proxmox:

```
https://www.proxmox.com/en/downloads/proxmox-virtual-environment/iso
```

Pilih versi **Proxmox VE 8.x** (versi terbaru yang tersedia). File ISO berukuran sekitar ~1.3 GB.

#### 5.0.2 Buat USB Bootable

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

### 5.1 Instalasi Proxmox VE

#### 5.1.1 Boot dari USB

1. Colokkan USB bootable ke mesin server (PC/mini PC yang akan jadi Proxmox host)
2. Nyalakan mesin → masuk ke **BIOS/UEFI** (biasanya tekan `F2`, `F12`, `DEL`, atau `ESC` saat booting)
3. Di menu BIOS:
   - Pastikan **Secure Boot** di-**disable**
   - Pastikan **Virtualization Technology (VT-x / AMD-V)** di-**enable**
   - Set **Boot Order**: USB di urutan pertama
4. Simpan dan restart → mesin akan boot ke installer Proxmox

#### 5.1.2 Proses Installer Proxmox VE

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

### 5.2 Akses Pertama ke Web UI Proxmox

Setelah server restart, Proxmox siap diakses melalui browser.

#### 5.2.1 Buka Web UI

Dari PC Admin yang terhubung ke jaringan yang sama, buka browser dan akses:

```
https://192.168.10.50:8006
```

> Browser akan menampilkan **peringatan keamanan** karena sertifikat SSL self-signed. Klik **Advanced** → **Proceed** (aman untuk jaringan lokal).

Login dengan:
- **User**: `root`
- **Password**: *(password yang dibuat saat instalasi)*
- **Realm**: `Linux PAM standard authentication`

#### 5.2.2 Abaikan Peringatan Subscription

Proxmox akan menampilkan popup **"No valid subscription"**. Ini normal untuk penggunaan personal/non-enterprise. Klik **OK** untuk menutupnya.

---

### 5.3 Konfigurasi Awal Pasca Install

Sebelum mengkonfigurasi jaringan VLAN, lakukan beberapa langkah penting ini terlebih dahulu.

#### 5.3.1 Nonaktifkan Repository Enterprise (Berbayar)

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

#### 5.3.2 Update Sistem

```bash
apt full-upgrade -y
```

Tunggu hingga proses update selesai. Jika ada pertanyaan konfirmasi tentang file konfigurasi, pilih **`N`** (keep existing config).

#### 5.3.3 Install Package Pendukung

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

#### 5.3.4 (Opsional) Nonaktifkan Popup Subscription via Script

```bash
# Patch UI untuk menghilangkan popup "No valid subscription" permanen
sed -Ezi.bak "s/(Ext.Msg.show\(\{.*?title: gettext\('No valid sub)/void\(\{ \/\/\1/g" \
  /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js

# Restart layanan web Proxmox
systemctl restart pveproxy
```

---

### 5.4 Konfigurasi Network VLAN-Aware

Ini adalah inti konfigurasi Proxmox untuk mendukung topologi **Opsi A (Centralized VLAN)**. Kita akan mengubah bridge `vmbr0` menjadi VLAN-aware dan menambahkan interface manajemen di VLAN 10.

#### 5.4.1 Cek Interface Fisik yang Tersedia

Sebelum mengedit konfigurasi, identifikasi nama NIC fisik server:

```bash
ip link show
# atau
ls /sys/class/net/
```

Catat nama interface fisik yang terhubung ke MikroTik `ether2`. Biasanya bernama `enp3s0`, `enp2s0`, `eth0`, dll. Panduan ini menggunakan `enp3s0` sebagai contoh — **sesuaikan dengan NIC Anda**.

#### 5.4.2 Backup Konfigurasi Network Lama

```bash
cp /etc/network/interfaces /etc/network/interfaces.bak
```

#### 5.4.3 Edit File `/etc/network/interfaces`

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

#### 5.4.4 Terapkan Konfigurasi Network Tanpa Reboot

```bash
ifreload -a
```

> Perintah ini memuat ulang semua interface sesuai file `/etc/network/interfaces` tanpa memutus sesi SSH secara permanen. Jika koneksi SSH sempat putus sebentar, tunggu 10-15 detik lalu hubungkan kembali ke IP `192.168.10.50`.

#### 5.4.5 Verifikasi Network Proxmox Host

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

### 5.5 Verifikasi VLAN-Aware di Web UI Proxmox

Setelah konfigurasi CLI diterapkan, verifikasi hasilnya di Web UI:

1. Buka Web UI: `https://192.168.10.50:8006`
2. Masuk ke **Proxmox Node** → **System** → **Network**
3. Pastikan `vmbr0` memiliki keterangan **VLAN aware: Yes**
4. Pastikan `vmbr0.10` terdaftar dengan IP `192.168.10.50/24`

Jika konfigurasi tampil benar di UI, Proxmox Host sudah siap menerima VLAN traffic dari MikroTik.

---

### 5.6 Download Template LXC Container

Sebelum membuat container, download template OS yang akan digunakan (Debian 12 Bookworm direkomendasikan karena ringan dan kompatibel).

#### 5.6.1 Via Web UI

1. Di Web UI, klik **`local`** (storage default) → **`CT Templates`**
2. Klik **`Templates`**
3. Cari **`debian-12-standard`**
4. Klik **`Download`** dan tunggu hingga selesai

#### 5.6.2 Via CLI (Lebih Cepat)

```bash
# Lihat daftar template yang tersedia
pveam available | grep debian

# Download template Debian 12
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# Verifikasi template sudah terunduh
pveam list local
```

---

### 5.7 Membuat LXC Container (CT 101 — Database)

Kita akan membuat **CT 101** untuk layanan database (`lxc-1-db`) dengan IP statis `10.0.0.11` di VLAN 20.

#### 5.7.1 Via Web UI Proxmox

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

#### 5.7.2 Via CLI (Alternatif)

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

### 5.8 Membuat LXC Container (CT 102 — API Server)

Ulangi proses yang sama untuk **CT 102** (`lxc-2-app`) — container ini menjalankan Express API dan Cloudflare Tunnel. Frontend (Next.js) di-deploy ke **Vercel**.

#### Via CLI:

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

### 5.9 Membuat LXC Container (CT 103 — Monitor)

**CT 103** (`lxc-3-monitor`) untuk stack monitoring (Grafana, Prometheus, dll).

#### Via CLI:

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

### 5.10 Verifikasi Container & Koneksi VLAN 20

#### 5.10.1 Cek Status Semua Container

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

#### 5.10.2 Masuk ke Console CT 101 dan Uji Koneksi

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

#### 5.10.3 Masuk ke Console CT 102 dan Uji Internet

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

#### 5.10.4 Update Package di Semua Container

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

### 5.11 (Opsional) Konfigurasi SSH Key untuk Akses Container

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