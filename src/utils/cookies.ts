import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/refresh";
const secure = process.env.NODE_ENV !== "development";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // Default to undefined for local development

const defaults: CookieOptions = {
  sameSite: "none", // 'none' as you mentioned using 'None'
  httpOnly: true,
  secure,
  domain: COOKIE_DOMAIN, // Use the COOKIE_DOMAIN environment variable
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
  path: '/', // Ensure the path matches when clearing
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) => {
  console.log('Clearing cookies with options:', {
    path: '/',
    domain: COOKIE_DOMAIN,
    sameSite: 'none',
    secure: true,
  });
  res.clearCookie("accessToken", { path: '/', domain: COOKIE_DOMAIN, sameSite: 'none', secure: true })
     .clearCookie("refreshToken", { path: REFRESH_PATH, domain: COOKIE_DOMAIN, sameSite: 'none', secure: true });
  console.log('Cookies cleared');
  return res;
};
