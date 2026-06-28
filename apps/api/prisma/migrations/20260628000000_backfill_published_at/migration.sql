-- Backfill publishedAt untuk artikel published yang masih NULL.
-- Menggunakan createdAt sebagai tanggal referensi karena artikel tersebut
-- memang sudah terbit sejak createdAt (hanya publishedAt yang tidak di-set).

UPDATE "Article"
SET "publishedAt" = "createdAt"
WHERE "status" = 'published'
  AND "publishedAt" IS NULL;
