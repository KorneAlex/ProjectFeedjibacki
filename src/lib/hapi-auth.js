/**
 * Hapi authentication configuration using cookie-based sessions.
 * The `configureSessionAuth` function sets up a cookie authentication strategy named "session".
 * It validates the session by checking for a user ID in the session cookie and fetching the corresponding user from the database.
 * If the session is valid, it attaches the user credentials to the request; otherwise, it redirects to the login page.
 */
import { db } from "../models/db.js";
import { serialize } from "cookie";

const jwtCookieName = () => process.env.JWT_COOKIE_NAME || "access_token";

export function jwtAccessCookieAttrs(token) {
  const maxAge = 15 * 60;
  return serialize(jwtCookieName(), token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearJwtAccessCookie() {
  return serialize(jwtCookieName(), "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}


export async function configureSessionAuth(server) {
  const cookieName = process.env.cookie_name;
  const cookiePassword = process.env.cookie_password;

  server.app.cookieName = cookieName;

  server.auth.strategy("session", "cookie", {
    cookie: {
      name: cookieName,
      password: cookiePassword,
      isSecure: false, // TODO: set to true in production
      path: "/", // I spend 2 days trying to figure out why my cookies didn't work. NO INFORMAITION ONLINE ABOUT PATH USAGE!
    },
    validate: async (request, session) => {
      if (!session || !session.id) {
        return { isValid: false };
      }

      const account = await db.usersStore.getUserById(session.id);
      if (!account) {
        return { isValid: false };
      }

      return { isValid: true, credentials: account };
    },
    redirectTo: "/login",
  });

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

  const jwtCookieName = process.env.JWT_COOKIE_NAME || "access_token";

  server.auth.strategy("jwt", "jwt", {
    key: process.env.JWT_SECRET,
    validate: validateJwt,
    verifyOptions: { algorithms: ["HS256"] },
    cookieKey: jwtCookieName,
  });

  server.auth.default({ strategies: ["session", "jwt"], mode: "required" });
}
