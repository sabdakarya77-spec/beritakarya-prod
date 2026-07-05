-- Fix HomepageConfig: tambah kolom yang missing di production
-- Kolom ini seharusnya sudah ada dari migration 20260705000000_add_homepage_config
-- tapi mungkin tidak ter-apply karena table sudah ada sebelumnya (manual/different migration)

ALTER TABLE "HomepageConfig" ADD COLUMN IF NOT EXISTS "sectionOrder" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "HomepageConfig" ADD COLUMN IF NOT EXISTS "sectionVisibility" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "HomepageConfig" ADD COLUMN IF NOT EXISTS "interstitials" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "HomepageConfig" ADD COLUMN IF NOT EXISTS "feedColumns" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "HomepageConfig" ADD COLUMN IF NOT EXISTS "showExcerpt" BOOLEAN NOT NULL DEFAULT true;
