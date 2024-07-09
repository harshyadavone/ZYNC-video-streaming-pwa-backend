import { Request, Response } from "express";
import prisma from "../config/client";
import { BAD_REQUEST, NOT_FOUND, OK, UNAUTHORIZED } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import appAssert from "../utils/appAssert";
import { incrementCommentCount } from "../services/comment.service";

// Interfaces
interface User {
  id: number;
  username: string | null;
  avatar: string | null;
}

interface CommentCount {
  replies: number;
}

interface BaseComment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  dislikes: number;
  userId: number;
  videoId: number;
  parentId: number | null;
  replyToUsername?: string | null;
  user: User;
  _count: CommentCount;
}

interface CommentWithReplies extends BaseComment {
  replies: CommentWithReplies[];
}

// Controller functions
export const getComments = catchErrors(async (req: Request, res: Response) => {
  const videoId = parseInt(req.params.videoId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

  const comments: BaseComment[] = await prisma.comment.findMany({
    where: {
      videoId,
      parentId: null, // Only fetch top-level comments
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  const totalComments = await prisma.comment.count({
    where: {
      videoId,
      parentId: null,
    },
  });

  console.log(totalComments)

  const response = {
    comments,
    totalComments,
    pagination: {
      total: totalComments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page,
      limit,
    },
  };
console.log("✔✔🚩",response)
  return res.status(OK).json(response);
});

export const addComment = catchErrors(async (req: Request, res: Response) => {
  const videoId = parseInt(req.params.videoId);
  const userId = req.userId;
  const { content, parentId, replyToUsername } = req.body;
  console.log("Received comment data:", req.body);
  // console.log(replyToUsername)


  if (!userId) {
    return res.status(UNAUTHORIZED).json({ message: "User not authenticated" });
  }

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    appAssert(parentComment, BAD_REQUEST, "Parent comment not found");
  }

  const processedContent = await processUserTags(content);

  const comment = await prisma.comment.create({
    data: {
      content: processedContent,
      userId,
      videoId,
      parentId,
      replyToUsername,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  console.log("Created comment:", comment);


  if (!parentId) {
    await incrementCommentCount(videoId);
  }

  return res.status(OK).json(comment);
});

export const updateComment = catchErrors(
  async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const userId = req.userId;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    appAssert(comment, NOT_FOUND, "Comment not found");
    appAssert(
      comment.userId === userId,
      UNAUTHORIZED,
      "Not authorized to update this comment"
    );

    const processedContent = await processUserTags(content);

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: processedContent },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(OK).json(updatedComment);
  }
);

export const deleteComment = catchErrors(
  async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const userId = req.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    appAssert(comment, NOT_FOUND, "Comment not found");
    appAssert(
      comment.userId === userId,
      UNAUTHORIZED,
      "Not authorized to delete this comment"
    );

    // Delete the comment and all its replies
    await prisma.comment.deleteMany({
      where: {
        OR: [{ id: commentId }, { parentId: commentId }],
      },
    });

    return res
      .status(OK)
      .json({ message: "Comment and its replies deleted successfully" });
  }
);

export const getReplies = catchErrors(async (req: Request, res: Response) => {
  const commentId = parseInt(req.params.commentId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  console.log("Fetching replies for comment:", req.params.commentId);

  const replies = await prisma.comment.findMany({
    where: {
      parentId: commentId,
    },
    orderBy: {
      createdAt: "asc",
    },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  const totalReplies = await prisma.comment.count({
    where: {
      parentId: commentId,
    },
  });

  const response = {
    replies,
    pagination: {
      total: totalReplies,
      totalPages: Math.ceil(totalReplies / limit),
      currentPage: page,
      limit,
    },
  };
  console.log("Sending replies:", response);

  return res.status(OK).json(response);
});

export const likeComment = catchErrors(async (req: Request, res: Response) => {
  const commentId = parseInt(req.params.commentId);
  const userId = req.userId;

  if (!userId) {
    return res.status(UNAUTHORIZED).json({ message: "User not authenticated" });
  }

  const existingReaction = await prisma.commentReaction.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  if (existingReaction) {
    if (existingReaction.type === "LIKE") {
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });
      await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } },
      });
    } else {
      await prisma.commentReaction.update({
        where: { id: existingReaction.id },
        data: { type: "LIKE" },
      });
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: { increment: 1 },
          dislikes: { decrement: 1 },
        },
      });
    }
  } else {
    await prisma.commentReaction.create({
      data: {
        userId,
        commentId,
        type: "LIKE",
      },
    });
    await prisma.comment.update({
      where: { id: commentId },
      data: { likes: { increment: 1 } },
    });
  }

  const updatedComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { likes: true, dislikes: true },
  });

  return res.status(OK).json(updatedComment);
});

export const dislikeComment = catchErrors(
  async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(UNAUTHORIZED)
        .json({ message: "User not authenticated" });
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.type === "DISLIKE") {
        await prisma.commentReaction.delete({
          where: { id: existingReaction.id },
        });
        await prisma.comment.update({
          where: { id: commentId },
          data: { dislikes: { decrement: 1 } },
        });
      } else {
        await prisma.commentReaction.update({
          where: { id: existingReaction.id },
          data: { type: "DISLIKE" },
        });
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            likes: { decrement: 1 },
            dislikes: { increment: 1 },
          },
        });
      }
    } else {
      await prisma.commentReaction.create({
        data: {
          userId,
          commentId,
          type: "DISLIKE",
        },
      });
      await prisma.comment.update({
        where: { id: commentId },
        data: { dislikes: { increment: 1 } },
      });
    }

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { likes: true, dislikes: true },
    });

    return res.status(OK).json(updatedComment);
  }
);

export const getCommentReaction = catchErrors(
  async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(UNAUTHORIZED)
        .json({ message: "User not authenticated" });
    }

    const reaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    return res.status(OK).json({ reaction: reaction ? reaction.type : null });
  }
);

// Helper functions
async function fetchRepliesRecursively(
  parentId: number,
  depth: number,
  page: number,
  limit: number
): Promise<CommentWithReplies[]> {
  if (depth === 0) return [];

  const replies = (await prisma.comment.findMany({
    where: {
      parentId,
    },
    orderBy: {
      createdAt: "asc",
    },
    skip: depth === 1 ? (page - 1) * limit : 0,
    take: depth === 1 ? limit : undefined,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })) as CommentWithReplies[];

  for (const reply of replies) {
    reply.replies = await fetchRepliesRecursively(
      reply.id,
      depth - 1,
      1,
      limit
    );
  }

  return replies;
}

async function processUserTags(content: string): Promise<string> {
  const tagRegex = /@(\w+)/g;
  const tags = content.match(tagRegex) || [];

  for (const tag of tags) {
    const username = tag.slice(1);
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      content = content.replace(tag, `@[${user.username}](${user.id})`);
    }
  }

  return content;
}

export default {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  getReplies,
  likeComment,
  dislikeComment,
  getCommentReaction,
};
