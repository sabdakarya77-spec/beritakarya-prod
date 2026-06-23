-- AlterTable: Add GA4 and GSC config fields to Site model
ALTER TABLE "Site" ADD COLUMN "ga4PropertyId" TEXT;
ALTER TABLE "Site" ADD COLUMN "gscSiteUrl" TEXT;
