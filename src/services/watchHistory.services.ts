import prisma from "../config/client";
import appAssert from "../utils/appAssert";
import { NOT_FOUND } from "../constants/http";

export type GetWatchHistoryParams = {
  userId: number;
  page?: number;
  limit?: number;
};

export type CreateOrUpdateWatchHistoryParams = {
  userId: number;
  videoId: number;
  progress: number;
};

export const getWatchHistory = async ({
  userId,
  page = 1,
  limit = 10,
}: GetWatchHistoryParams) => {
  const [watchHistory, total] = await prisma.$transaction([
    prisma.watchHistory.findMany({
      where: { userId },
      include: { video: true },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.watchHistory.count({ where: { userId } })
  ]);

  return {
    watchHistory,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getWatchHistoryById = async (id: number, userId: number) => {
  const watchHistory = await prisma.watchHistory.findUnique({
    where: { id },
    include: { video: true },
  });

  appAssert(watchHistory && watchHistory.userId === userId, NOT_FOUND, "Watch history entry not found");

  return watchHistory;
};

export const createOrUpdateWatchHistory = async ({
  userId,
  videoId,
  progress,
}: CreateOrUpdateWatchHistoryParams) => {
  return prisma.watchHistory.upsert({
    where: { 
      userId_videoId: { userId, videoId } 
    },
    update: { 
      progress, 
      updatedAt: new Date() 
    },
    create: { 
      userId, 
      videoId, 
      progress 
    },
  });
};

export const deleteWatchHistory = async (id: number, userId: number) => {
  const result = await prisma.watchHistory.deleteMany({
    where: { 
      id,
      userId 
    },
  });

  appAssert(result.count > 0, NOT_FOUND, "Watch history entry not found");
};

export const clearAllWatchHistory = async (userId: number) => {
  await prisma.watchHistory.deleteMany({
    where: { userId },
  });
};