-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "channelId" INTEGER;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
