/*
  Warnings:

  - You are about to drop the column `category` on the `Video` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoUrl` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "videoUrl" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ContentCategory";

-- CreateTable
CREATE TABLE "ViewedVideo" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "VideoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "interestLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViewedVideo_userId_videoId_key" ON "ViewedVideo"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCategory_name_key" ON "VideoCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_userId_categoryId_key" ON "UserInterest"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VideoCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedVideo" ADD CONSTRAINT "ViewedVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedVideo" ADD CONSTRAINT "ViewedVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VideoCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
