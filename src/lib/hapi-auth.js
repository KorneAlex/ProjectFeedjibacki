/**
 * Hapi authentication configuration using cookie-based sessions.
 * The `configureSessionAuth` function sets up a cookie authentication strategy named "session".
 * It validates the session by checking for a user ID in the session cookie and fetching the corresponding user from the database.
 * If the session is valid, it attaches the user credentials to the request; otherwise, it redirects to the login page.
 */

import { db } from "../models/db.js";

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

  server.auth.default("session");
}
