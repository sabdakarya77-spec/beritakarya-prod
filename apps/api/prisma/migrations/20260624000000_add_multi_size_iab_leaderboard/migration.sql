-- Multi-Size IAB for Leaderboard: add tablet & mobile image variants
-- IAB Standard: 970×250 (desktop), 728×90 (tablet), 320×50 (mobile)

-- AlterTable: Advertisement
ALTER TABLE "Advertisement" ADD COLUMN "imageUrlTablet" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "imageUrlMobile" TEXT;

-- AlterTable: AdBooking
ALTER TABLE "AdBooking" ADD COLUMN "imageUrlTablet" TEXT;
ALTER TABLE "AdBooking" ADD COLUMN "imageUrlMobile" TEXT;
