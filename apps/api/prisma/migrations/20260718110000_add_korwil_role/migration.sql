-- Add korwil enum value to Role type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'korwil') THEN
        ALTER TYPE "Role" ADD VALUE 'korwil';
    END IF;
END
$$;

-- Add korwilSettings column to Site table
ALTER TABLE "Site" ADD COLUMN "korwilSettings" JSONB DEFAULT '{"canPublish":false,"canSchedule":false,"canForcePublish":false,"canDeletePublished":false,"canManageCategories":false,"canTransferUser":false,"canDeleteUser":false,"notifyPimredOnSubmit":true,"notifyPimredOnApprove":true}';