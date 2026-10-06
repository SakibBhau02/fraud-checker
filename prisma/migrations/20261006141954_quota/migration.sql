-- AlterTable
ALTER TABLE "CheckHistory" ADD COLUMN     "quotaKey" TEXT;

-- CreateIndex
CREATE INDEX "CheckHistory_quotaKey_createdAt_idx" ON "CheckHistory"("quotaKey", "createdAt");
