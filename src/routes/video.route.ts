// ... (other routes)
import { Router } from "express";
import {
  createUserPoll,
  createVideoPoll,
  deleteVideo,
  dislikeVideo,
  getChannelVideos,
  getPollsForFeed,
  getPrivateVideoById,
  getPrivateVideos,
  getRelatedVideos,
  getTrendingVideos,
  getVideoById,
  getVideoPlaylists,
  getVideos,
  getVideosByCategory,
  getVideosByTag,
  likeVideo,
  logVideoView,
  searchTitle,
  searchVideos,
  toggleBookmarkVideo,
  updateVideo,
  updateWatchHistory,
  uploadProgressHandler,
  uploadVideo,
  voteUserPoll,
  voteVideoPoll,
} from "../controllers/video.controller";
import { upload } from "../middleware/multer.middleware";

const videoRouter = Router();

// // Video Management
videoRouter.get("/videos", getVideos);
videoRouter.get("/videos/:videoId", getVideoById);
videoRouter.post('/videos/:videoId/log-view', logVideoView);
videoRouter.get("/private/videos/:videoId", getPrivateVideoById);
videoRouter.get("/private/videos", getPrivateVideos);
videoRouter.post(
  "/:channelId/video",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  uploadVideo
);
videoRouter.put(
  "/videos/:videoId", 
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateVideo
);
videoRouter.delete("/videos/:videoId", deleteVideo);
videoRouter.get("/videos/channel/:channelId", getChannelVideos);

videoRouter.post("/videos/:videoId/like", likeVideo);
videoRouter.post("/videos/:videoId/dislike", dislikeVideo);
videoRouter.post("/videos/:videoId/bookmark", toggleBookmarkVideo);
videoRouter.post("/videos/:videoId/watchHistory", updateWatchHistory);
 
// Routes for video-specific polls
videoRouter.post("/videos/:videoId/polls", createVideoPoll);
videoRouter.post("/videos/:videoId/polls/:pollId/vote", voteVideoPoll);

// Routes for user polls (feed)
videoRouter.post("/users/:userId/polls", createUserPoll);
videoRouter.post("/users/:userId/polls/:pollId/vote", voteUserPoll);
videoRouter.get("/polls/feed", getPollsForFeed);

// search & filtering with playlist

videoRouter.get("/search", searchVideos);
videoRouter.get("/search/title", searchTitle);
videoRouter.get("/trending", getTrendingVideos);
// videoRouter.get('/recommended', getRecommendedVideos);
videoRouter.get("/category", getVideosByCategory);
videoRouter.get("/:videoId/related", getRelatedVideos);
videoRouter.get("/:videoId/playlists", getVideoPlaylists);
videoRouter.get("/search/tag", getVideosByTag);

videoRouter.get('/upload-progress/:uploadId', uploadProgressHandler);

export default videoRouter;
