/**
 * Hapi plugins registration
 * This file contains the configuration for registering Hapi plugins.
 */

import Cookie from "@hapi/cookie";
import HapiSwagger from "hapi-swagger";
import Inert from "@hapi/inert";
import Vision from "@hapi/vision";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Pack = require("../../package.json");


export const swaggerOptions = {
  info: {
    title: 'NoteOnMap API Documentation',
    version: Pack.version,
    },
  grouping: "tags",
};


export async function registerHapiPlugins(server) {
  await server.register([
    { plugin: Vision },
    { plugin: Inert },
    { plugin: Cookie },
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
    { plugin: require('hapi-auth-jwt2') },
  ]);
}
