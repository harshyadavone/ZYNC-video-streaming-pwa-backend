import { RequestHandler } from "express";
import { UNAUTHORIZED } from "../constants/http";
import prisma from "../config/client";
import { clearAuthCookies } from "../utils/cookies";

const validateSession: RequestHandler = async (req, res, next) => {
  const sessionId = req.sessionId;

  // Check if the session exists in the database
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    clearAuthCookies(res);
    return res.status(UNAUTHORIZED).json({
      message: "Session expired or invalid. Please log in again.",
    });
  }

  next();
};

export default validateSession;
