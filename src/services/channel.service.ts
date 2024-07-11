// services/channelService.js

import { Channel, PrismaClient } from "@prisma/client";
import appAssert from "../utils/appAssert";
import { CONFLICT, NOT_FOUND } from "../constants/http";

const prisma = new PrismaClient();

interface CreateChannelParams {
  name: string;
  description: string | undefined;
  ownerId: number;
  slug: string;
  bannerImage: string | undefined;
  channelProfileImage: string | undefined;
}

export async function createChannel({
  name,
  description,
  ownerId,
  slug,
  bannerImage,
  channelProfileImage,
}: CreateChannelParams): Promise<Channel> {
  // Check if user already has a channel
  const existingChannel = await prisma.channel.findFirst({
    where: {
      ownerId,
    },
  });

  //   if (existingChannel) {
  //     throw new Error('User can only create one channel');
  //   }

  appAssert(!existingChannel, CONFLICT, "User can only create one channel");

  await prisma.user.update({
    where: { id: ownerId },
    data: {
      role: "CREATOR",
    },
  });

  const channel = await prisma.channel.create({
    data: {
      name,
      description,
      ownerId,
      slug,
      bannerImage,
      channelProfileImage,
    },
  });

  return channel;
}

type UpdateChannelParams = {
  id: number | undefined;
  name?: string;
  description?: string;
  slug?: string;
  channelProfileImage?: string;
  bannerImage?: string;
};

export const updateChannel = async ({
  id,
  name,
  description,
  bannerImage,
  channelProfileImage,
  slug,
}: UpdateChannelParams) => {

  if(!id)
  {
    return console.log("Id not found")
  }

  const channel = await prisma.channel.update({
    where: { id },
    data: {
      name,
      description,
      bannerImage,
      channelProfileImage,
      slug,
    },
  });

  return channel;
};

export const deleteChannel = async (
  channelId: number
): Promise<{ message: string }> => {
  await prisma.channel.delete({
    where: {
      id: channelId,
    },
  });

  return { message: "Channel deleted successfully" };
};

type GetAllChannelsParams = {
  userId: number | undefined;
  page: number;
  limit: number;
};

type GetAllChannelsResponse = {
  channels: Channel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getAllChannels = async ({
  userId,
  page,
  limit,
}: GetAllChannelsParams): Promise<GetAllChannelsResponse> => {
  const skip = (page - 1) * limit;

  // Query all channels except the one owned by the user
  const channels = await prisma.channel.findMany({
    where: {
      ownerId: {
        not: userId,
      },
    },
    skip,
    take: limit,
  });

  // Get the total count of channels (excluding the user's own channel)
  const total = await prisma.channel.count({
    where: {
      ownerId: {
        not: userId,
      },
    },
  });

  return {
    channels,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// export const getChannelsExcludingUser = async (userId) => {
//   const channels = await prisma.channel.findMany({
//     where: {
//       NOT: {
//         ownerId: userId,
//       },
//     },
//   });
//   return channels;
// };

export const getMyChannel = async (userId: number | undefined) => {
  // Query the channel owned by the user
  const channel = await prisma.channel.findFirst({
    where: {
      ownerId: userId,
    },
    // Optionally include related data
    include: {
      _count: { select: { videos: true, subscribers: true, playlists: true } },
    },
  });

  
  // appAssert(channel, NOT_FOUND, "Channel Not found");

  return {
    channel,
  };
};
export const getChannel = async (channelId: number) => {
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
    },
    // Optionally include related data
    include: {
      _count: { select: { videos: true, subscribers: true, playlists: true } },
    },
  });

  
  // appAssert(channel, NOT_FOUND, "Channel Not found");

  return {
    channel,
  };
};
