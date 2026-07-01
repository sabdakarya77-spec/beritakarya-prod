# Audit Advertiser Dashboard — Verifikasi Codebase

> Tanggal verifikasi: 2026-07-01  
> Status: ✅ Terverifikasi langsung dari kode

---

## RINGKASAN: Mana yang BENAR, SEBAGIAN BENAR, dan SALAH

| # | Temuan Dokumen | Status Verifikasi | Catatan |
|---|---|---|---|
| 1 | Midtrans Sandbox hardcoded | ✅ BENAR | Line 61: `https://app.sandbox.midtrans.com/snap/snap.js` hardcoded |
| 2 | HOME_TOP Logo Upload Broken | ✅ BENAR | Line 250: `bookingPayload.logoUrl = null; // TODO: upload logo terpisah` |
| 3 | QRIS Placeholder | ✅ BENAR | Line 199–203: hanya render `<QrCode>` icon, tidak ada QR image nyata |
| 4 | History Page Raw Status | ⚠️ SEBAGIAN BENAR | Badge sudah berwarna tapi masih render `{b.status}` mentah (bukan label Indonesia) |
| 5 | Tidak Ada Cancel Booking | ✅ BENAR | Grep: tidak ada route `/cancel` di ad.controller.ts |
| 6 | Tidak Ada Edit Kreatif | ✅ BENAR | Grep: tidak ada route `/creative` PATCH di ad.controller.ts |
| 7 | Tidak Ada Invoice/Receipt PDF | ✅ BENAR | Tidak ada endpoint generate PDF di seluruh controller |
| 8 | Upgrade Advertiser Tanpa Approval | ✅ BENAR | Line 169–171: langsung `data: { role: 'advertiser' }` tanpa approval |
| 9 | Link Bantuan Nomor Palsu | ✅ BENAR | Line 318 & 487: `https://wa.me/628123456789` di dua tempat (desktop + mobile) |
| 10 | Sidebar Collapse Inconsistency | ✅ BENAR | Line 56: default `true` (collapsed). Sub-menu hanya muncul saat `!isSidebarCollapsed` |
| 11 | Stats Hanya ACTIVE Booking | ✅ BENAR | Line 45: `activeBookings = bookings.filter(b => b.status === 'ACTIVE')` |
| 12 | Duplikasi Admin/Advertiser Pages | ✅ BENAR | Dua path berbeda ada di filesystem |

---

## Detail Temuan yang BENAR

### 🔴 #1 — Midtrans Sandbox Hardcoded
**File**: [`bookings/page.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/bookings/page.tsx#L61)
```typescript
// Line 61 — HARDCODED
script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
```
Tidak ada conditional berdasarkan `NODE_ENV`. Selalu sandbox.

---

### 🔴 #2 — HOME_TOP Logo Upload Broken
**File**: [`StudioContext.tsx`](file:///d:/beritakarya-v.0.1/apps/web/components/dashboard/ads/studio/StudioContext.tsx#L250)
```typescript
// Line 250
bookingPayload.logoUrl = null; // TODO: upload logo terpisah
bookingPayload.fotoUrl = v.desktop?.url || null;
```
State `initialData` hanya punya satu field `adFile`. Tidak ada `logoFile` terpisah.

---

### 🟡 #3 — QRIS Placeholder
**File**: [`bookings/page.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/bookings/page.tsx#L199)
```tsx
// Line 199–203 — Hanya ikon, bukan QR image
<div className="w-full aspect-square ...">
  <QrCode size={64} className="text-gray-300 mx-auto mb-2" />
  <p>Scan untuk membayar</p>
</div>
```

---

### ⚠️ #4 — History Page Status — SEBAGIAN BENAR
**File**: [`history/page.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/history/page.tsx#L104)

Badge sudah punya warna (amber/green/red) **tapi teks masih raw**:
```tsx
// Line 110 — render raw enum string
<span className={cn(...)}>{b.status}</span>  // "PENDING_REVIEW", bukan "Menunggu Review"
// Line 119
<span className={cn(...)}>{b.paymentStatus}</span>  // "VERIFYING", bukan "Menunggu Verifikasi"
```
Kolom `COMPLETED` juga tidak punya warna (fallback gray).

---

### 🟡 #5 — Tidak Ada Cancel Booking
Grep di `ad.controller.ts` → **0 hasil** untuk route `/cancel`.
Tidak ada endpoint `POST /ads/bookings/:id/cancel`.

---

### 🟡 #6 — Tidak Ada Edit Kreatif
Grep di `ad.controller.ts` → **0 hasil** untuk route `/creative` PATCH.
Tidak ada endpoint `PATCH /ads/bookings/:id/creative`.

---

### 🟡 #8 — Upgrade Advertiser Tanpa Approval
**File**: [`auth.controller.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/auth/auth.controller.ts#L158)
```typescript
// Line 169–171 — Langsung update role tanpa approval
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { role: 'advertiser' },  // Langsung, tanpa review
})
```

---

### 🟡 #9 — Link Bantuan Nomor Palsu
**File**: [`layout.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/layout.tsx#L318)
- Line 318: desktop sidebar
- Line 487: mobile menu overlay
Keduanya pakai `https://wa.me/628123456789`.

---

### 🟢 #10 — Sidebar Collapse Default True
**File**: [`layout.tsx`](file:///d:/beritakarya-v.0.1/apps/web/app/[site]/ads/layout.tsx#L56)
```typescript
// Line 56: default collapsed = true
return saved !== null ? saved === 'true' : true
```
Sub-menu "Iklan Saya" hanya render saat `!isSidebarCollapsed && isExpanded` (line 230).

---

### 🟢 #11 — Stats Hanya ACTIVE
**File**: [`AdvertiserAdsView.tsx`](file:///d:/beritakarya-v.0.1/apps/web/components/dashboard/ads/AdvertiserAdsView.tsx#L45)
```typescript
// Line 45
const activeBookings = bookings.filter(b => b.status === 'ACTIVE');

// Line 49: hanya fetch stats untuk active bookings
if (activeBookings.length === 0) return;
```
Booking `COMPLETED` tidak di-fetch stats-nya.

---

## Temuan Tambahan (Tidak ada di Dokumen)

### ⚠️ BARU — `bookings/pay` Hanya Accept `PENDING`
**File**: [`ad.controller.ts`](file:///d:/beritakarya-v.0.1/apps/api/src/modules/ad/ad.controller.ts#L409)
```typescript
// Line 409
if (existing.paymentStatus !== 'PENDING') {
  return res.status(400).json({ ... 'Bukti bayar sudah diupload atau booking sudah diproses' })
}
```
Frontend menampilkan tombol upload untuk status `REJECTED` juga (line 280 bookings/page.tsx), tapi backend **menolak** request jika bukan `PENDING`. Ini bug mismatch FE ↔ BE.

---

## Prioritas Perbaikan (Final)

### 🔴 HIGH (Fix sekarang)
1. **Midtrans sandbox URL** → gunakan env var
2. **HOME_TOP logoUrl = null** → pisahkan state & upload logo
3. **FE/BE mismatch `pay` endpoint** → BE perlu accept `REJECTED` juga (atau FE hapus tombol untuk REJECTED)

### 🟡 MEDIUM
4. **QRIS placeholder** → tampilkan QR image statis atau dari env
5. **History status raw string** → tambah label Indonesia
6. **Cancel booking endpoint** → backend + frontend
7. **Nomor WA palsu** → ganti dengan nomor nyata dari config
8. **Upgrade tanpa approval** → tambah flow review

### 🟢 LOW
9. **Sidebar default expanded** → ubah default ke `false` (collapsed)
10. **Stats include COMPLETED** → ubah filter di AdvertiserAdsView
11. **Edit kreatif post-submit** → endpoint baru
12. **Invoice PDF** → generate di backend
