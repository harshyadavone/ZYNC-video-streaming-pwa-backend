// validations/channel.validation.js

import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug can't be empty")
  .max(100, "Slug is too long (max 100 characters)")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug can only contain lowercase letters, numbers, and hyphens, and can't start or end with a hyphen"
  )
  .transform((val) => val.toLowerCase());

// Schema for creating a channel
export const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  slug: slugSchema,
  //TODO: handle images
  bannerImage: z.string().min(1).max(255).optional(),
  channelProfileImage: z.string().optional(),
});

// Schema for updating a channel
export const updateChannelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  slug: slugSchema.optional(),
  //TODO: handle bannerImage differently
  bannerImage: z.string().min(1).max(255).optional(),
  channelProfileImage: z.string().optional(),
});
