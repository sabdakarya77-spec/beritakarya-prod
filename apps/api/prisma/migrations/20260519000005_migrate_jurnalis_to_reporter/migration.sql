-- Update existing data mapping 'jurnalis' to 'reporter'
UPDATE "User" SET "role" = 'reporter' WHERE "role"::text = 'jurnalis';
UPDATE "RoleQuota" SET "role" = 'reporter' WHERE "role"::text = 'jurnalis';
UPDATE "Invitation" SET "role" = 'reporter' WHERE "role"::text = 'jurnalis';
