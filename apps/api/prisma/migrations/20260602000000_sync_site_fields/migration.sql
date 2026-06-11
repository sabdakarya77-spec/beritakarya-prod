-- AlterTable
ALTER TABLE "Site" ADD COLUMN "faviconUrl" TEXT,
ADD COLUMN "ogImageUrl" TEXT,
ADD COLUMN "privacyPolicy" TEXT,
ADD COLUMN "termsOfService" TEXT,
ADD COLUMN "mediaSiber" TEXT,
ADD COLUMN "googleIndexingConfig" JSONB DEFAULT '{}';
