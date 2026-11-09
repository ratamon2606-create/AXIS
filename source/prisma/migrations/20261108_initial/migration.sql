-- CreateEnum
CREATE TYPE "Role" AS ENUM ('READER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('CPE', 'SKE');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('ALL', 'CPE', 'SKE', 'CPE_SKE');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('NEWS', 'OPPORTUNITY', 'ACTIVITY', 'ALERT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'KU_ONLY');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAST', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'PUBLISH', 'MARK_PAST', 'EXTEND', 'HIDE', 'ROLE_CHANGE', 'ATTACH', 'DETACH', 'PIN', 'UNPIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'READER',
    "program" "Program",
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allowlist" (
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "note" TEXT,

    CONSTRAINT "Allowlist_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'NEWS',
    "audience" "Audience" NOT NULL DEFAULT 'ALL',
    "targetYear" INTEGER,
    "visibility" "Visibility" NOT NULL DEFAULT 'KU_ONLY',
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "details" JSONB,
    "publishedAt" TIMESTAMP(3),
    "eventStart" TIMESTAMP(3),
    "eventEnd" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "location" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("userId","itemId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "itemId" TEXT,
    "action" "AuditAction" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ContentItem_status_visibility_idx" ON "ContentItem"("status", "visibility");

-- CreateIndex
CREATE INDEX "ContentItem_parentId_idx" ON "ContentItem"("parentId");

-- CreateIndex
CREATE INDEX "ContentItem_audience_idx" ON "ContentItem"("audience");

-- CreateIndex
CREATE INDEX "ContentItem_targetYear_idx" ON "ContentItem"("targetYear");

-- CreateIndex
CREATE INDEX "ContentItem_eventStart_idx" ON "ContentItem"("eventStart");

-- CreateIndex
CREATE INDEX "ContentItem_expiresAt_idx" ON "ContentItem"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storageKey_key" ON "Attachment"("storageKey");

-- CreateIndex
CREATE INDEX "Attachment_itemId_idx" ON "Attachment"("itemId");

-- CreateIndex
CREATE INDEX "SavedItem_itemId_idx" ON "SavedItem"("itemId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_itemId_idx" ON "AuditLog"("itemId");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
