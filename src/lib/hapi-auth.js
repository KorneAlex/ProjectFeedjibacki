/**
 * Hapi authentication configuration using JWT.
 * This module defines functions to sign access and refresh tokens for users, manage JWT cookies, 
 * and configure Hapi authentication strategies. 
 * It also includes logic to refresh access tokens using refresh tokens when the access token is missing, invalid, or close to expiry.
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
const sessionCookieName = process.env.SESSION_COOKIE_NAME || "session_id";
const accessTokenExpirySeconds = parseInt(process.env.ACCESS_TOKEN_EXPIRY_SECONDS) || 60;
const refreshTokenExpirySeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRY_SECONDS) || 604800;
const leewaySecondsForAccessToken = parseInt(process.env.LEEWAY_SECONDS_FOR_ACCESS_TOKEN) || 120;

export function signAccessTokenForUser(user) {
  return jwt.sign(
    { id: user._id.toString(), admin: !!user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: accessTokenExpirySeconds },
  );
  }

export function signRefreshTokenForUser(user) {
  return jwt.sign(
    { id: user._id.toString(), admin: !!user.isAdmin },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: refreshTokenExpirySeconds },
  );
}

function replaceAccessTokenInRequestCookieHeader(request, accessCookieName, newToken) {
  const jar = parseCookie(request.headers.cookie || "");
  jar[accessCookieName] = newToken;
  // console.log(Object.entries(jar));
  request.headers.cookie = Object.entries(jar)
    .filter(([, v]) => v != null && String(v).length > 0) // filter out cookies with null/undefined/empty values
    .map(([k, v]) => serialize(k, String(v))) // serialize cookies back to strings like "access_token=newToken"
    .join("; "); // join them with "; " to form the final Cookie header value
}

/**
 * When the access JWT is missing, invalid, or within the refresh leeway of expiry, verify the
 * refresh cookie and re-issue an access JWT. Mutates `request.headers.cookie` so hapi-auth-jwt2
 * (which parses the raw Cookie header) sees the new token during this request.
 */
async function refreshAccessFromCookiesIfNeeded(request) {
  if (!request.headers.cookie) {
    return null;
  }

  const jar = parseCookie(request.headers.cookie);
  // console.log("jar in refreshAccessFromCookiesIfNeeded", jar);
  const accessToken = jar[jwtAccessCookieName];
  const refreshToken = jar[jwtRefreshCookieName];
  if (!refreshToken || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
    return null;
  }
  const leewayMs = leewaySecondsForAccessToken * 1000;
  let shouldRefresh = false;
  if (!accessToken) {
    shouldRefresh = true;
  } else {
    const decoded = jwt.decode(accessToken);
    const expMs = decoded?.exp ? decoded.exp * 1000 : 0;
    if (!expMs) {
      shouldRefresh = true;
    } else if (expMs - Date.now() <= leewayMs) {
      shouldRefresh = true;
    }
  }
  if (!shouldRefresh) {
    return null;
  }
  let decodedRefresh;
  try {
    decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
  const id = decodedRefresh?.id != null ? String(decodedRefresh.id) : null;
  if (!id) {
    return null;
  }
  const user = await db.usersStore.getUserById(id);
  if (!user) {
    return null;
  }
  const newAccessToken = signAccessTokenForUser(user);
  replaceAccessTokenInRequestCookieHeader(request, jwtAccessCookieName, newAccessToken);
  return newAccessToken;
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
    path: "/",
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
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie() {
  return serialize(sessionCookieName, "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

// Configure Hapi authentication strategies
export async function configureSessionAuth(server) {
  // The session cookie strategy is commented out in favor of JWT-based authentication, but the code is left here for reference.
  // const cookieName = process.env.SESSION_COOKIE_NAME;
  // const cookiePassword = process.env.SESSION_COOKIE_PASSWORD;

  // server.app.cookieName = cookieName;

  // server.auth.strategy("session", "cookie", {
  //   cookie: {
  //     name: cookieName,
  //     password: cookiePassword,
  //     isSecure: process.env.NODE_ENV === "production",
  //     isHttpOnly: true,
  //     path: "/", // I spend 2 days trying to figure out why my cookies didn't work. NO INFORMAITION ONLINE ABOUT PATH USAGE!
  //   },
  //   validate: async (request, session) => {
  //     if (!session || !session.id) {
  //       return { isValid: false };
  //     }

  //     const account = await db.usersStore.getUserById(session.id);
  //     if (!account) {
  //       return { isValid: false };
  //     }

  //     return { isValid: true, credentials: account };
  //   },
  //   redirectTo: "/login",
  // });

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

  server.ext("onPreAuth", async (request, h) => {
    if (request.path === "/logout") {
      return h.continue;
    }
    try {
      const newToken = await refreshAccessFromCookiesIfNeeded(request);
      if (newToken) {
        request.app.newAccessJwt = newToken;
      }
    } catch (err) {
      request.server.log(["warn", "jwt-refresh"], err);
    }
    return h.continue;
  });

  server.ext("onPreResponse", (request, h) => {
    if (request.path === "/logout") {
      return h.continue;
    }
    if (request.response.output?.statusCode === 401) {
      return h.redirect("/login?error=unauthorized");
    }
    if (request.app.newAccessJwt && request.response && !request.response.isBoom) {
      request.response.header("set-cookie", jwtAccessCookieAttrs(request.app.newAccessJwt), {
        append: true,
      });
    }
    return h.continue;
  });
}
