/*
  Warnings:

  - Added the required column `pollId` to the `PollVote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PollVote" ADD COLUMN     "pollId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
