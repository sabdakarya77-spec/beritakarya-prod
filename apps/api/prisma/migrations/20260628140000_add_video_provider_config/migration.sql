-- CreateTable: VideoProviderConfig (API key untuk video generation providers)
CREATE TABLE "VideoProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: provider unique
CREATE UNIQUE INDEX "VideoProviderConfig_provider_key" ON "VideoProviderConfig"("provider");
