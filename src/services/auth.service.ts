import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../constants/http";
import VerificationCodeType from "../constants/VerificationCodeType";
import appAssert from "../utils/appAssert";
import {
  fiveMinutesAgo,
  ONE_DAY_MS,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import jwt from "jsonwebtoken";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplates";
import { compareValue, hashValue } from "../utils/bcrypt";
import prisma from "../config/client";
import { Request } from "express";

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: CreateAccountParams) => {
  // Verify existing user does not exist
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  appAssert(!existingUser, CONFLICT, "Email already in use");

  const hashedValue = await hashValue(data.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedValue,
    },
  });

  const userId = user.id;

  // Create verification code
  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId,
      type: "EmailVerification",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Send verification email
  const url = `${APP_ORIGIN}/email/verify/${verificationCode.id}`;
console.log(url)
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  if (error) {
    console.log(error);
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      userId,
      userAgent: data.userAgent,
    },
  });

  // Sign access token & refresh token
  const refreshToken = signToken(
    { sessionId: session.id, ROLE: "VIEWER", userId },
    refreshTokenSignOptions
  );

  const accessToken = signToken({
    userId,
    ROLE: "VIEWER",
    sessionId: session.id,
  });

  // Return user & tokens
  return {
    user: {
      ...user,
      password: undefined, // Omit password
    },
    accessToken,
    refreshToken,
  };
};

export type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  // Get the user by email
  const user = await prisma.user.findUnique({ where: { email } });
  appAssert(user, UNAUTHORIZED, "Invalid email or password");

  // Validate password
  // const isValid = await bcrypt.compare(password, user.password);
  const isValid = await compareValue(password, user.password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  // Create a session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent,
      expiresAt: thirtyDaysFromNow(),
    },
  });

  const sessionInfo = {
    sessionId: session.id,
    ROLE: user.id,
  };


  // Sign access token & refresh token
  const refreshToken = signToken(
    { sessionId: session.id, ROLE: user.role, userId: user.id },
    refreshTokenSignOptions
  );
  // const accessToken = signToken({ ...sessionInfo, userId: user.id });

  const accessToken = signToken({
    ...sessionInfo,
    ROLE: "VIEWER",
    userId: user.id,
  });

  // Return user & tokens
  return {
    user: {
      ...user,
      password: undefined, // Omit password
    },
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (
  req: Request,
  refreshToken: string
) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });

  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  // Fetch the user directly
  const user = await prisma.user.findUnique({
    where: { id: payload.userId as number },
  });

  appAssert(user, UNAUTHORIZED, "User not found");


  // Invalidate all old sessions for this user
  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  // Create a new session
  const newSession = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: thirtyDaysFromNow(),
      userAgent: req.headers["user-agent"]
    },
  });

  const newRefreshToken = signToken(
    {
      userId: user.id,
      sessionId: newSession.id,
      ROLE: user.role,
    },
    refreshTokenSignOptions
  );

  const accessToken = signToken({
    userId: user.id,
    sessionId: newSession.id,
    ROLE: user.role,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: number) => {
  // Get the verification code
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      id: code,
      type: "EmailVerification",
      expiresAt: { gt: new Date() },
    },
  });

  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  // Update user to verified true
  const updatedUser = await prisma.user.update({
    where: { id: validCode.userId },
    data: { verified: true },
  });

  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

  // Delete verification code
  await prisma.verificationCode.delete({
    where: { id: validCode.id },
  });

  // Return user without password
  const { password, ...userWithoutPassword } = updatedUser;
  return {
    user: userWithoutPassword,
  };
};

export const sendPasswordResetEmail = async (email: string) => {
  // Get user by email
  const user = await prisma.user.findUnique({ where: { email } });

  appAssert(user, NOT_FOUND, "User not found");

  // Check email rate limit
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const count = await prisma.verificationCode.count({
    where: {
      userId: user.id,
      type: VerificationCodeType.PasswordReset,
      createdAt: { gt: fiveMinAgo },
    },
  });

  appAssert(
    count <= 1,
    TOO_MANY_REQUESTS,
    "Too many requests, please try again later"
  );

  // Create verification code
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // One hour from now
  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId: user.id,
      type: VerificationCodeType.PasswordReset,
      expiresAt,
    },
  });

  // Send verification email
  const url = `${APP_ORIGIN}/password/reset?code=${
    verificationCode.id
  }&exp=${expiresAt.getTime()}`;

  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });

  appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.message}`);

  // Return url and emailId
  return {
    url,
    emailId: data.id,
  };
};

type ResetPasswordParams = {
  password: string;
  verificationCode: number; // changes to number
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  // Get the verification code
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      id: verificationCode as any,
      type: VerificationCodeType.PasswordReset,
      expiresAt: { gt: new Date() },
    },
  });

  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  // Update the user's password
  const hashedPassword = await hashValue(password);
  const updatedUser = await prisma.user.update({
    where: { id: validCode.userId },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

  // Delete the verification code
  await prisma.verificationCode.delete({
    where: { id: validCode.id },
  });

  // Delete all sessions
  await prisma.session.deleteMany({
    where: { userId: updatedUser.id },
  });

  // Return user without password
  return {
    user: updatedUser,
  };
};
