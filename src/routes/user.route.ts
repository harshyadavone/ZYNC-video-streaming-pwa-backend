import { Router } from "express";
import {
  checkUsernameHandler,
  getUserHandler,
  updateProfileHandler,
} from "../controllers/user.controller";
import { upload } from "../middleware/multer.middleware";

const userRoutes = Router();

// prefix = /user

userRoutes.get("/", getUserHandler);
// in update-profile route handle image upload
userRoutes.post(
  "/update-profile",
  upload.single("avatar"),
  updateProfileHandler
);

// In your backend API routes
userRoutes.get('/check-username/:username', checkUsernameHandler);

export default userRoutes;
