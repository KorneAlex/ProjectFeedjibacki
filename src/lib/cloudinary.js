/**
 * The `initCloudinary` function initializes the Cloudinary configuration using environment variables
 * for cloud name, API key, and API secret that should be in the .env file. 
 * It also exports the configured Cloudinary instance and Swagger options for API documentation.
 */


import { v2 as cloudinary } from "cloudinary";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Pack = require("../../package.json");

export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
  });
}

export { cloudinary };
export const swaggerOptions = {
  info: {
    title: 'NoteOnMap API Documentation',
    version: Pack.version,
    },
  grouping: "tags",
};