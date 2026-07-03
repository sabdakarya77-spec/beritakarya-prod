-- AlterTable
ALTER TABLE "Site" ADD COLUMN "wapimredSettings" JSONB DEFAULT '{"canPublish":false,"canSchedule":false,"canForcePublish":false,"canDeletePublished":false,"canManageCategories":false,"canTransferUser":false,"canDeleteUser":false,"notifyPimredOnSubmit":true,"notifyPimredOnApprove":true}';
