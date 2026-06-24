-- AlterTable: add multi-size IAB alt URLs and A/B testing fields to Advertisement
ALTER TABLE "Advertisement" ADD COLUMN "imageUrlTabletAlt" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "imageUrlMobileAlt" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "variantAUrl" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "variantBUrl" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "winnerVariant" TEXT;
