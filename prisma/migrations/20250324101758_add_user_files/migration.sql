/*
  Warnings:

  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rag_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rag_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_post_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_address_fkey";

-- DropForeignKey
ALTER TABLE "rag_files" DROP CONSTRAINT "rag_files_rag_settings_id_fkey";

-- DropForeignKey
ALTER TABLE "rag_settings" DROP CONSTRAINT "rag_settings_user_address_fkey";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "rag_files";

-- DropTable
DROP TABLE "rag_settings";

-- CreateTable
CREATE TABLE "user_files" (
    "id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_user_address_fkey" FOREIGN KEY ("user_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;
