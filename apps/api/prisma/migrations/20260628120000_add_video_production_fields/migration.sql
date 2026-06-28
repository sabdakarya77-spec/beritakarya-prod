-- AlterTable: Tambah logoUrl dan fotoUrl ke AdBooking (khusus HOME_TOP creative service)
ALTER TABLE "AdBooking" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "AdBooking" ADD COLUMN "fotoUrl" TEXT;

-- CreateTable: VideoPrompt (Prompt Library untuk produksi video)
CREATE TABLE "VideoPrompt" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT,
    "rating" INTEGER,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoPrompt_bookingId_idx" ON "VideoPrompt"("bookingId");

-- CreateIndex
CREATE INDEX "VideoPrompt_category_idx" ON "VideoPrompt"("category");

-- CreateIndex
CREATE INDEX "VideoPrompt_createdAt_idx" ON "VideoPrompt"("createdAt");

-- AddForeignKey
ALTER TABLE "VideoPrompt" ADD CONSTRAINT "VideoPrompt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "AdBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
