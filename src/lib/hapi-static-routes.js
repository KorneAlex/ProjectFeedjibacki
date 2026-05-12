/**
 * Hapi static routes configuration
 * This file defines the static routes for serving CSS files and SVG images.
 * The `registerStaticRoutes` function registers two routes:
 * 1. A route for serving CSS files from the "src/css" directory.
 * 2. A route for serving SVG and image files from the "src/views/partials/svg" directory.
 * Both routes validate the requested file name to prevent directory traversal attacks and return a 404 response if the file is not found or invalid.
 */

import fs from "fs";
import path from "path";

export function registerStaticRoutes(server, rootDir) {
  server.route({
    method: "GET",
    path: "/css/{file}.css",
    options: { auth: false },
    handler: async (request, h) => {
      const file = request.params.file;
      if (!/^[a-z0-9-]+$/i.test(file)) {
        return h.response().code(404);
      }
      const filePath = path.join(rootDir, "src", "css", file + ".css");
      try {
        const content = await fs.promises.readFile(filePath, "utf8");
        return h.response(content).type("text/css");
      } catch {
        return h.response().code(404);
      }
    },
  });

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
        rootDir,
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
}
