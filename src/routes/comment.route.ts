import express from "express";
import { addComment, deleteComment, dislikeComment, getCommentReaction, getComments, getReplies, likeComment, updateComment } from "../controllers/commentController";

const commentRouter = express.Router();

commentRouter.get("/videos/:videoId/comments", getComments);
commentRouter.post("/videos/:videoId/comments", addComment);
commentRouter.put("/comments/:commentId", updateComment);
commentRouter.delete("/comments/:commentId", deleteComment);
commentRouter.post("/comments/:commentId/like", likeComment);
commentRouter.post("/comments/:commentId/dislike", dislikeComment);
commentRouter.get("/comments/:commentId/reaction", getCommentReaction);
commentRouter.get("/comments/:commentId/replies", getReplies);

export default commentRouter;
