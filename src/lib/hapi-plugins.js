/**
 * Hapi plugins registration
 * This file contains the configuration for registering Hapi plugins.
 */

import Cookie from "@hapi/cookie";
import HapiSwagger from "hapi-swagger";
import Inert from "@hapi/inert";
import Vision from "@hapi/vision";
import { swaggerOptions } from "./cloudinary.js";

export async function registerHapiPlugins(server) {
  await server.register([
    { plugin: Vision },
    { plugin: Inert },
    { plugin: Cookie },
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);
}
