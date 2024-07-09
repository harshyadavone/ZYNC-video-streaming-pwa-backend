/*
  Warnings:

  - Added the required column `userId` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_videoId_fkey";

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "videoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
