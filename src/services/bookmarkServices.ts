import { BookmarkStatus } from "@prisma/client";
import prisma from "../config/client";

export const getBookmarksService = async (
  userId: number,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      video: {
        include: {
          channel: {
            select: { id: true, name: true, channelProfileImage: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    skip,
  });

  // const total = bookmarks.length;
  const total = await prisma.bookmark.count({
    where: { userId },
  });
  const totalPages = Math.ceil(total / limit);

  return {
    bookmarks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getBookmarkByIdService = async (bookmarkId: number) => {
  return prisma.bookmark.findUnique({
    where: { id: bookmarkId },
    include: { video: true },
  });
};

export const updateBookmarkStatusService = async (
  bookmarkId: number,
  status: BookmarkStatus
) => {
  return prisma.bookmark.update({
    where: { id: bookmarkId },
    data: { status },
  });
};

export const getVideoBookmarksService = async (
  videoId: number,
  userId: number
) => {
  return prisma.bookmark.findMany({
    where: {
      videoId,
      userId,
    },
    include: { video: true },
  });
};
