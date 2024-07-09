import { z } from "zod";

export const updateUserProfileSchema = z.object({
  username: z.string().min(1).max(20).optional(),
  //avatar: z.string().url().optional(),
  //TODO: Modify the profile image for a image
  // avatar: z.string().optional(),

  bio: z.string().optional(),
});
