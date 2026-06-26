-- AlterTable
ALTER TABLE "AdBooking" ADD COLUMN "snapToken" TEXT;
ALTER TABLE "AdBooking" ADD COLUMN "externalOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdBooking_externalOrderId_key" ON "AdBooking"("externalOrderId");
