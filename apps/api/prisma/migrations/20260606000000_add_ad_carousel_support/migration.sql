-- DropIndex
DROP INDEX "Advertisement_siteId_slot_key";

-- AlterTable: add order and updatedAt columns
ALTER TABLE "Advertisement" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Advertisement" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: non-unique index for fast lookups
CREATE INDEX "Advertisement_siteId_slot_idx" ON "Advertisement"("siteId", "slot");
