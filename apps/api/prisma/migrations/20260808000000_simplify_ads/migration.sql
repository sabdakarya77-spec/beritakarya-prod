-- Simplifikasi Iklan Mandiri (SIMPLIFIKASI-IKLAN.md)
-- Hapus model AdPackage, AdBooking, VideoPrompt, VideoProviderConfig, AdPaymentConfig
-- Sederhanakan model Advertisement (drop kolom script/AB/variant/booking)
-- Sederhanakan model AdEventLog (drop kolom bookingId + relasi)

-- 1. Hapus relasi FK lama ke AdBooking dan AdPackage terlebih dahulu
ALTER TABLE "Advertisement" DROP CONSTRAINT IF EXISTS "Advertisement_bookingId_fkey";
ALTER TABLE "AdEventLog" DROP CONSTRAINT IF EXISTS "AdEventLog_bookingId_fkey";
ALTER TABLE "VideoPrompt" DROP CONSTRAINT IF EXISTS "VideoPrompt_bookingId_fkey";
ALTER TABLE "AdBooking" DROP CONSTRAINT IF EXISTS "AdBooking_packageId_fkey";
ALTER TABLE "AdBooking" DROP CONSTRAINT IF EXISTS "AdBooking_siteId_fkey";
ALTER TABLE "AdBooking" DROP CONSTRAINT IF EXISTS "AdBooking_userId_fkey";

-- 2. Hapus tabel yang tidak lagi digunakan (dengan CASCADE untuk menjamin keamanan FK)
DROP TABLE IF EXISTS "VideoPrompt" CASCADE;
DROP TABLE IF EXISTS "VideoProviderConfig" CASCADE;
DROP TABLE IF EXISTS "AdPaymentConfig" CASCADE;
DROP TABLE IF EXISTS "AdBooking" CASCADE;
DROP TABLE IF EXISTS "AdPackage" CASCADE;

-- 3. Sederhanakan Advertisement: drop kolom yang tidak dipakai
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

-- 4. Sederhanakan AdEventLog: drop kolom bookingId
ALTER TABLE "AdEventLog"
  DROP COLUMN IF EXISTS "bookingId";

-- 5. Hapus index yang merujuk kolom yang dihapus
DROP INDEX IF EXISTS "Advertisement_bookingId_idx";
DROP INDEX IF EXISTS "AdEventLog_bookingIdCreatedAt_idx";

-- 6. Hapus enum yang tidak lagi dipakai (PaymentStatus, AdStatus)
--    Catatan: hanya dihapus jika tidak ada kolom lain yang memakai enum ini
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "AdStatus";