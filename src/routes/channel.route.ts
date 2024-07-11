import { Router } from "express";
import {
  createChannelHandler,
  deleteChannelHandler,
  getAllChannelsHandler,
  getChannelHandler,
  getMyChannelHandler,
  updateChannelHandler,
} from "../controllers/channel.controller";
import { upload } from "../middleware/multer.middleware";

const channelRoutes = Router();

// Create a new channel
channelRoutes.post(
  "/create-channel",
  upload.fields([
    { name: "channelProfileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  createChannelHandler
);

// Update an existing channel
channelRoutes.put(
  "/update-channel",
  upload.fields([
    { name: "channelProfileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  updateChannelHandler
);

// // Delete a channel
channelRoutes.delete("/delete-channel", deleteChannelHandler);

// // Get all channels (excluding user's own channel)
channelRoutes.get("/all-channels", getAllChannelsHandler);

channelRoutes.get("/my-channel", getMyChannelHandler);


channelRoutes.get("/channel/:channelId", getChannelHandler);

export default channelRoutes;
