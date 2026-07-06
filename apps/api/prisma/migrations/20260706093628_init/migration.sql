-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('ACTIVE', 'MUTED', 'BANNED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'QUEUED', 'PLAYED', 'VETOED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('GENERAL', 'TABLE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'FLAGGED');

-- CreateTable
CREATE TABLE "venues" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spotify_connections" (
    "venue_id" UUID NOT NULL,
    "refresh_token_enc" TEXT NOT NULL,
    "spotify_user_id" TEXT NOT NULL,
    "active_device_id" TEXT,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotify_connections_pkey" PRIMARY KEY ("venue_id")
);

-- CreateTable
CREATE TABLE "venue_sessions" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "venue_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_qrs" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "table_no" INTEGER NOT NULL,
    "qr_token" TEXT NOT NULL,

    CONSTRAINT "table_qrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "nickname" TEXT NOT NULL,
    "device_hash" TEXT NOT NULL,
    "table_no" INTEGER,
    "status" "GuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_requests" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "spotify_track_uri" TEXT NOT NULL,
    "track_name" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_art_url" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "final_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queued_at" TIMESTAMP(3),

    CONSTRAINT "track_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "value" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" "RoomType" NOT NULL,
    "table_no" INTEGER,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");

-- CreateIndex
CREATE INDEX "venue_sessions_venue_id_status_idx" ON "venue_sessions"("venue_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "table_qrs_qr_token_key" ON "table_qrs"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "table_qrs_venue_id_table_no_key" ON "table_qrs"("venue_id", "table_no");

-- CreateIndex
CREATE UNIQUE INDEX "guests_session_id_device_hash_key" ON "guests"("session_id", "device_hash");

-- CreateIndex
CREATE INDEX "track_requests_session_id_status_idx" ON "track_requests"("session_id", "status");

-- CreateIndex
CREATE INDEX "track_requests_session_id_spotify_track_uri_created_at_idx" ON "track_requests"("session_id", "spotify_track_uri", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "votes_request_id_guest_id_key" ON "votes"("request_id", "guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_session_id_type_table_no_key" ON "chat_rooms"("session_id", "type", "table_no");

-- CreateIndex
CREATE INDEX "messages_room_id_created_at_idx" ON "messages"("room_id", "created_at");

-- AddForeignKey
ALTER TABLE "spotify_connections" ADD CONSTRAINT "spotify_connections_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_sessions" ADD CONSTRAINT "venue_sessions_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_qrs" ADD CONSTRAINT "table_qrs_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "venue_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_requests" ADD CONSTRAINT "track_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "venue_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_requests" ADD CONSTRAINT "track_requests_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "track_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "venue_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
