-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('article', 'photo_journalism', 'video_exclusive');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "content_type" "ContentType" NOT NULL DEFAULT 'article';
