-- AlterTable
ALTER TABLE "Article" ADD COLUMN "featuredImageCredit" TEXT;
ALTER TABLE "Article" ADD COLUMN "coverLayout" TEXT DEFAULT 'left-bottom'; -- left-bottom | left-top | center
