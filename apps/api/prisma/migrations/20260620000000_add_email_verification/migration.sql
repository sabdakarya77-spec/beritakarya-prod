-- AlterTable: Add email verification field to User
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- IMPORTANT: Set all existing users as verified (they registered before this feature)
-- Run this AFTER deploying the code change:
-- UPDATE "User" SET "emailVerifiedAt" = NOW() WHERE "emailVerifiedAt" IS NULL;
