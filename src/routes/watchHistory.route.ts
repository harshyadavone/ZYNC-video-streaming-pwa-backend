// // Watch History Management

import { Router } from "express";
import {
  clearAllWatchHistoryHandler,
  createOrUpdateWatchHistoryHandler,
  deleteWatchHistoryHandler,
  getWatchHistoryByIdHandler,
  getWatchHistoryHandler,
} from "../controllers/watchHistory.controller";

const watchHistoryRouter = Router();

watchHistoryRouter.get("/watchHistory", getWatchHistoryHandler); 
watchHistoryRouter.get(
  "/watchHistory/:watchHistoryId",
  getWatchHistoryByIdHandler
);
watchHistoryRouter.post(
  "/videos/:videoId/watchHistory",
  createOrUpdateWatchHistoryHandler
); // done in video.route.ts
watchHistoryRouter.delete(
  "/watchHistory/:watchHistoryId",
  deleteWatchHistoryHandler
);

watchHistoryRouter.delete("/watchHistory", clearAllWatchHistoryHandler);

export default watchHistoryRouter;
