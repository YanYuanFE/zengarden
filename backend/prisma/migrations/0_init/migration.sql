-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('in_progress', 'completed', 'interrupted');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'generating', 'uploading', 'minting', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "total_focus_minutes" INTEGER NOT NULL DEFAULT 0,
    "total_flowers" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_focus_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "status" "FocusStatus" NOT NULL DEFAULT 'in_progress',
    "interrupted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flowers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "prompt" TEXT,
    "image_url" TEXT,
    "metadata_url" TEXT,
    "token_id" TEXT,
    "tx_hash" TEXT,
    "minted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flowers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flower_tasks" (
    "id" TEXT NOT NULL,
    "flower_id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "flower_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "flower_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "users"("address");

-- CreateIndex
CREATE INDEX "focus_sessions_user_id_status_idx" ON "focus_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "focus_sessions_user_id_started_at_idx" ON "focus_sessions"("user_id", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "flowers_session_id_key" ON "flowers"("session_id");

-- CreateIndex
CREATE INDEX "flowers_user_id_created_at_idx" ON "flowers"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "flowers_created_at_idx" ON "flowers"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "flower_tasks_flower_id_key" ON "flower_tasks"("flower_id");

-- CreateIndex
CREATE INDEX "flower_tasks_status_idx" ON "flower_tasks"("status");

-- CreateIndex
CREATE INDEX "likes_flower_id_idx" ON "likes"("flower_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_flower_id_key" ON "likes"("user_id", "flower_id");

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flowers" ADD CONSTRAINT "flowers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flowers" ADD CONSTRAINT "flowers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "focus_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_tasks" ADD CONSTRAINT "flower_tasks_flower_id_fkey" FOREIGN KEY ("flower_id") REFERENCES "flowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_flower_id_fkey" FOREIGN KEY ("flower_id") REFERENCES "flowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
