import { nativeEnum, z } from "zod";
import { ContentCategory, Privacy } from "@prisma/client";

// Helper function to create a Zod enum from a TypeScript enum
function createEnumSchema<T extends string | number>(
  enumObj: Record<string, T>
) {
  const values = Object.values(enumObj) as [T, ...T[]];
  return z.enum(values as unknown as [string, ...string[]]);
}

export const videoUploadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  // tags: z.array(z.string()),
  privacy: z.nativeEnum(Privacy),
  category: z.nativeEnum(ContentCategory),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(155).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  privacy: z.nativeEnum(Privacy),
  category: z.nativeEnum(ContentCategory),
});

// Type assertion for Zod schemas
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
