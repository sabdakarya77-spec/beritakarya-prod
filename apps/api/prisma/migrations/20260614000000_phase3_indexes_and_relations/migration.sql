-- Phase 3: Add missing indexes, remove redundant indexes, add FK relations

-- M26: Add composite index for Notification (userId, isRead)
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- M27: Add composite index for Comment (articleId, status)
CREATE INDEX "Comment_articleId_status_idx" ON "Comment"("articleId", "status");

-- M30: Remove redundant indexes (already covered by @unique)
DROP INDEX IF EXISTS "BlacklistedToken_token_idx";
DROP INDEX IF EXISTS "Invitation_token_idx";

-- M32: Add composite index for AdBooking (siteId, status, startDate, endDate)
CREATE INDEX "AdBooking_siteId_status_startDate_endDate_idx" ON "AdBooking"("siteId", "status", "startDate", "endDate");

-- H16: Add FK relation for KYCViewLog.viewerId
-- First, add the viewer relation name to the existing user FK
ALTER TABLE "KYCViewLog" DROP CONSTRAINT IF EXISTS "KYCViewLog_userId_fkey";
ALTER TABLE "KYCViewLog" ADD CONSTRAINT "KYCViewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add new FK for viewerId
ALTER TABLE "KYCViewLog" ADD CONSTRAINT "KYCViewLog_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
