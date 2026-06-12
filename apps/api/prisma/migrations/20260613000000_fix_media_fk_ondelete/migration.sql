-- Fix Media FK: siteId is NOT NULL but FK was ON DELETE SET NULL (contradiction)
-- Drop old constraint and recreate with ON DELETE RESTRICT

ALTER TABLE "Media" DROP CONSTRAINT "Media_siteId_fkey";
ALTER TABLE "Media" ADD CONSTRAINT "Media_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
