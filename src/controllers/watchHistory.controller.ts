import { Request, Response } from "express";
import catchErrors from "../utils/catchErrors";
import { OK, CREATED, NOT_FOUND } from "../constants/http";
import {
  createOrUpdateWatchHistory,
  deleteWatchHistory,
  getWatchHistory,
  getWatchHistoryById,
  clearAllWatchHistory,
} from "../services/watchHistory.services";
import {
  watchHistoryIdSchema,
  watchHistorySchema,
} from "../validations/watchHistory.validation";

export const getWatchHistoryHandler = catchErrors(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getWatchHistory({ userId, page, limit });
    return res.status(OK).json(result);
  }
);

export const getWatchHistoryByIdHandler = catchErrors(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const id = watchHistoryIdSchema.parse(parseInt(req.params.watchHistoryId));

    const watchHistory = await getWatchHistoryById(id, userId);
    return res.status(OK).json(watchHistory);
  }
);

export const createOrUpdateWatchHistoryHandler = catchErrors(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const videoId = parseInt(req.params.videoId);
    const { progress } = watchHistorySchema.parse(req.body);

    const watchHistory = await createOrUpdateWatchHistory({
      userId,
      videoId,
      progress,
    });
    return res.status(CREATED).json(watchHistory);
  }
);

export const deleteWatchHistoryHandler = catchErrors(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const id = watchHistoryIdSchema.parse(parseInt(req.params.watchHistoryId));

    await deleteWatchHistory(id, userId);
    return res.status(NOT_FOUND).send();
  }
);

export const clearAllWatchHistoryHandler = catchErrors(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    await clearAllWatchHistory(userId);
    return res.status(NOT_FOUND).send();
  }
);