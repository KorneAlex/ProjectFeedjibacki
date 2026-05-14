/**
 * The `initCloudinary` function initializes the Cloudinary configuration using environment variables
 * for cloud name, API key, and API secret that should be in the .env file. 
 * It also exports the configured Cloudinary instance and Swagger options for API documentation.
 */


import { v2 as cloudinary } from "cloudinary";

export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
export { cloudinary };