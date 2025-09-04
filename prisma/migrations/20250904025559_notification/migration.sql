-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'LIKE', 'COMMENT', 'MESSAGE');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "sender_address" TEXT,
    "post_id" TEXT,
    "comment_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "text" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipient_address_idx" ON "notifications"("recipient_address");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
