import prisma from "../config/client";

export const incrementCommentCount = async (videoId: number) => {
    return prisma.video.update({
      where: { id: videoId },
      data: { commentsCount: { increment: 1 } },
    });
  };