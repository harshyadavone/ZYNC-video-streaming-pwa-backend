// controllers/channelController.js

import prisma from "../config/client";
import { BAD_REQUEST, CREATED, NOT_FOUND, UNAUTHORIZED } from "../constants/http";
import {
  createChannel,
  getAllChannels,
  getChannel,
  getMyChannel,
  updateChannel,
} from "../services/channel.service";
import catchErrors from "../utils/catchErrors";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { setAuthCookies } from "../utils/cookies";
import { refreshTokenSignOptions, signToken } from "../utils/jwt";
import {
  createChannelSchema,
  updateChannelSchema,
} from "../validations/channel.validation";

export const createChannelHandler = catchErrors(async (req, res) => {
  try {
    const { name, description, slug } = req.body;
    const ownerId = req.userId;

    // Check if user is authorized
    if (!ownerId) {
      return res
        .status(UNAUTHORIZED)
        .json({ message: "Unauthorized to make a request" });
    }

    // Handle file uploads for channelProfileImage
    let channelProfileImage: string | undefined;
    if (
      req.files &&
      "channelProfileImage" in req.files &&
      req.files["channelProfileImage"][0]
    ) {
      const channelProfileImageLocalPath =
        req.files["channelProfileImage"][0].path;
      const uploadResult = await uploadOnCloudinary(
        channelProfileImageLocalPath
      );
      if (uploadResult) {
        channelProfileImage = uploadResult.url;
      } else {
        throw new Error("Failed to upload channel profile image to Cloudinary");
      }
    }

    // Handle file uploads for bannerImage
    let bannerImage: string | undefined;
    if (
      req.files &&
      "bannerImage" in req.files &&
      req.files["bannerImage"][0]
    ) {
      const bannerImageLocalPath = req.files["bannerImage"][0].path;
      const uploadResult = await uploadOnCloudinary(bannerImageLocalPath);
      if (uploadResult) {
        bannerImage = uploadResult.url;
      } else {
        throw new Error("Failed to upload banner image to Cloudinary");
      }
    }

    // Create the channel with uploaded image URLs
    const channel = await createChannel({
      name,
      description,
      ownerId,
      slug,
      channelProfileImage: channelProfileImage || "",
      bannerImage: bannerImage || "",
    });


    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    const session = await prisma.session.create({
      data: {
        userId: ownerId,
        userAgent: req.headers["user-agent"],
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const refreshToken = signToken(
      { sessionId: session.id, ROLE: user.role, userId: user.id },
      refreshTokenSignOptions
    );

    const accessToken = signToken({
      userId: ownerId,
      sessionId: session.id,
      ROLE: user.role,
    });

    // res.status(201).json({
    //   channel,
    //   accessToken,
    //   refreshToken,
    // });

    // return setAuthCookies({ res : channel, accessToken, refreshToken })

    return setAuthCookies({ res, accessToken, refreshToken })
      .status(CREATED)
      .json(channel);
    // res.status(201).json(channel);
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(400).json({ error: (error as Error).message });
  }
});

export const updateChannelHandler = catchErrors(async (req, res) => {
  try {
    const ownerId = Number(req.userId);

    const { name, description, slug } = updateChannelSchema.parse(req.body);

    const channel = await prisma.channel.findFirst({
      where: {
        ownerId,
      },
    });

    if(!channel){
      return res.status(404).json(NOT_FOUND)
    }

    // Handle file uploads for channelProfileImage
    let channelProfileImage: string | undefined;
    if (
      req.files &&
      "channelProfileImage" in req.files &&
      req.files["channelProfileImage"][0]
    ) {
      const channelProfileImageLocalPath =
        req.files["channelProfileImage"][0].path;
      const uploadResult = await uploadOnCloudinary(
        channelProfileImageLocalPath
      );
      if (uploadResult) {
        channelProfileImage = uploadResult.url;
      } else {
        throw new Error("Failed to upload channel profile image to Cloudinary");
      }
    }

    // Handle file uploads for bannerImage
    let bannerImage: string | undefined;
    if (
      req.files &&
      "bannerImage" in req.files &&
      req.files["bannerImage"][0]
    ) {
      const bannerImageLocalPath = req.files["bannerImage"][0].path;
      const uploadResult = await uploadOnCloudinary(bannerImageLocalPath);
      if (uploadResult) {
        bannerImage = uploadResult.url;
      } else {
        throw new Error("Failed to upload banner image to Cloudinary");
      }
    }

    if (
      !name &&
      !description &&
      !slug &&
      !channelProfileImage &&
      !bannerImage
    ) {
      return res
        .status(BAD_REQUEST)
        .json({ error: "At least one field must be provided for update" });
    }

    const updatedChannel = await updateChannel({
      id :channel?.id,
      name,
      description,
      slug,
      channelProfileImage,
      bannerImage,
    });

    res.status(200).json(updatedChannel);
  } catch (error: any) {
    console.error("Error updating channel:", error);
    res.status(400).json({ error: error.message });
  }
});

export const deleteChannelHandler = catchErrors(async (req, res) => {
  try {
    const id = Number(req.userId);

    const deletedChannel = await updateChannel({
      id,
    });

    res.status(200).json(deletedChannel);
  } catch (error: any) {
    console.error("Error updating channel:", error);
    res.status(400).json({ error: error.message });
  }
});

export const getMyChannelHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  // service function to get user's channel
  const channel = await getMyChannel(userId);

  return res.status(200).json(channel);
});

export const getChannelHandler = catchErrors(async (req, res) => {

  const channelId = parseInt(req.params.channelId)
  console.log(channelId)
  // Call service function to get channel by id
  const channel = await getChannel(channelId);

  return res.status(200).json(channel);
});

export const getAllChannelsHandler = catchErrors(async (req, res) => {
  const { page = 1, limit = 1 } = req.query;
  const userId = req.userId;

  // console.log(req.user)
  // Call service function to fetch all channels except user's own channel
  const channels = await getAllChannels({
    userId,
    page: Number(page),
    limit: Number(limit),
  });

  return res.status(200).json(channels);
});
