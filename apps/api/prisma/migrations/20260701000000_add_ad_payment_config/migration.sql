-- CreateTable: AdPaymentConfig (Konfigurasi Pembayaran Iklan per site)
CREATE TABLE "AdPaymentConfig" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "midtransUrl" TEXT,
    "midtransClientKey" TEXT,
    "bankAccounts" JSONB DEFAULT '[]',
    "qrisImageUrl" TEXT,
    "whatsappSupport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: siteId unique (one-to-one with Site)
CREATE UNIQUE INDEX "AdPaymentConfig_siteId_key" ON "AdPaymentConfig"("siteId");

-- AddForeignKey: AdPaymentConfig → Site (CASCADE on delete)
ALTER TABLE "AdPaymentConfig" ADD CONSTRAINT "AdPaymentConfig_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
