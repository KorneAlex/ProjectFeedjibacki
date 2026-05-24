// db_flow_3: uses the initialized stores in controller functions
import { createRequire } from "module";
import { db } from "../models/db.js";
import { signupSchema } from "../models/joi-schema.js";
import {
  jwtAccessCookieAttrs,
  clearJwtAccessCookie,
  jwtRefreshCookieAttrs,
  clearJwtRefreshCookie,
  signAccessTokenForUser,
  signRefreshTokenForUser,
  getRefreshTokenFromRequest,
} from "../lib/hapi-auth.js";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");

export const accountController = {
  signup: {
    auth: { strategy: "jwt", mode: "try" },
    handler: (request, h) => {
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
      };
      if (request.auth.isAuthenticated) {
        return h.redirect("/");
      }
      return h.view("./pages/signup", {
        title: "Sign up",
        viewData: viewData,
      });
    },
  },

  signupSubmit: {
    auth: false,
    validate: {
      payload: signupSchema,
      failAction: (request, h, err) => {
        const viewData = {
          isAuthenticated: request.auth.isAuthenticated,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };
        return h
          .view("./pages/signup", { title: "Sign up", viewData })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const {payload} = request;
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
        infoMessage: "Signup successful! Please log in.",
        infoClass: "has-text-success",
      };
      await db.usersStore.addUser(payload);
      return h.view("./pages/login", {
        title: "Sign up successful",
        viewData: viewData,
      });
    },
  },

  login: {
    auth: { strategy: "jwt", mode: "try" },
    handler: (request, h) => {
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
      };
      if (request.auth.isAuthenticated) {
        return h.redirect("/");
      }
      return h.view("./pages/login", {
        title: "Log in",
        viewData: viewData,
      });
    },
  },

  // TODO: add anti-sql injection (Joi) to loginSubmit and signupSubmit
  loginSubmit: {
    auth: false,
    handler: async (request, h) => {
      const { emailOrUsername, password } = request.payload;
      const user = await db.usersStore.credentialsCheck(emailOrUsername, emailOrUsername, password);
      if (!user) {
        return h.view("./pages/login", {
          title: "Log in",
          viewData: {
            infoMessage: "Invalid credentials. Please try again.",
            infoClass: "has-text-danger",
          },
        });
      }
      try {
        const token = signAccessTokenForUser(user);
        const refreshToken = signRefreshTokenForUser(user);
        return h
          .redirect("/")
          .header("Set-Cookie", [jwtAccessCookieAttrs(token), jwtRefreshCookieAttrs(refreshToken)]);
      } catch (err) {
        console.error("Error signing tokens:", err);
        return h.redirect("/");
      }
    },
  },

  logout: {
    handler: (request, h) => {
      return h.redirect("/").header("Set-Cookie", [clearJwtAccessCookie(), clearJwtRefreshCookie()]);
    },
  },

  refreshToken: {
    auth: false,
    handler: async (request, h) => {
      const refreshToken = getRefreshTokenFromRequest(request);
      if (!refreshToken) {
        return h.response({ error: "No refresh token provided" }).code(401);
      }
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await db.usersStore.getUserById(decoded.id);
        if (!user) {
          return h.response({ error: "User not found" }).code(404);
        }
        const newAccessToken = signAccessTokenForUser(user);
        const newRefreshToken = signRefreshTokenForUser(user);
        const next = request.query.next;
        const redirectTo =
          typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
            ? next
            : "/";
        return h
          .redirect(redirectTo)
          .header("Set-Cookie", [jwtAccessCookieAttrs(newAccessToken), jwtRefreshCookieAttrs(newRefreshToken)]);
      } catch (err) {
        console.error("Error refreshing token:", err);
        return h.response({ error: "Invalid refresh token" }).code(401);
      }
    },
  }
};
