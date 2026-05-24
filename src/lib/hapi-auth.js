/**
 * Hapi authentication configuration using JWT.
 * This module defines functions to sign access and refresh tokens for users, manage JWT cookies, 
 * and configure Hapi authentication strategies. 
 * The refresh_token cookie uses path /auth/refresh so the browser sends it only on that route
 * (after a 401 redirect), not on every request.
 * I kept the session cookie strategy code commented out for reference, but the active authentication strategy is JWT-based.
 */
import { createRequire } from "module";
import { db } from "../models/db.js";
import { serialize, parse as parseCookie } from "cookie";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");

// COOKIES!
const jwtAccessCookieName = process.env.JWT_ACCESS_COOKIE_NAME || "access_token";
const jwtRefreshCookieName = process.env.JWT_REFRESH_COOKIE_NAME || "refresh_token";
/** Browser sends refresh_token only for requests under this path (see Set-Cookie Path). */
export const jwtRefreshCookiePath = "/auth/refresh";
const accessTokenExpirySeconds = parseInt(process.env.ACCESS_TOKEN_EXPIRY_SECONDS) || 60;
const refreshTokenExpirySeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRY_SECONDS) || 604800;

export function signAccessTokenForUser(user) {
  const isAdmin = user.metadata?.isAdmin ?? user.isAdmin;
  return jwt.sign(
    { id: user._id.toString(), admin: !!isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: accessTokenExpirySeconds },
  );
  }

/** Guest share link JWT (`user_id`, `item_id`, `access: guest`). */
export function signShareTokenForItem({ userId, itemId }) {
  return jwt.sign(
    { user_id: userId, item_id: itemId, access: "guest" },
    process.env.JWT_SECRET
  );
}

/** Returns decoded share payload or `null` when invalid/expired. */
export function verifyShareToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return null;
  }
}

export function signRefreshTokenForUser(user) {
  const isAdmin = user.metadata?.isAdmin ?? user.isAdmin;
  return jwt.sign(
    { id: user._id.toString(), admin: !!isAdmin },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: refreshTokenExpirySeconds },
  );
}

/** Read refresh JWT from the raw Cookie header (sent only on /auth/refresh due to cookie Path). */
export function getRefreshTokenFromRequest(request) {
  const jar = parseCookie(request.headers.cookie || "");
  return jar[jwtRefreshCookieName];
}

export function jwtAccessCookieAttrs(token) {
  const maxAge = accessTokenExpirySeconds;
  return serialize(jwtAccessCookieName, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
}

export function jwtRefreshCookieAttrs(token) {
  const maxAge = refreshTokenExpirySeconds;
  return serialize(jwtRefreshCookieName, token, {
    path: jwtRefreshCookiePath,
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearJwtAccessCookie() {
  return serialize(jwtAccessCookieName, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearJwtRefreshCookie() {
  return serialize(jwtRefreshCookieName, "", {
    path: jwtRefreshCookiePath,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

// AI Help /** Build /auth/refresh?next=... for use after 401 on a page route. */
export function authRefreshRedirectUrl(request) {
  const path = request.path;
  const search = request.url?.search || "";
  const returnTo = `${path}${search}`;
  // console.log("path: ", path);
  // console.log("search: ", search);
  // console.log("returnTo: ", returnTo);
  return `/auth/refresh?next=${encodeURIComponent(returnTo)}`;
}

// Configure Hapi authentication strategies
export async function configureJwtAuth(server) {
  // https://www.npmjs.com/package/hapi-auth-jwt2 + some AI help I spent good 10 hours trying to figure out it by myself
  // it's good to have the SETU course instructions but we will not have any instructions in real life so I prefer to learn how to do things by myself, even if it takes more time
  const validateJwt = async (decoded, request, h) => {
    const id = decoded?.id != null ? String(decoded.id) : null;
    if (!id) {
      return { isValid: false };
    }
    const user = await db.usersStore.getUserById(id);
    if (!user) {
      return { isValid: false };
    }
    return { isValid: true, credentials: user };
  };


  server.auth.strategy("jwt", "jwt", {
    key: process.env.JWT_SECRET,
    validate: validateJwt,
    verifyOptions: { algorithms: ["HS256"] },
    cookieKey: jwtAccessCookieName,
    path: "/",
    redirectTo: "/login",
  },
  );

  // server.auth.default({ strategies: ["session", "jwt"], mode: "required" });
  server.auth.default({ strategies: ["jwt"], mode: "required" });

  server.ext("onPreResponse", (request, h) => {
    const statusCode =
      request.response?.output?.statusCode ?? request.response?.statusCode;
    if (statusCode !== 401) {
      return h.continue;
    }

    if (request.path === "/auth/refresh") {
      return h
        .redirect("/login?error=unauthorized")
        .header("Set-Cookie", [clearJwtAccessCookie(), clearJwtRefreshCookie()])
        .takeover();
    }

    if (!request.path.startsWith("/api/")) {
      return h.redirect(authRefreshRedirectUrl(request)).takeover();
    }

    return h.continue;
  });
}
