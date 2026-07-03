-- AlterTable
ALTER TABLE "Site" ADD COLUMN "wapimredSettings" JSONB DEFAULT '{"canPublish":false,"canSchedule":false,"canForcePublish":false,"canDeletePublished":false}';
