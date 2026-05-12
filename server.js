import Hapi from "@hapi/hapi";
import dotenv from "dotenv";
import path from "path";
import { apiRoutes } from "./api-routes.js";
import { routes } from "./routes.js";
import { db } from "./src/models/db.js";
import { configureSessionAuth } from "./src/lib/hapi-auth.js";
import { registerHapiPlugins } from "./src/lib/hapi-plugins.js";
import { registerStaticRoutes } from "./src/lib/hapi-static-routes.js";
import { configureViews } from "./src/lib/hapi-views.js";
import { registerHandlebarsHelpers } from "./src/lib/handlebars-helpers.js";
import { initCloudinary } from "./src/lib/cloudinary.js";

// Load environment variables from .env file
dotenv.config();

// Resolving the directory name for static file serving
const __dirname = path.resolve();

// Register Handlebars helpers
registerHandlebarsHelpers();

// Initialize the database
await db.init();

// Initialize Cloudinary (images store)
initCloudinary();

// Setup the Hapi server
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

  // Register Hapi plugins, configure views and session authentication
  await registerHapiPlugins(server);
  configureViews(server, __dirname);
  await configureSessionAuth(server);

  // Register routes
  server.route(routes);
  server.route(apiRoutes);
  registerStaticRoutes(server, __dirname);

  // Start the server
  await server.start();
  console.log("Server running on %s", server.info.uri);
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
