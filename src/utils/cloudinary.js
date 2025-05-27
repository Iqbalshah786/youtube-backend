import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import logger from "./logger.js";
import { ApiError } from "./ApiError.js";

// configure Cloudinary with your env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload image to cloudinary via stream
export function uploadBufferToCloudinary(buffer, opts = {}) {
  if (!buffer) {
    throw new ApiError(400, "No file buffer provided for upload");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        ...opts,
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary stream upload failed: ${error.message}`);
          return reject(error);
        }
        logger.info(`Cloudinary stream upload succeeded: ${result.secure_url}`);
        resolve(result);
      }
    );

    // pipe the in-memory buffer into Cloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
