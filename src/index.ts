// docker run -v mongo_volume -p 27017:27017 mongo
import express from "express";
// import connectToDatase from "./config/db";
import "dotenv/config";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";
import validateSession from "./middleware/validateSession";
import channelRoutes from "./routes/channel.route";
import playlistRouter from "./routes/playlist.route";
import videoRouter from "./routes/video.route";
import commentRouter from "./routes/comment.route";
import bookmarkRouter from "./routes/bookmark.route";
import subscriptionRouter from "./routes/subscription.route";
import watchHistoryRouter from "./routes/watchHistory.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser())

app.get("/", (req, res) => {
  return res.status(OK).json({ status: "healthy" });
});

app.use("/auth", authRoutes)

// protected routes

app.use("/user", authenticate, validateSession, userRoutes)
app.use("/sessions", authenticate, validateSession, sessionRoutes)
app.use("/channels", authenticate, validateSession, channelRoutes)
app.use("/playlist", authenticate, validateSession, playlistRouter)
app.use("/video", authenticate, validateSession, videoRouter)
app.use("/comment", authenticate, validateSession, commentRouter)
app.use("/bookmark", authenticate, validateSession, bookmarkRouter)
app.use("/subscription", authenticate, validateSession, subscriptionRouter)
app.use("/me", authenticate, validateSession, watchHistoryRouter)

app.use(errorHandler)

app.listen(PORT, async () => {
  console.log(`Server is running on ${PORT} in ${NODE_ENV} environment`);
});
