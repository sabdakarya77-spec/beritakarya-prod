-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFYING', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "AdPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentProof" TEXT,
    "status" "AdStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionNotes" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdBooking_userId_idx" ON "AdBooking"("userId");

-- CreateIndex
CREATE INDEX "AdBooking_siteId_idx" ON "AdBooking"("siteId");

-- CreateIndex
CREATE INDEX "AdBooking_packageId_idx" ON "AdBooking"("packageId");

-- CreateIndex
CREATE INDEX "AdBooking_status_idx" ON "AdBooking"("status");

-- AddForeignKey
ALTER TABLE "AdBooking" ADD CONSTRAINT "AdBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBooking" ADD CONSTRAINT "AdBooking_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBooking" ADD CONSTRAINT "AdBooking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "AdPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
