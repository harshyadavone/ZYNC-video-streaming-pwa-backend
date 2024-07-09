/*
  Warnings:

  - A unique constraint covering the columns `[userId,videoId]` on the table `WatchHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WatchHistory" ALTER COLUMN "progress" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "WatchHistory_userId_videoId_key" ON "WatchHistory"("userId", "videoId");
