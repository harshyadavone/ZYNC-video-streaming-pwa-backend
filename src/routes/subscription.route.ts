// Subscription Routes

import { Router } from "express";
import { getAllUserSubscriptions, getChannelSubscriptions, getSubscriptionById, getSubscriptionStatus, toggleSubscription, } from "../controllers/subscription.controller";

const subscriptionRouter = Router()

subscriptionRouter.get('/channels/:channelId/subscriptions', getChannelSubscriptions);
subscriptionRouter.get('/my-subscriptions', getAllUserSubscriptions);
subscriptionRouter.get('/subscriptions/:subscriptionId', getSubscriptionById);
subscriptionRouter.post('/channels/:channelId/toggle-subscription', toggleSubscription);
// subscriptionRouter.delete('/channels/:channelId/unsubscribe', unsubscribeFromChannel);
subscriptionRouter.get('/channels/:channelId/subscription-status', getSubscriptionStatus);
// subscriptionRouter.put('/subscriptions/:subscriptionId/status', updateSubscriptionStatus);


export default subscriptionRouter