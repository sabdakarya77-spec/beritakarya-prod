-- AlterTable: Add Google Analytics gtag.js Measurement ID (public tracking script)
-- Berbeda dari ga4PropertyId yang dipakai untuk GA4 Data API (laporan di dashboard)
ALTER TABLE "Site" ADD COLUMN "gaMeasurementId" TEXT;