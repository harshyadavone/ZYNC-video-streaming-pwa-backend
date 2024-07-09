// getChannelSubscriptions

// Subscription Routes
// router.get('/channels/:channelId/subscriptions', getChannelSubscriptions);
// router.get('/subscriptions/:subscriptionId', getSubscriptionById);
// router.post('/channels/:channelId/subscribe', subscribeToChannel);
// router.delete('/subscriptions/:subscriptionId', unsubscribeFromChannel);
// router.put('/subscriptions/:subscriptionId/status', updateSubscriptionStatus);

import {
  getAllUserSubscriptionsService,
  getChannelSubscriptionsService,
  getSubscriptionByIdService,
  getSubscriptionStatusService,
  toggleSubscriptionService,
} from "../services/subscription.services";
import catchErrors from "../utils/catchErrors";

export const getChannelSubscriptions = catchErrors(async (req, res) => {
  const channelId = parseInt(req.params.channelId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await getChannelSubscriptionsService(channelId, page, limit);

  res.json(result);
});

export const getAllUserSubscriptions = catchErrors(async (req, res) => {
  const userId = req.userId;

  if(!userId){
    return res.status(401).json({ error: "Unauthorized" });
  }

  const result = await getAllUserSubscriptionsService(userId);

  res.json(result);
});

export const getSubscriptionById = catchErrors(async (req, res) => {
  const { subscriptionId } = req.params;
  try {
    const subscription = await getSubscriptionByIdService(
      Number(subscriptionId)
    );
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export const toggleSubscription = catchErrors(async (req, res) => {
  const channelId = parseInt(req.params.channelId);
  const userId = req.userId;
  if (!userId) {
    throw new Error("You are not authorized to do this");
  }
  const subscription = await toggleSubscriptionService(
    Number(channelId),
    Number(userId)
  );
  res.status(201).json(subscription);
});

// export const unsubscribeFromChannel = catchErrors(async (req, res) => {
//   const channelId = parseInt(req.params.channelId);
//   const userId = req.userId; // Ensure you have middleware to set req.userId

//   if (!userId) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   const result = await unsubscribeFromChannelService(channelId, userId);

//   if (result.count === 0) {
//     return res
//       .status(404)
//       .json({ message: "Subscription not found or already unsubscribed" });
//   }

//   res
//     .status(200)
//     .json({ message: "Successfully unsubscribed from the channel" });
// });

export const getSubscriptionStatus = catchErrors(async (req, res) => {
  const channelId = parseInt(req.params.channelId);
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const subscriptionStatus = await getSubscriptionStatusService(
    channelId,
    userId
  );

  res.status(200).json({ subscribed: subscriptionStatus });
});

// export const updateSubscriptionStatus = catchErrors(async (req, res) => {
//   const { subscriptionId } = req.params;
//   const { status } = req.body;
//   try {
//     const updatedSubscription = await updateSubscriptionStatusService(
//       Number(subscriptionId),
//       status
//     );
//     res.json(updatedSubscription);
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
