// uploadVideoService

import { ContentCategory, Poll, Prisma, Privacy, Video } from "@prisma/client";
import prisma from "../config/client";
import { debounce } from "lodash";

type UploadVideo = {
  id: number;
  title: string;
  description?: string;
  thumbnail: string;
  video: string;
  tags: string[];
  ownerId: number;
  videoDuration?: number;
  category: ContentCategory;
  privacy: Privacy;
};

export const uploadVideoService = async ({
  id,
  title,
  description,
  thumbnail,
  tags,
  ownerId,
  video,
  videoDuration,
  category,
  privacy,
}: UploadVideo) => {
  const channel = await prisma.video.create({
    data: {
      title,
      privacy,
      description,
      thumbnail,
      tags,
      category,
      videoUrl: video,
      ownerId: ownerId,
      channelId: id,
      duration: videoDuration,
    },
  });

  return channel;
};

type Params = {
  page: number;
  limit: number;
};

type GetVideosResponse = {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getVideosService = async ({
  page,
  limit,
  sortOrder = "oldest",
}: Params & {
  sortOrder?: "oldest" | "newest";
}): Promise<GetVideosResponse> => {
  const skip = (page - 1) * limit;

  const videos = await prisma.video.findMany({
    where: {
      privacy: { not: "PRIVATE" },
    },
    skip,
    take: limit,
    orderBy: [
      {
        createdAt: sortOrder === "oldest" ? "asc" : "desc",
      },
    ],
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          channelProfileImage: true,
        },
      },
    },
  });

  const total = await prisma.video.count({
    where: {
      privacy: { not: "PRIVATE" },
    },
  });

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

type PrivateVideoParams = {
  userId: number;
  page: number;
  limit: number;
};

type GetPrivateVideosResponse = {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getPrivateVideosService = async ({
  userId,
  page,
  limit,
  sortOrder = "oldest",
}: PrivateVideoParams & {
  sortOrder?: "oldest" | "newest";
}): Promise<GetPrivateVideosResponse> => {
  const skip = (page - 1) * limit;

  const videos = await prisma.video.findMany({
    where: {
      ownerId: { equals: userId },
      privacy: "PRIVATE",
    },
    skip,
    take: limit,
    orderBy: [
      {
        createdAt: sortOrder === "oldest" ? "asc" : "desc",
      },
    ],
  });

  const total = await prisma.video.count({
    where: {
      ownerId: { equals: userId },
      privacy: "PRIVATE",
    },
  });

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

type UpdateVideo = {
  id?: number;
  title?: string;
  description?: string;
  thumbnail?: string;
  video?: string;
  tags?: string[];
  videoDuration?: number;
  category?: ContentCategory;
  privacy?: Privacy;
};

export const updateVideoService = async ({
  id,
  title,
  description,
  thumbnail,
  tags,
  video,
  videoDuration,
  category,
  privacy,
}: UpdateVideo) => {
  const channel = await prisma.video.update({
    where: { id },
    data: {
      title,
      privacy,
      description,
      thumbnail,
      tags,
      category,
      videoUrl: video,
      duration: videoDuration,
    },
  });

  return channel;
};

type Types = {
  page: number;
  limit: number;
  channelId: number;
};

type GetChannelVideosResponse = {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getChannelVideosService = async ({
  page,
  limit,
  sortOrder = "oldest",
  channelId,
}: Types & {
  sortOrder?: "oldest" | "newest";
}): Promise<GetChannelVideosResponse> => {
  const skip = (page - 1) * limit;

  const videos = await prisma.video.findMany({
    where: { channelId, AND: { privacy: "PUBLIC" } },
    skip,
    take: limit,
    orderBy: [
      {
        createdAt: sortOrder === "oldest" ? "asc" : "desc",
      },
      {
        title: "desc",
      },
    ],
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          channelProfileImage: true,
        },
      },
    },
  });

  const total = await prisma.video.count({
    where: { channelId },
  });

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// User Interaction

import { NOT_FOUND, BAD_REQUEST } from "../constants/http";
import appAssert from "../utils/appAssert";

export const toggleLikeVideoService = async (
  videoId: number,
  userId: number
): Promise<boolean> => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  appAssert(video, NOT_FOUND, "Video not found");

  const existingLike = await prisma.videoLike.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  const existingDislike = await prisma.videoDislike.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  if (existingLike) {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { likes: { decrement: 1 } },
      }),
      prisma.videoLike.delete({
        where: { userId_videoId: { userId, videoId } },
      }),
    ]);
    return false; // Video is unliked
  } else if (existingDislike) {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { dislikes: { decrement: 1 }, likes: { increment: 1 } },
      }),
      prisma.videoDislike.delete({
        where: { userId_videoId: { userId, videoId } },
      }),
      prisma.videoLike.create({
        data: { userId, videoId },
      }),
    ]);
    return true; // Video is liked, and dislike is removed
  } else {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { likes: { increment: 1 } },
      }),
      prisma.videoLike.create({
        data: { userId, videoId },
      }),
    ]);
    return true; // Video is liked
  }
};

export const toggleDislikeVideoService = async (
  videoId: number,
  userId: number
) => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  appAssert(video, NOT_FOUND, "Video not found");

  const existingDislike = await prisma.videoDislike.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  const existingLike = await prisma.videoLike.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  if (existingDislike) {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { dislikes: { decrement: 1 } },
      }),
      prisma.videoDislike.delete({
        where: { userId_videoId: { userId, videoId } },
      }),
    ]);
    return false;
  } else if (existingLike) {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { likes: { decrement: 1 }, dislikes: { increment: 1 } },
      }),
      prisma.videoLike.delete({
        where: { userId_videoId: { userId, videoId } },
      }),
      prisma.videoDislike.create({
        data: { userId, videoId },
      }),
    ]);
    return true;
  } else {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: { dislikes: { increment: 1 } },
      }),
      prisma.videoDislike.create({
        data: { userId, videoId },
      }),
    ]);
    return true;
  }
};

export const toggleBookmarkVideoService = async (
  videoId: number,
  userId: number,
  time: number
) => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  appAssert(video, NOT_FOUND, "Video not found");

  const existingBookmark = await prisma.bookmark.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  if (existingBookmark) {
    await prisma.bookmark.delete({
      where: { userId_videoId: { userId, videoId } },
    });
    return false;
  } else {
    await prisma.bookmark.create({
      data: { userId, videoId, time },
    });
  }
  return true;
};

export const updateWatchHistoryService = async (
  videoId: number,
  userId: number,
  progress: number
) => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  appAssert(video, NOT_FOUND, "Video not found");

  if (video.duration !== null) {
    if (progress < 0 || progress > video.duration) {
      throw new Error("Invalid progress value");
    }
  }

  // Find existing watch history entry for this video
  const existingEntry = await prisma.watchHistory.findFirst({
    where: { videoId, userId },
  });

  if (existingEntry) {
    // Update progress of existing entry
    await prisma.watchHistory.update({
      where: { id: existingEntry.id },
      data: { progress },
    });
  } else {
    // Create new watch history entry if it doesn't exist
    await prisma.watchHistory.create({
      data: {
        userId,
        videoId,
        progress,
        createdAt: new Date(),
      },
    });
  }
};

export const createPollService = async (
  question: string,
  options: { text: string; order: number }[],
  userId: number,
  videoId?: number
) => {
  if (options.length < 2) {
    throw new Error("At least two options are required for a poll");
  }

  try {
    const poll = await prisma.poll.create({
      data: {
        question,
        options: {
          create: options.map(({ text, order }) => ({ text, order })),
        },
        user: { connect: { id: userId } },
        ...(videoId && { video: { connect: { id: videoId } } }),

      },
      include: {
        options: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return poll;
  } catch (error : any) {
    console.error('Error creating poll:', error);
    throw new Error(`Failed to create poll: ${error.message}`);
  }
};

export const votePollService = async (
  pollId: number,
  userId: number,
  optionId: number
) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });
  appAssert(poll, NOT_FOUND, "Poll not found");

  const option = poll.options.find((opt) => opt.id === optionId);
  appAssert(option, BAD_REQUEST, "Invalid option");

  const existingVote = await prisma.pollVote.findFirst({
    where: {
      userId,
      poll: { id: pollId },
    },
  });

  if (existingVote) {
    throw new Error("User has already voted for this poll");
  }

  await prisma.pollVote.create({
    data: {
      user: { connect: { id: userId } },
      option: { connect: { id: optionId } },
      poll: { connect: { id: pollId } },
    },
  });
};

type GetPollsParams = {
  page: number;
  limit: number;
  sortBy?: "createdAt" | "votes";
  sortOrder?: "asc" | "desc";
  videoId?: number;
  userId?: number;
};

type GetPollsResponse = {
  polls: Poll[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getPollsForFeedService = async ({
  page,
  limit,
  sortBy = "createdAt",
  sortOrder = "desc",
  videoId,
  userId,
}: GetPollsParams): Promise<GetPollsResponse> => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (videoId) {
    where.videoId = videoId;
  }

  if (userId) {
    where.userId = userId;
  }

  const orderBy: any[] = [];
  if (sortBy === "votes") {
    orderBy.push({
      votes: {
        _count: sortOrder,
      },
    });
  } else {
    orderBy.push({
      [sortBy]: sortOrder,
    });
  }

  const polls = await prisma.poll.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
      _count: {
        select: { votes: true },
      },
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      video: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
    },
  });

  const total = await prisma.poll.count({
    where,
  });

  return {
    polls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

interface LogViewParams {
  videoId: number;
  userId: number;
}

const VIEW_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const logViewService = async ({ videoId, userId }: LogViewParams) => {
  try {
    const now = new Date();

    // Attempt to find or create a ViewedVideo entry
    const [viewedVideo, created] = await prisma.$transaction([
      prisma.viewedVideo.upsert({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
        update: {},
        create: {
          userId,
          videoId,
        },
      }),
      prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } },
      }),
    ]);

    // If it's a new view or the cooldown period has passed, update the view count
    if (
      created ||
      now.getTime() - viewedVideo.viewedAt.getTime() > VIEW_COOLDOWN
    ) {
      await prisma.viewedVideo.update({
        where: { id: viewedVideo.id },
        data: { viewedAt: now },
      });
    }

    console.log(`View logged for video ${videoId} by user ${userId}`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.error("Unique constraint violation:", error);
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(`Video with ID ${videoId} does not exist.`);
    } else {
      console.error("Error logging view:", error);
      throw error;
    }
  }
};

const categoryKeywords: Record<ContentCategory, string[]> = {
  EDUCATION: ["education", "learning", "tutorial", "course", "study"],
  ENTERTAINMENT: ["entertainment", "fun", "comedy", "show", "amusement"],
  MUSIC: ["music", "song", "concert", "band", "album"],
  NEWS: ["news", "report", "journalism", "current events", "update"],
  TECHNOLOGY: ["technology", "tech", "gadget", "innovation", "software"],
};

function findMatchingCategories(query: string): ContentCategory[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.entries(categoryKeywords).reduce(
    (matches, [category, keywords]) => {
      if (keywords.some((keyword) => lowercaseQuery.includes(keyword))) {
        matches.push(category as ContentCategory);
      }
      return matches;
    },
    [] as ContentCategory[]
  );
}

type SearchVideosResponse = {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const searchVideosService = async (
  query: string,
  page: number,
  limit: number,
  sort: string,
  order: "asc" | "desc",
  category?: ContentCategory
): Promise<SearchVideosResponse> => {
  const skip = (page - 1) * limit;

  // Split the query string into an array of words
  const queryWords = query.split(/\s+/).filter((word) => word.length > 0);

  // Find matching categories
  const matchingCategories = category
    ? [category]
    : findMatchingCategories(query);

  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: queryWords } },
        { category: { in: matchingCategories } },
      ],
    },
    include: {
      channel: true,
    },
    skip,
    take: limit,
    orderBy: { [sort]: order },
  });

  const total = await prisma.video.count({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: queryWords } },
        { category: { in: matchingCategories } },
      ],
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getTrendingVideosService = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const videos = await prisma.video.findMany({
    where: { privacy: "PUBLIC" },
    orderBy: { views: "desc" },
    include: { channel: true },
    skip,
    take: limit,
  });
  const total = await prisma.video.count({
    where: { privacy: "PUBLIC" },
    orderBy: { views: "desc" },
    skip,
    take: limit,
  });
  const totalPages = Math.ceil(total / limit);

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

// export const getRecommendedVideosService = async (userId: number, page: number, limit: number) => {
//   const skip = (page - 1) * limit;
//   const userInterests = await prisma.userInterest.findMany({
//     where: { userId },
//     select: { interestLevel: true },
//     orderBy: { interestLevel: 'desc' },
//     take: 5,
//   });

//   const interestLevels = userInterests.map((interest) => interest.interestLevel);
//   const videos = await prisma.video.findMany({
//     where: {
//       category: {
//         in: interestLevels,
//       },
//     },
//     skip,
//     take: limit,
//     orderBy: { createdAt: 'desc' },
//   });
//   return videos;
// };

export const getVideosByCategoryService = async (
  category: ContentCategory,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const videos = await prisma.video.findMany({
    where: { category: category },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return videos;
};

export const getRelatedVideosService = async (
  videoId: number,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { tags: true, category: true },
  });

  if (!video) {
    throw new Error("Video not found");
  }

  const relatedVideos = await prisma.video.findMany({
    where: {
      NOT: { id: videoId },
      AND: { privacy: { not: "PRIVATE" } },
      OR: [{ category: video.category }, { tags: { hasSome: video.tags } }],
    },
    include: { channel: true },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.video.count({
    where: {
      NOT: { id: videoId },
      AND: { privacy: { not: "PRIVATE" }, category: video.category },
      OR: [{ tags: { hasSome: video.tags } }],
    },
  });

  // const total = relatedVideos.length; // Total count of related videos or you can do another req. for count ..
  const totalPages = Math.ceil(total / limit);

  return {
    videos: relatedVideos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
export const getVideoPlaylistsService = async (
  videoId: number,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const playlists = await prisma.playlist.findMany({
    where: {
      videos: { some: { id: videoId } },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = playlists.length;
  const totalPages = Math.ceil(total / limit);

  return {
    playlists,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getVideosByAllTags = async (
  tags: string[],
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [videos, total] = await prisma.$transaction([
    prisma.video.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }, // Ensure consistent ordering
    }),
    prisma.video.count({
      where: {
        tags: {
          hasSome: tags,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
