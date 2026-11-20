-- Additive cover selection: existing items keep first-image fallback.
ALTER TABLE "ContentItem" ADD COLUMN "coverAttachmentId" TEXT;
