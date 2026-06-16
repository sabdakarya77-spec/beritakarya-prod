-- AlterTable: Add bookingId column to Advertisement
ALTER TABLE "Advertisement" ADD COLUMN "bookingId" TEXT;

-- CreateIndex
CREATE INDEX "Advertisement_bookingId_idx" ON "Advertisement"("bookingId");

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "AdBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
