import { Privacy } from '@prisma/client';
import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  privacy: z.nativeEnum(Privacy).optional(),
});