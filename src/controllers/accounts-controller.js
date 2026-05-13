// db_flow_3: uses the initialized stores in controller functions
import { db } from "../models/db.js";
import { signupSchema } from "../models/joi-schema.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");
import { jwtAccessCookieAttrs, clearJwtAccessCookie } from "../lib/hapi-auth.js";

export const accountController = {
  signup: {
    auth: { mode: "try" },
    handler: (request, h) => {
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
      };
      if (request.auth.isAuthenticated) {
        return h.redirect("/");
      }
      return h.view("./pages/signup", {
        title: "signup Page",
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
          .view("./pages/signup", { title: "Signup Page", viewData })
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
        title: "Signup Successful",
        viewData: viewData,
      });
    },
  },

  login: {
    auth: { mode: "try" },
    handler: (request, h) => {
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
      };

      if (request.auth.isAuthenticated) {
        return h.redirect("/");
      }
      return h.view("./pages/login", {
        title: "Login Page",
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
          title: "Login Page",
          viewData: {
            infoMessage: "Invalid credentials. Please try again.",
            infoClass: "has-text-danger",
          },
        });
      }
      request.cookieAuth.set({ id: user._id.toString() });
      try {
        const token = jwt.sign(
          {
            id: user._id.toString(),
            admin: !!user.isAdmin,
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );
        return h
          .redirect("/")
          .header("Set-Cookie", [jwtAccessCookieAttrs(token)]);
      } catch (err) {
        return h.redirect("/");
      }
    },
  },

  logout: {
    handler: (request, h) => {
      request.cookieAuth.clear();
      return h.redirect("/").header("Set-Cookie", clearJwtAccessCookie());
    },
  },
};
