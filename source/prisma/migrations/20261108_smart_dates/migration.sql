-- Additive Smart Date upgrade. Preserve existing event/expiry dates and all posts.
CREATE TYPE "ArchivePolicy" AS ENUM ('AUTO', 'CUSTOM', 'NEVER');
ALTER TABLE "ContentItem"
  ADD COLUMN "deadlineAt" TIMESTAMP(3),
  ADD COLUMN "deadlineLabel" TEXT,
  ADD COLUMN "eventLabel" TEXT,
  ADD COLUMN "archivePolicy" "ArchivePolicy" NOT NULL DEFAULT 'CUSTOM';
-- Old posts have no explicit deadline; keep their existing archive behavior, never reinterpret expiry as application deadline.
UPDATE "ContentItem" SET "archivePolicy" = 'NEVER' WHERE "expiresAt" IS NULL;
CREATE INDEX "ContentItem_deadlineAt_idx" ON "ContentItem"("deadlineAt");
