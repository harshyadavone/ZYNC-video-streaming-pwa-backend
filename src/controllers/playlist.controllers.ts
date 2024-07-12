import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import {
  createPlaylistSchema,
  updatePlaylistSchema,
} from "../validations/playlist.validation";
import {
  addVideoToChannelPlaylistService,
  addVideoToPlaylistService,
  createPlaylistService,
  getChannelPlaylistsService,
  getPlaylistByIdService,
  getUserPlaylistsService,
  isVideoInPlaylistService,
  removeVideoFromPlaylistService,
  updatePlaylistService,
} from "../services/playlist.services";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, OK, UNAUTHORIZED } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";
import prisma from "../config/client";

export const createPlaylist = catchErrors(async (req, res) => {
  // Validate the request body
  const validatedData = createPlaylistSchema.parse(req.body);

  const ownerId = req.userId;
  const channelId = Number(req.body.channelId);

  appAssert(
    ownerId,
    UNAUTHORIZED,
    "You are not authorized",
    AppErrorCode.InvalidAccessToken
  );

  const { name, description, privacy } = validatedData;

  // Create the playlist using the service
  const playlist = await createPlaylistService(
    name,
    description,
    privacy,
    ownerId,
    channelId
  );

  res.status(201).json(playlist);
});

export const updatePlaylist = catchErrors(
  async (req: Request, res: Response) => {
    // Validate the request body
    const validatedData = updatePlaylistSchema.parse(req.body);

    const userId = req.userId;
    const playlistId = parseInt(req.params.id);

    appAssert(
      userId,
      UNAUTHORIZED,
      "You are not authorized",
      AppErrorCode.InvalidAccessToken
    );

    const { name, description, privacy } = validatedData;

    // Update the playlist using the service
    const updatedPlaylist = await updatePlaylistService(
      playlistId,
      name,
      description,
      privacy,
      userId
    );

    appAssert(updatedPlaylist, NOT_FOUND, "Playlist not found");

    res.status(200).json(updatedPlaylist);
  }
);

export const deletePlaylist = catchErrors(async (req, res) => {
  const id = parseInt(req.params.id);

  const playlist = await prisma.playlist.findFirst({
    where: { id },
  });

  appAssert(playlist, NOT_FOUND, "Playlist Not Found");

  // Delete the playlist
  const updatedPlaylist = await prisma.playlist.delete({
    where: { id },
  });

  res.status(200).json({ message: "Playlist deleted" });
});

export const getChannelPlaylists = catchErrors(async (req, res) => {
  const { page = 1, limit = 1, sortOrder = "newest" } = req.query;
  const channelId = parseInt(req.params.channelId);
  // page: Number(page),
  // limit: Number(limit),

  // Call service function to fetch all playlists
  const playlists = await getChannelPlaylistsService({
    channelId,
    page: Number(page),
    limit: Number(limit),
    sortOrder: sortOrder === "newest" ? "newest" : "oldest", // Ensure sortOrder is valid
  });

  return res.status(200).json(playlists);
});

// /users/:userId/private-playlists
export const getUserPrivatePlaylists = catchErrors(async (req, res) => {
  const { page = 1, limit = 10, sortOrder = "newest" } = req.query;

  const ownerId = req.userId;

  appAssert(ownerId, UNAUTHORIZED, "You are not authorized to this task");

  // Call service function to fetch all playlists
  const playlists = await getUserPlaylistsService({
    ownerId,
    page: Number(page),
    limit: Number(limit),
    sortOrder: sortOrder === "newest" ? "newest" : "oldest", // Ensure sortOrder is valid
  });

  return res.status(200).json(playlists);
});

// /playlists/:id

export const getPlaylistById = catchErrors(async (req, res) => {
  const playlistId = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  appAssert(playlistId, NOT_FOUND, "Id not found");

  const result = await getPlaylistByIdService({
    playlistId,
    page,
    limit,
  });

  if (!result) {
    return res.status(404).json({ message: "Playlist not found" });
  }

  return res.status(200).json(result);
});

export const addVideoToPlaylist = catchErrors(async (req, res) => {

  const playlistId = parseInt(req.params.playlistId)
  const videoId = parseInt(req.body.videoId)

  const response = await addVideoToPlaylistService(playlistId, videoId)

  res.status(OK).json(response)
});

export const removeVideoFromPlaylist = catchErrors(async (req, res) => {

  const playlistId = parseInt(req.params.playlistId)
  const videoId = parseInt(req.params.videoId)

  const response = await removeVideoFromPlaylistService(playlistId, videoId)


  res.status(OK).json(response)
});


export async function isVideoInPlaylist(req: Request, res: Response) {
  const playlistId = parseInt(req.params.playlistId);
  const videoId = parseInt(req.params.videoId);

  try {
    const isInPlaylist = await isVideoInPlaylistService(playlistId, videoId);
    res.json({ isInPlaylist });
  } catch (error) {
    console.error("Error in isVideoInPlaylist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


export const addVideoToChannelPlaylist = catchErrors(async (req, res) => {

  const playlistId = parseInt(req.params.playlistId)
  const videoId = parseInt(req.params.videoId)
  const channelId = parseInt(req.params.channelId)
  console.log('====================================');
  console.log("Video ID", videoId);
  console.log("Channel ID", channelId);
  console.log("Playlist ID", playlistId);
  console.log('====================================');

  const response = await addVideoToChannelPlaylistService(playlistId, videoId, channelId)

  res.status(OK).json(response)
});