/*
  Warnings:

  - A unique constraint covering the columns `[userId,videoId]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_videoId_key" ON "Bookmark"("userId", "videoId");
