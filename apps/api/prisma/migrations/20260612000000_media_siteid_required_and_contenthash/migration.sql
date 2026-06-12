-- MASALAH 1 (KRITIS): Media siteId wajib
-- Semua Media yang siteId NULL di-assign ke 'pusat' sebagai fallback
-- Kemudian alter column siteId menjadi NOT NULL

-- Step 1: Assign media tanpa site ke 'pusat'
UPDATE "Media" SET "siteId" = 'pusat' WHERE "siteId" IS NULL;

-- Step 2: Alter siteId column to NOT NULL
ALTER TABLE "Media" ALTER COLUMN "siteId" SET NOT NULL;

-- MASALAH 4: Media deduplikasi via contentHash
-- Step 3: Tambah kolom content_hash
ALTER TABLE "Media" ADD COLUMN "content_hash" TEXT;

-- Step 4: Tambah composite index untuk deduplikasi per-site
CREATE INDEX "Media_siteId_content_hash_idx" ON "Media"("siteId", "content_hash");