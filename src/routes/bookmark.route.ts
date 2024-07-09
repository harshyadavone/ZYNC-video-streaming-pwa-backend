import express from "express";
import {
  getBookmarkById,
  getBookmarks,
  getVideoBookmarks,
  //   updateBookmarkStatus,
} from "../controllers/bookmarkController";

const bookmarkRouter = express.Router();

// Bookmark Management
bookmarkRouter.get("/bookmarks", getBookmarks);
bookmarkRouter.get("/bookmarks/:bookmarkId", getBookmarkById);

// Bookmark Status Update
// bookmarkRouter.put("/bookmarks/:bookmarkId/status", updateBookmarkStatus);

// Bookmark Retrieval for Video
bookmarkRouter.get("/videos/:videoId/bookmarks", getVideoBookmarks);

export default bookmarkRouter;
