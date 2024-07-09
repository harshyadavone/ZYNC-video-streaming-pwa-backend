import catchErrors from "../utils/catchErrors";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from "../utils/cookies";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import appAssert from "../utils/appAssert";
import prisma from "../config/client";
import { Request } from "express";

export const registerHandler = catchErrors(async (req, res, next) => {
  // validate request
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // call service
  const { user, accessToken, refreshToken } = await createAccount(request);

  // return response
  return setAuthCookies({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken } = await loginUser(request);

  return setAuthCookies({ res, accessToken, refreshToken }).status(OK).json({
    message: "Login successfull",
  });
});

export const logoutHandler = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  const { payload } = verifyToken(accessToken || "");

  if (payload && payload.sessionId) {
    await prisma.session.delete({
      where: {
        id: payload.sessionId as number,
      },
    });
  }

  return clearAuthCookies(res).status(OK).json({
    message: "Logout successful",
  });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  

  appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

  const { accessToken, newRefreshToken } = await refreshUserAccessToken(
    req as Request,
    refreshToken
  );

  if (refreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }

  return res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .json({
      message: "Access token refreshed",
    });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const code = parseInt(req.params.code);
  const verificationCode = verificationCodeSchema.parse(code);

  await verifyEmail(verificationCode);

  return res.status(OK).json({
    message: "Email successfully verified",
  });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  // service
  await sendPasswordResetEmail(email);

  return res.status(OK).json({
    message: "Password reset email sent",
  });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  const { verificationCode, ...otherData } = req.body;
  const parsedVerificationCode = parseInt(verificationCode);
  const completeData = {
    ...otherData,
    verificationCode: parsedVerificationCode,
  };
  const request = resetPasswordSchema.parse(completeData);

  await resetPassword(request);

  return clearAuthCookies(res).status(OK).json({
    message: "Password reset successfull",
  });
});
