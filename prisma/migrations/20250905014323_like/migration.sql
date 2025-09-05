-- CreateTable
CREATE TABLE "collects" (
    "post_id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "transaction_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collects_pkey" PRIMARY KEY ("post_id","user_address")
);

-- CreateTable
CREATE TABLE "friends" (
    "user_address" TEXT NOT NULL,
    "friend_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("user_address","friend_address")
);

-- AddForeignKey
ALTER TABLE "collects" ADD CONSTRAINT "collects_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collects" ADD CONSTRAINT "collects_user_address_fkey" FOREIGN KEY ("user_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_address_fkey" FOREIGN KEY ("user_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_friend_address_fkey" FOREIGN KEY ("friend_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;
