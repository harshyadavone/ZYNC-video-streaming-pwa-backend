/*
  Warnings:

  - You are about to drop the column `categoryId` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the `VideoCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('EDUCATION', 'ENTERTAINMENT', 'MUSIC', 'NEWS', 'TECHNOLOGY');

-- DropForeignKey
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_categoryId_fkey";

-- DropIndex
DROP INDEX "UserInterest_userId_categoryId_key";

-- AlterTable
ALTER TABLE "UserInterest" DROP COLUMN "categoryId";

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "categoryId",
ADD COLUMN     "category" "ContentCategory" NOT NULL;

-- DropTable
DROP TABLE "VideoCategory";
