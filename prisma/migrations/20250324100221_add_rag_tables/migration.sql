-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "actor_address" TEXT NOT NULL,
    "post_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_settings" (
    "id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "twitter_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_files" (
    "id" TEXT NOT NULL,
    "rag_settings_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_address_idx" ON "notifications"("user_address");

-- CreateIndex
CREATE INDEX "notifications_actor_address_idx" ON "notifications"("actor_address");

-- CreateIndex
CREATE INDEX "notifications_post_id_idx" ON "notifications"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "rag_settings_user_address_key" ON "rag_settings"("user_address");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_address_fkey" FOREIGN KEY ("user_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_settings" ADD CONSTRAINT "rag_settings_user_address_fkey" FOREIGN KEY ("user_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_files" ADD CONSTRAINT "rag_files_rag_settings_id_fkey" FOREIGN KEY ("rag_settings_id") REFERENCES "rag_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
