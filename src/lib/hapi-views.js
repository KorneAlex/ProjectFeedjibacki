/**
 * Hapi views configuration
 * This file contains the configuration for setting up Handlebars as the templating engine for Hapi views.
 * The `configureViews` function registers Handlebars as the view engine for files with the ".hbs" extension.
 * It also sets the relative path for views, layouts, and partials, allowing for organized template management.
 */

import Handlebars from "handlebars";

export function configureViews(server, rootDir) {
  server.views({
    engines: {
      hbs: Handlebars,
    },
    relativeTo: rootDir + "/src",
    path: "views",
    layout: true,
    layoutPath: "./views/layouts",
    partialsPath: "./views/partials",
  });
}
