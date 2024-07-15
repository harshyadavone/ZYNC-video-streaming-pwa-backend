const uploadProgress = new Map<string, number>();
import prisma from "../config/client";
import {
  BAD_REQUEST,
  FORBIDDEN,
  NOT_FOUND,
  OK,
} from "../constants/http";
import {
  getChannelVideosService,
  getPollsForFeedService,
  getPrivateVideosService,
  getRelatedVideosService,
  getTrendingVideosService,
  getVideoPlaylistsService,
  getVideosByAllTags,
  getVideosByCategoryService,
  getVideosService,
  logViewService,
  searchVideosService,
  toggleBookmarkVideoService,
  toggleDislikeVideoService,
  toggleLikeVideoService,
  updateVideoService,
  uploadVideoService,
} from "../services/video.service";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { uploadOnCloudinary } from "../utils/cloudinary";
import {
  updateVideoSchema,
  videoUploadSchema,
} from "../validations/video.validation";
import { v4 as uuidv4 } from "uuid";

export const uploadVideo = catchErrors(async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  try {
    const id = Number(req.params.channelId);
    const ownerId = req.userId;
    const tags = JSON.parse(req.body.tags);

    const { title, description, category, privacy } = videoUploadSchema.parse(
      req.body
    );

    const uploadId = uuidv4();
    uploadProgress.set(uploadId, 0);

    // Function to send progress updates
    const sendProgress = (progress: number) => {
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    };

    // Function to handle file upload
    const uploadFile = async (
      file: Express.Multer.File,
      fileType: "thumbnail" | "video"
    ) => {
      const uploadResult = await uploadOnCloudinary(file.path, (progress) => {
        console.log(`${fileType} upload progress: ${progress.toFixed(2)}%`);
        if (fileType === "video") {
          uploadProgress.set(uploadId, progress);
          sendProgress(progress);
        }
      });

      if (!uploadResult) {
        throw new Error(`Failed to upload ${fileType} to Cloudinary`);
      }

      return uploadResult;
    };

    // Upload thumbnail
    let thumbnail: string | undefined;
    if (req.files && "thumbnail" in req.files && req.files["thumbnail"][0]) {
      const thumbnailResult = await uploadFile(
        req.files["thumbnail"][0],
        "thumbnail"
      );
      thumbnail = thumbnailResult.url;
    }

    // Upload video
    let video: string | undefined;
    let videoDuration: number | undefined;
    if (req.files && "video" in req.files && req.files["video"][0]) {
      const videoResult = await uploadFile(req.files["video"][0], "video");
      video = videoResult.playback_url;
      videoDuration = videoResult.duration;
    }

    // Check if all required fields are present
    if (!title || !tags || !thumbnail || !video) {
      throw new Error("Title, tags, thumbnail, and video are required fields");
    }

    if (!ownerId) {
      throw new Error("User is not authorized to perform this task");
    }

    // Upload to database
    const uploadedVideo = await uploadVideoService({
      id,
      title,
      tags,
      description,
      thumbnail,
      video,
      ownerId,
      videoDuration,
      category,
      privacy,
    });

    uploadProgress.delete(uploadId);

    // Send final success message
    res.write(
      `data: ${JSON.stringify({ status: "success", video: uploadedVideo })}\n\n`
    );
    res.end();
  } catch (error: any) {
    console.error("Error uploading video in catch block:", error);
    res.write(
      `data: ${JSON.stringify({ status: "error", message: error.message })}\n\n`
    );
    res.end();
  }
});

export const getVideoById = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);

  const userId = req.userId;

  const video = await prisma.video.findUnique({
    where: {
      id: videoId,
      AND: {
        privacy: "PUBLIC",
      },
    },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          bannerImage: true,
          channelProfileImage: true,
          _count: {
            select: {
              subscribers: true,
            },
          },
        },
      },
      polls: {
        include: {
          options: {
            include: {
              votes: { where: { userId } },
              _count: {
                select: { votes: true },
              },
            },
            orderBy: { order: "asc" }
          },
          _count: {
            select: { votes: true },
          },
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!userId) {
    throw new Error("Not authorized");
  }

  appAssert(video, NOT_FOUND, "Video Not Found");

  return res.status(OK).json(video);
});

export const getPrivateVideoById = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);

  const video = await prisma.video.findUnique({
    where: { id: videoId, privacy: { in: ["PRIVATE" || "UNLISTED"] } },
  });

  appAssert(video, NOT_FOUND, "Video Not Found");

  return res.status(OK).json(video);
});

export const getVideos = catchErrors(async (req, res) => {
  const { page = 1, limit = 1, sortOrder = "newest" } = req.query;
  // const userId = req.userId;

  // console.log(req.user)
  // Call service function to fetch all channels except user's own channel
  const videos = await getVideosService({
    page: Number(page),
    limit: Number(limit),
    sortOrder: sortOrder === "newest" ? "newest" : "oldest", // Ensure sortOrder is valid
  });

  return res.status(200).json(videos);
});

export const getPrivateVideos = catchErrors(async (req, res) => {
  const { page = 1, limit = 1, sortOrder = "newest" } = req.query;
  const userId = req.userId;

  if (!userId) {
    throw new Error("Not allowed");
  }

  // console.log(req.user)
  // Call service function to fetch all channels except user's own channel
  const videos = await getPrivateVideosService({
    userId,
    page: Number(page),
    limit: Number(limit),
    sortOrder: sortOrder === "newest" ? "newest" : "oldest", // Ensure sortOrder is valid
  });

  return res.status(200).json(videos);
});

export const updateVideo = catchErrors(async (req, res) => {
  try {
    const id = Number(req.params.videoId);
    const ownerId = req.userId;

    const { title, description, category, privacy, tags } =
      updateVideoSchema.parse(req.body);

    const videoToUpdate = await prisma.video.findUnique({
      where: { id },
      select: {
        ownerId: true,
      },
    });

    if (!videoToUpdate) {
      return res.status(NOT_FOUND).json({ message: "No video found" });
    }

    if (videoToUpdate.ownerId === ownerId) {
      return res
        .status(FORBIDDEN)
        .json({ message: "You are not authorized to update video" });
    }

    let thumbnail: string | undefined;
    if (req.files && "thumbnail" in req.files && req.files["thumbnail"][0]) {
      const thumbnailLocalPath = req.files["thumbnail"][0].path;
      const uploadResult = await uploadOnCloudinary(
        thumbnailLocalPath,
        (progress) => {
          console.log(`Thumbnail upload progress: ${progress.toFixed(2)}%`);
          // You can emit this progress to the client if you're using websockets
          // or store it somewhere to be polled by the client
        }
      );
      if (uploadResult) {
        thumbnail = uploadResult.url;
      } else {
        throw new Error("Failed to upload thumbnail to Cloudinary");
      }
    }

    let video: string | undefined;
    let videoDuration: number | undefined;
    if (req.files && "video" in req.files && req.files["video"][0]) {
      const videoLocalPath = req.files["video"][0].path;
      const uploadResult = await uploadOnCloudinary(
        videoLocalPath,
        (progress) => {
          console.log(`Video upload progress: ${progress.toFixed(2)}%`);
          // You can emit this progress to the client if you're using websockets
          // or store it somewhere to be polled by the client
        }
      );
      if (uploadResult) {
        video = uploadResult.playback_url;
        videoDuration = uploadResult.duration;
      } else {
        throw new Error("Failed to upload video to Cloudinary");
      }
    }

    const uploadedVideo = await updateVideoService({
      id,
      title,
      tags,
      description,
      thumbnail,
      video,
      videoDuration,
      category,
      privacy,
    });

    res.status(200).json(uploadedVideo);
  } catch (error: any) {
    console.error("Error uploading video in catch block:", error);
    res.status(400).json({ error: error.message });
  }
});

export const deleteVideo = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;

  // First, find the video and check if the userId matches the ownerId
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { ownerId: true },
  });

  // If video not found in db
  appAssert(video, NOT_FOUND, "Video not found");

  // If  ownerId doesn't match, throw an error
  if (video.ownerId !== userId) {
    throw new Error("You don't have permission to delete it");
  }

  // If the check passes, proceed with deletion
  await prisma.video.delete({
    where: { id: videoId },
  });

  return res.status(OK).json({ message: "Video Deleted" });
});

export const getChannelVideos = catchErrors(async (req, res) => {
  const { page = 1, limit = 1, sortOrder = "newest" } = req.query;
  const channelId = parseInt(req.params.channelId);
  // const userId = req.userId;

  appAssert(channelId, FORBIDDEN, "You can't access without channel ID");

  // console.log(req.user)
  // Call service function to fetch all channels except user's own channel
  const videos = await getChannelVideosService({
    page: Number(page),
    limit: Number(limit),
    sortOrder: sortOrder === "newest" ? "newest" : "oldest", // Ensure sortOrder is valid
    channelId,
  });

  return res.status(200).json(videos);
});

// User Interactions

import {
  updateWatchHistoryService,
  createPollService,
  votePollService,
} from "../services/video.service";
import { ContentCategory } from "@prisma/client";

export const likeVideo = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;

  if (!userId) {
    throw new Error("You are not authorized to perform this action");
  }

  const isLiked = await toggleLikeVideoService(videoId, userId);

  const message = isLiked
    ? "Video liked successfully"
    : "Video unliked successfully";

  return res.status(OK).json({ message });
});

export const dislikeVideo = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;
  if (!userId) {
    throw new Error("You are not authorized to this");
  }

  const isDisLiked = await toggleDislikeVideoService(videoId, userId);

  const message = isDisLiked
    ? "Video disliked successfully"
    : "Video dislike removed successfully";

  return res.status(OK).json({ message });
});

export const toggleBookmarkVideo = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;
  const time = parseInt(req.body.time);
  if (!userId) {
    throw new Error("You are not authorized to this");
  }
  const response = await toggleBookmarkVideoService(videoId, userId, time);

  const message = response
    ? "Video added to bookmarks"
    : "Video removed from bookmarks";

  return res.status(OK).json({ message });
});

export const updateWatchHistory = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;
  const progress = parseInt(req.body.progress);
  if (!userId) {
    throw new Error("You are not authorized to this");
  }

  await updateWatchHistoryService(videoId, userId, progress);

  return res.status(OK).json({ message: "Watch history updated successfully" });
});

export const createVideoPoll = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;
  const { question, options } = req.body;

  if (!userId) {
    throw new Error("UserId is required");
  }

  if (!question || typeof question !== 'string') {
    throw new Error("Question must be a non-empty string");
  }

  if (!Array.isArray(options) || options.length < 2 || !options.every(opt => typeof opt.text === 'string')) {
    throw new Error("Options must be an array of at least two objects with 'text' property");
  }

  const poll = await createPollService(question, options, userId, videoId);

  return res.status(OK).json({ poll });
});

export const voteVideoPoll = catchErrors(async (req, res) => {
  const pollId = parseInt(req.params.pollId);
  const userId = req.userId;
  const optionId = parseInt(req.body.optionId);
  if (!userId) {
    throw new Error("UserId is required");
  }

  await votePollService(pollId, userId, optionId);

  return res.status(OK).json({ message: "Vote submitted successfully" });
});

export const createUserPoll = catchErrors(async (req, res) => {
  const userId = req.userId;
  const { question, options } = req.body;
  if (!userId) {
    throw new Error("UserId is required");
  }

  const poll = await createPollService(question, options, userId);
  
  return res.status(OK).json({ poll });
});

export const voteUserPoll = catchErrors(async (req, res) => {
  const pollId = parseInt(req.params.pollId);
  const userId = req.userId;
  const optionId = parseInt(req.body.optionId);

  if (!userId) {
    throw new Error("UserId is required");
  }

  await votePollService(pollId, userId, optionId);

  return res.status(OK).json({ message: "Vote submitted successfully" });
});

export const getPollsForFeed = catchErrors(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    videoId,
  } = req.query;

  const userId = req.userId;

  const currentPage = parseInt(page as string);
  const perPage = parseInt(limit as string);

  // Validate the sortBy parameter
  const allowedSortBy = ["createdAt", "votes"];
  if (!allowedSortBy.includes(sortBy as string)) {
    throw new Error("Invalid sortBy parameter");
  }

  const polls = await getPollsForFeedService({
    page: currentPage,
    limit: perPage,
    sortBy: sortBy as "createdAt" | "votes",
    sortOrder: sortOrder as "asc" | "desc",
    videoId: videoId ? parseInt(videoId as string) : undefined,
    userId,
  });

  return res.status(OK).json({ polls });
});

export const searchVideos = catchErrors(async (req, res) => {
  const {
    query,
    page = 1,
    limit = 2,
    sort = "createdAt",
    order = "desc",
    category,
  } = req.query;
  const videos = await searchVideosService(
    query as string,
    Number(page),
    Number(limit),
    sort as string,
    order as "asc" | "desc",
    category as ContentCategory
  );
  return res.status(OK).json(videos);
});

export const searchTitle = catchErrors(async (req, res) => {
  const query = req.query.title ? String(req.query.title) : "";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  req.query.title
    ? console.log(req.query.title)
    : console.log("Kuch Nahi hai ");

  // Use Prisma's built-in search functionality
  const videos = await prisma.video.findMany({
    where: {
      title: {
        contains: query,
        mode: "insensitive", // Case-insensitive search
      },
    },
    select: {
      id: true,
      title: true,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  console.log(videos);

  return res.status(OK).json(videos);
});

export const getTrendingVideos = catchErrors(async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 30;
  const videos = await getTrendingVideosService(Number(page), Number(limit));
  return res.status(OK).json(videos);
});

// export const getRecommendedVideos = catchErrors(async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;
//   const userId = req.userId;
//   if (!userId) {
//     return res.status(UNAUTHORIZED).json({ message: "UNAUTHORIZED" });
//   }

//   const videos = await getRecommendedVideosService(
//     userId,
//     Number(page),
//     Number(limit)
//   );
//   return res.status(OK).json(videos);
// });

export const getVideosByCategory = catchErrors(async (req, res) => {
  const category: string = req.body.category;
  const { page = 1, limit = 10 } = req.query;

  // Validate if the category is a valid ContentCategory
  if (!Object.values(ContentCategory).includes(category as ContentCategory)) {
    return res.status(BAD_REQUEST).json({ error: "Invalid content category" });
  }

  const videos = await getVideosByCategoryService(
    category as ContentCategory,
    Number(page),
    Number(limit)
  );

  return res.status(OK).json(videos);
});

export const getRelatedVideos = catchErrors(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const videos = await getRelatedVideosService(
    Number(videoId),
    Number(page),
    Number(limit)
  );
  return res.status(OK).json(videos);
});

export const getVideoPlaylists = catchErrors(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  appAssert(videoId || videoId === "", NOT_FOUND, "Video Id is necessary");
  const playlists = await getVideoPlaylistsService(
    Number(videoId),
    Number(page),
    Number(limit)
  );
  return res.status(OK).json(playlists);
});

export const getVideosByTag = catchErrors(async (req, res) => {
  const { tags } = req.body;
  const { page = 1, limit = 10 } = req.query;

  if (!tags || !Array.isArray(tags)) {
    throw new Error("Tags must be provided as an array in the request body");
  }

  const videosByTags = await getVideosByAllTags(
    tags,
    Number(page),
    Number(limit)
  );

  res.status(OK).json(videosByTags);
});

export const uploadProgressHandler = catchErrors(async (req, res) => {
  const progress = uploadProgress.get(req.params.uploadId) || 0;
  res.json({ progress });
  console.log(progress);
});

export const logVideoView = catchErrors(async (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;

  if (!userId) {
    throw new Error("Not authorized");
  }

  await logViewService({ videoId, userId });

  return res.status(OK).json({ message: "View logged successfully" });
});
