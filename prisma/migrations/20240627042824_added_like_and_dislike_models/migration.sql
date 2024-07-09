-- CreateTable
CREATE TABLE "VideoLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoDislike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoDislike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoLike_userId_videoId_key" ON "VideoLike"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoDislike_userId_videoId_key" ON "VideoDislike"("userId", "videoId");

-- AddForeignKey
ALTER TABLE "VideoLike" ADD CONSTRAINT "VideoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoLike" ADD CONSTRAINT "VideoLike_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDislike" ADD CONSTRAINT "VideoDislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDislike" ADD CONSTRAINT "VideoDislike_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
