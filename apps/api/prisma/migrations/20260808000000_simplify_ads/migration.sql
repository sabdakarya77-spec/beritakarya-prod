-- Simplifikasi Iklan Mandiri (SIMPLIFIKASI-IKLAN.md)
-- Hapus model AdPackage, AdBooking, VideoPrompt, VideoProviderConfig, AdPaymentConfig
-- Sederhanakan model Advertisement (drop kolom script/AB/variant/booking)
-- Sederhanakan model AdEventLog (drop kolom bookingId + relasi)

-- 1. Hapus tabel dependen terlebih dahulu (sesuai urutan relasi FK)
DROP TABLE IF EXISTS "VideoPrompt";
DROP TABLE IF EXISTS "VideoProviderConfig";
DROP TABLE IF EXISTS "AdPaymentConfig";
DROP TABLE IF EXISTS "AdBooking";
DROP TABLE IF EXISTS "AdPackage";

-- 2. Hapus relasi FK lama di Advertisement ke AdBooking
ALTER TABLE "Advertisement" DROP CONSTRAINT IF EXISTS "Advertisement_bookingId_fkey";

-- 3. Hapus relasi FK lama di AdEventLog ke AdBooking
ALTER TABLE "AdEventLog" DROP CONSTRAINT IF EXISTS "AdEventLog_bookingId_fkey";

-- 4. Sederhanakan Advertisement: drop kolom yang tidak dipakai
ALTER TABLE "Advertisement"
  DROP COLUMN IF EXISTS "code",
  DROP COLUMN IF EXISTS "imageUrlTablet",
  DROP COLUMN IF EXISTS "imageUrlMobile",
  DROP COLUMN IF EXISTS "imageUrlTabletAlt",
  DROP COLUMN IF EXISTS "imageUrlMobileAlt",
  DROP COLUMN IF EXISTS "variantAUrl",
  DROP COLUMN IF EXISTS "variantBUrl",
  DROP COLUMN IF EXISTS "winnerVariant",
  DROP COLUMN IF EXISTS "animationEffect",
  DROP COLUMN IF EXISTS "bookingId";

-- 5. Sederhanakan AdEventLog: drop kolom bookingId
ALTER TABLE "AdEventLog"
  DROP COLUMN IF EXISTS "bookingId";

-- 6. Hapus index yang merujuk kolom yang dihapus
DROP INDEX IF EXISTS "Advertisement_bookingId_idx";
DROP INDEX IF EXISTS "AdEventLog_bookingIdCreatedAt_idx";

-- 7. Hapus enum yang tidak lagi dipakai (PaymentStatus, AdStatus)
--    Catatan: hanya dihapus jika tidak ada kolom lain yang memakai enum ini
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "AdStatus";