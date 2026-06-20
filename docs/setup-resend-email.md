# Setup Resend Email — BeritaKarya

Panduan lengkap dari awal untuk menghubungkan Resend dengan BeritaKarya.

---

## 1. Buat Akun Resend

- Buka [https://resend.com](https://resend.com)
- Sign up (bisa pakai GitHub atau email)
- **Gratis**: 100 email/hari, 3.000 email/bulan

---

## 2. Verifikasi Domain

### Tambah Domain di Resend

1. Masuk ke **Settings → Domains**
2. Klik **Add Domain**
3. Masukkan: `beritakarya.co`
4. Klik **Add**

### Tambah DNS Records di Cloudflare

Resend akan memberikan **3 record DNS**. Tambahkan semuanya di Cloudflare Dashboard → DNS → Records:

#### Record 1: DKIM (TXT)

| Field | Value |
|-------|-------|
| Type | `TXT` |
| Name | `resend._domainkey` |
| Content | `p=MIGfMA0GCSq...` (copy dari Resend) |
| Proxy status | DNS only (gray cloud) |

#### Record 2: DMARC (TXT)

| Field | Value |
|-------|-------|
| Type | `TXT` |
| Name | `_dmarc` |
| Content | `v=DMARC1; p=none;` |
| Proxy status | DNS only (gray cloud) |

#### Record 3: SPF / Return Path (MX)

| Field | Value |
|-------|-------|
| Type | `MX` |
| Name | `send` |
| Content | `feedback-smtp.resend.com` |
| Priority | `10` |
| Proxy status | DNS only (gray cloud) |

### Verifikasi di Resend

- Tunggu 1-5 menit agar DNS propagate
- Klik **Verify** di halaman domain Resend
- Status harus berubah jadi **Verified** ✅

> **Tips**: Cek propagasi DNS di [https://dnschecker.org](https://dnschecker.org) — cari record `resend._domainkey` dengan type TXT.

---

## 3. Buat API Key

1. Masuk ke **Settings → API Keys**
2. Klik **Create API Key**
3. Isi:
   - **Name**: `beritakarya-production`
   - **Permission**: `Send emails` (cukup yang ini saja)
   - **Domain**: `beritakarya.co` (atau `All domains`)
4. Klik **Add**
5. **Copy API Key** yang muncul — dimulai dengan `re_`

> ⚠️ API key hanya ditampilkan **sekali**. Simpan di tempat aman. Jika hilang, buat baru.

---

## 4. Set Environment Variables

### Server CT 102 (Backend API)

Edit file `.env` di server production:

```bash
# === Email (Resend) ===
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS="Redaksi BeritaKarya <redaksi@beritakarya.co>"
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Penjelasan Variabel

| Variabel | Nilai | Keterangan |
|----------|-------|------------|
| `EMAIL_ENABLED` | `true` | Master toggle, wajib `true` agar email aktif |
| `EMAIL_FROM_ADDRESS` | `redaksi@beritakarya.co` | Harus pakai domain yang sudah diverifikasi di Resend |
| `SMTP_HOST` | `smtp.resend.com` | Mendeteksi otomatis sebagai Resend |
| `SMTP_PORT` | `587` | Standar SMTP |
| `SMTP_USER` | `resend` | Tidak dipakai langsung, tapi wajib diisi |
| `SMTP_PASS` | `re_xxx` | API key dari step 3 |

### Opsional

```bash
# Reply-to address (jika berbeda dari from)
EMAIL_REPLY_TO=redaksi@beritakarya.co

# Secret untuk token verifikasi email (opsional, fallback ke JWT_SECRET)
EMAIL_VERIFICATION_SECRET=your_random_32_char_secret_here
```

---

## 5. Restart API

```bash
# Via PM2
pm2 restart beritakarya-api

# Cek log untuk pastikan email service aktif
pm2 logs beritakarya-api --lines 20
```

Di log harus muncul:

```
Email service initialized successfully
```

---

## 6. Test Pengiriman Email

### Test via Register

```bash
curl -X POST https://api.beritakarya.co/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234!","name":"Test User"}'
```

Response:

```json
{
  "success": true,
  "message": "Registrasi berhasil. Silakan cek email Anda untuk verifikasi."
}
```

Cek inbox `test@gmail.com` — harusnya dapat email verifikasi dari Resend.

### Test via Resend Dashboard

- Masuk ke **Logs** di dashboard Resend
- Email yang terkirim akan muncul di sana dengan status `Delivered`

---

## 7. Troubleshooting

### Email tidak terkirim

1. Cek `EMAIL_ENABLED=true` di `.env`
2. Cek log API: `pm2 logs beritakarya-api`
3. Pastikan domain **Verified** di Resend
4. Pastikan `EMAIL_FROM_ADDRESS` menggunakan domain yang sudah diverifikasi

### Domain belum verified

1. Cek DNS records di [dnschecker.org](https://dnschecker.org)
2. Pastikan proxy **OFF** (gray cloud) untuk record Resend
3. Tunggu hingga 24 jam untuk propagasi penuh

### API key error

1. Pastikan key dimulai dengan `re_`
2. Pastikan permission adalah **Send emails**
3. Buat baru jika ragu

### Rate limit

- **Gratis**: 100 email/hari, 3.000 email/bulan
- **Pro** ($20/bulan): 50.000 email/bulan, 100 domain
- Cek usage di dashboard Resend → **Usage**

---

## 8. Email yang Dikirim oleh Sistem

| Email | Trigger | Endpoint |
|-------|---------|----------|
| Verifikasi Email | User daftar | `POST /auth/register` |
| Reset Password | User lupa password | `POST /auth/forgot-password` |
| Notifikasi KYC | Admin approve/reject KYC | KYC service |
| Notifikasi Role | Admin ganti role user | User controller |
| Undangan | Admin undang user | Invitation controller |

---

## 9. Arsitektur

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────→│  Vercel      │────→│  CT 102     │
│   (User)    │     │  (Next.js)   │     │  (Express)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                                │ fetch()
                                                ▼
                                         ┌─────────────┐
                                         │  Resend API  │
                                         │  (Email)     │
                                         └──────┬──────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  Inbox User  │
                                         └─────────────┘
```

- **Vercel** hanya serve frontend — tidak koneksi ke Resend
- **CT 102** (backend) yang mengirim email via Resend REST API
- Resend REST API dipanggil langsung via `fetch()`, bukan SMTP

---

## Referensi

- [Resend Docs](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Pricing](https://resend.com/pricing)
