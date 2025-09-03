-- CreateTable
CREATE TABLE "users" (
    "wallet_address" TEXT NOT NULL,
    "username" TEXT,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("wallet_address")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "author_address" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT[],
    "transaction_hash" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_address" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "transaction_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "post_id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "transaction_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("post_id","user_address")
);

-- CreateTable
CREATE TABLE "tags" (
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "post_tags" (
    "post_id" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("post_id","tag_name")
);

-- CreateTable
CREATE TABLE "follows" (
    "follower_address" TEXT NOT NULL,
    "following_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_address","following_address")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_address_fkey" FOREIGN KEY ("author_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_address_fkey" FOREIGN KEY ("author_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_address_fkey" FOREIGN KEY ("user_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_name_fkey" FOREIGN KEY ("tag_name") REFERENCES "tags"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_address_fkey" FOREIGN KEY ("follower_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_address_fkey" FOREIGN KEY ("following_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;
