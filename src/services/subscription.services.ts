import { SubscriptionStatus } from "@prisma/client";
import prisma from "../config/client";

export const getChannelSubscriptionsService = async (
  channelId: number,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const take = limit;

  const subscriptions = await prisma.subscription.findMany({
    where: { channelId },
    include: { subscriber: true },
    skip,
    take,
  });

  const totalSubscriptions = await prisma.subscription.count({
    where: { channelId },
  });

  return {
    totalSubscriptions,
    totalPages: Math.ceil(totalSubscriptions / limit),
    currentPage: page,
    subscriptions,
  };
};

export const getAllUserSubscriptionsService = async (userId: number) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: userId },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          channelProfileImage: true,
          _count: {
            select: { subscribers: true },
          },
        },
      },
    },
  });

  return subscriptions.map((sub) => ({
    id: sub.id,
    status: sub.status,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
    channelId: sub.channelId,
    channelName: sub.channel.name,
    channelProfileImage: sub.channel.channelProfileImage,
    subscriberCount: sub.channel._count.subscribers,
  }));
};

export const getSubscriptionByIdService = async (subscriptionId: number) => {
  return prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { subscriber: true, channel: true },
  });
};

export const toggleSubscriptionService = async (
  channelId: number,
  userId: number
) => {
  // Check if the user is already subscribed to the channel
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      channelId,
      subscriberId: userId,
    },
  });

  let result;
  let isSubscribed;

  if (existingSubscription) {
    // If subscription exists, delete it (unsubscribe)
    await prisma.subscription.delete({
      where: {
        id: existingSubscription.id,
      },
    });
    isSubscribed = false;
  } else {
    // If subscription doesn't exist, create it (subscribe)
    result = await prisma.subscription.create({
      data: {
        channelId,
        subscriberId: userId,
        status: "ACTIVE",
      },
    });
    isSubscribed = true;
  }

  // Fetch the updated channel information
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      _count: {
        select: { subscribers: true }
      }
    }
  });

  return {
    id: isSubscribed ? result?.id : null,
    status: isSubscribed ? "ACTIVE" : "INACTIVE",
    channelId: channelId,
    channelName: channel?.name,
    channelProfileImage: channel?.channelProfileImage,
    subscriberCount: channel?._count.subscribers,
    message: isSubscribed ? "Subscribed successfully" : "Unsubscribed successfully"
  };
};

export const getSubscriptionStatusService = async (
  channelId: number,
  userId: number
) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      channelId,
      subscriberId: userId,
    },
  });

  return !!subscription;
};

// export const updateSubscriptionStatusService = async (
//   subscriptionId: number,
//   status: SubscriptionStatus
// ) => {
//   return prisma.subscription.update({
//     where: { id: subscriptionId },
//     data: { status },
//   });
// };
