import { z } from "zod";
import { NOT_FOUND, OK } from "../constants/http";
import prisma from "../config/client"; // Assuming you have a Prisma client configuration file
import catchErrors from "../utils/catchErrors";
import appAssert from "../utils/appAssert";

// Get sessions handler using Prisma
export const getSessionHandler = catchErrors(async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: {
      userId: req.userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      userAgent: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mappedSessions = sessions.map((session) => ({
    ...session,
    isCurrent: session.id === req.sessionId,
  }));

  return res.status(OK).json(mappedSessions);
});

// Delete session handler using Prisma
export const deleteSessionHandler = catchErrors(async (req, res) => {
  const id = parseInt(req.params.id)
  const sessionId = z.number().parse(id);

  const deletedSession = await prisma.session.deleteMany({
    where: {
      id: sessionId ,
      userId: req.userId,
    },
  });

  appAssert(deletedSession.count > 0, NOT_FOUND, "Session not found");

  return res.status(OK).json({
    message: "Session removed",
  });
});
