-- AlterTable
ALTER TABLE "Site" ADD COLUMN "kaperwilSettings" JSONB DEFAULT '{"canPublish":false,"canSchedule":false,"canForcePublish":false,"canDeletePublished":false,"canManageCategories":false,"canTransferUser":false,"canDeleteUser":false,"notifyPimredOnSubmit":true,"notifyPimredOnApprove":true}';

ALTER TABLE "Site" ADD COLUMN "kabiroSettings" JSONB DEFAULT '{"canPublish":false,"canSchedule":false,"canForcePublish":false,"canDeletePublished":false,"canManageCategories":false,"canTransferUser":false,"canDeleteUser":false,"notifyPimredOnSubmit":true,"notifyPimredOnApprove":true}';
