-- CreateTable
CREATE TABLE "AdEventLog" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "bookingId" TEXT,
    "siteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdEventLog_adId_createdAt_idx" ON "AdEventLog"("adId", "createdAt");

-- CreateIndex
CREATE INDEX "AdEventLog_bookingId_createdAt_idx" ON "AdEventLog"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "AdEventLog_siteId_createdAt_idx" ON "AdEventLog"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdEventLog" ADD CONSTRAINT "AdEventLog_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEventLog" ADD CONSTRAINT "AdEventLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "AdBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEventLog" ADD CONSTRAINT "AdEventLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
