// db_flow_1.1: server setup with db initialization

import Hapi from "@hapi/hapi";
import Handlebars from "handlebars";
import Cookie from "@hapi/cookie";
import Vision from "@hapi/vision";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import HapiSwagger from "hapi-swagger";
const require = createRequire(import.meta.url); // AI
const Pack = require("./package.json");
const Inert = require('@hapi/inert');



// my modules
import { routes } from "./routes.js";
import { apiRoutes } from "./api-routes.js"
import { db } from "./src/models/db.js";

dotenv.config();

import { initCloudinary } from "./src/lib/cloudinary.js";
// TODO: orginize imports and code in this file. I want to move all additional modules to the lib folder the same as Cloudinary

// https://stackoverflow.com/questions/10736907/handlebars-js-else-if
// https://handlebarsjs.com/playground.html
Handlebars.registerHelper("eq", function (operand1, operand2) {
  // console.log("operand1: " + operand1 + " | " + "operant2: " + operand2);
  if (operand1 === operand2) {
    return true;
  } else {
    return false;
  }
});

// variables
const __dirname = path.resolve();

// Initialize database
await db.init();

initCloudinary();

//server
const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || "localhost",
    routes: {
      files: {
        relativeTo: __dirname,
      },
    },
  });

  const swaggerOptions = {
        info: {
                title: 'NoteOnMap API Documentation',
                version: Pack.version,
            },

  grouping: "tags",

};

  // modules and plugins
  await server.register([
    { plugin: Vision }, 
    { plugin: Inert }, 
    { plugin: Cookie }, 
    {
            plugin: HapiSwagger,
            options: swaggerOptions
    }]);

  // validator
  // server.validate(Joi);

  // hapi Vision configuration for handlebars
  server.views({
    engines: {
      hbs: Handlebars,
    },
    relativeTo: __dirname + "/src",
    path: "views",
    layout: true,
    layoutPath: "./views/layouts",
    partialsPath: "./views/partials",
  });

  // authentication with cookies
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

  server.route(routes);
  server.route(apiRoutes);

  // added by AI during CSS refactoring
  server.route({
    method: "GET",
    path: "/css/{file}.css",
    options: { auth: false },
    handler: async (request, h) => {
      const file = request.params.file;
      if (!/^[a-z0-9-]+$/i.test(file)) {
        return h.response().code(404);
      }
      const filePath = path.join(__dirname, "src", "css", file + ".css");
      try {
        const content = await fs.promises.readFile(filePath, "utf8");
        return h.response(content).type("text/css");
      } catch {
        return h.response().code(404);
      }
    },
  });

  // AI. I could not find how to add my image for points
  server.route({
    method: "GET",
    path: "/src/views/partials/svg/{file}",
    options: { auth: false },
    handler: async (request, h) => {
      const file = request.params.file;
      if (!/^[a-z0-9.-]+$/i.test(file)) {
        return h.response().code(404);
      }
      const filePath = path.join(
        __dirname,
        "src",
        "views",
        "partials",
        "svg",
        file,
      );
      try {
        const content = await fs.promises.readFile(filePath);
        const type = file.endsWith(".png")
          ? "image/png"
          : file.endsWith(".jpg") || file.endsWith(".jpeg")
            ? "image/jpeg"
            : "application/octet-stream";
        return h.response(content).type(type);
      } catch {
        return h.response().code(404);
      }
    },
  });
  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
