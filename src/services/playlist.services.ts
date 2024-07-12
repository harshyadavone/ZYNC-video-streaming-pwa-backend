import { Playlist, Privacy } from "@prisma/client";
import prisma from "../config/client";

export const createPlaylistService = async (
  name: string,
  description: string | undefined,
  privacy: "PUBLIC" | "PRIVATE" | "UNLISTED" | undefined,
  ownerId: any,
  channelId?: number
) => {
  return await prisma.playlist.create({
    data: {
      name,
      description,
      privacy: privacy || (channelId ? "PUBLIC" : "PRIVATE"),
      channelId,
      ownerId,
    },
  });
};

export const updatePlaylistService = async (
  playlistId: number,
  name?: string,
  description?: string,
  privacy?: Privacy,
  userId?: number
) => {
  const playlist = await prisma.playlist.findFirst({
    where: {
      id: playlistId,
      ownerId: userId,
    },
  });

  if (!playlist) {
    return null;
  }

  return await prisma.playlist.update({
    where: {
      id: playlistId,
    },
    data: {
      name: name || undefined,
      description: description || undefined,
      privacy: privacy || undefined,
    },
  });
};

type GetAllChannelPlaylistParams = {
  channelId: number;
  page: number;
  limit: number;
};

type GetAllChannelPlaylistsResponse = {
  playlists: Playlist[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getChannelPlaylistsService = async ({
  channelId,
  page,
  limit,
  sortOrder = "oldest",
}: GetAllChannelPlaylistParams & {
  sortOrder?: "oldest" | "newest";
}): Promise<GetAllChannelPlaylistsResponse> => {
  const skip = (page - 1) * limit;

  // Query playlists for the specified channel
  const playlists = await prisma.playlist.findMany({
    where: { channelId },
    skip,
    take: limit,
    orderBy: [
      {
        createdAt: sortOrder === "oldest" ? "asc" : "desc", // Dynamically set the sort order
      },
      {
        name: "desc", // Keep secondary sort by name descending
      },
    ],
  });

  // Get the total count of playlists for the specified channel
  const total = await prisma.playlist.count({
    where: { channelId },
  });

  return {
    playlists,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

type GetUserPlaylistParams = {
  ownerId: number;
  page: number;
  limit: number;
};

type GetUserPlaylistsResponse = {
  playlists: Playlist[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getUserPlaylistsService = async ({
  ownerId,
  page,
  limit,
  sortOrder = "oldest",
}: GetUserPlaylistParams & {
  sortOrder?: "oldest" | "newest";
}): Promise<GetUserPlaylistsResponse> => {
  const skip = (page - 1) * limit;

  // Query all playlists owned by the user and exclude playlists associated with any channel
  const playlists = await prisma.playlist.findMany({
    where: {
      ownerId,
      channelId: {
        equals: null,
      },
    },
    skip,
    take: limit,
    orderBy: [
      {
        updatedAt: sortOrder === "oldest" ? "asc" : "desc",
      },
      {
        name: "desc",
      },
    ],
  });

  // Get the total count of playlists owned by the user and not associated with any channel
  const total = await prisma.playlist.count({
    where: {
      ownerId,
      channelId: {
        equals: null,
      },
    },
  });

  return {
    playlists,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

type params = {
  playlistId: number;
  page:number;
  limit:number
};

export const getPlaylistByIdService = async ({ playlistId, page, limit }: params) => {
  const skip = (page - 1) * limit;

  const playlist = await prisma.playlist.findUnique({
    where: {
      id: playlistId,
    },
    include: {
      videos: {
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              channelProfileImage: true,
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  if (!playlist) {
    return null;
  }

  // Get total count of videos in the playlist
  const total = await prisma.video.count({
    where: {
      playlists: {
        some: {
          id: playlistId,
        },
      },
    },
  });

  return {
    playlist: {
      ...playlist,
      videos: playlist.videos.map(video => ({
        ...video,
        channel: video.channel,
      })),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export async function addVideoToPlaylistService(
  playlistId: number,
  videoId: number
) {
  try {
    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videos: {
          connect: { id: videoId },
        },
      },
      include: {
        videos: true,
      },
    });

    return updatedPlaylist;
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    throw error;
  }
}

export async function addVideoToChannelPlaylistService(
  playlistId: number,
  videoId: number,
  channelId: number,
) {
  try {
    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId , channelId},
      data: {
        videos: {
          connect: { id: videoId },
        },
      },
      include: {
        videos: true,
      },
    });

    return updatedPlaylist;
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    throw error;
  }
}

export async function removeVideoFromPlaylistService(
  playlistId: number,
  videoId: number
) {
  try {
    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videos: {
          disconnect: { id: videoId },
        },
      },
      include: {
        videos: true,
      },
    });

    return updatedPlaylist;
  } catch (error) {
    console.error("Error removing video from playlist:", error);
  }
}

export async function isVideoInPlaylistService(
  playlistId: number,
  videoId: number
) {
  try {
    const count = await prisma.playlist.count({
      where: {
        id: playlistId,
        videos: {
          some: {
            id: videoId,
          },
        },
      },
    });

    return count > 0;
  } catch (error) {
    console.error("Error checking if video is in playlist:", error);
    throw error;
  }
}
