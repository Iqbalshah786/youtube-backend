import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v4 as uuid } from "uuid";
import logger from "../utils/logger.js";

const registerUser = asyncHandler(async (req, res) => {
  // destructure and validate body
  const { fullname, email, username, password } = req.body || {};

  if (
    ![fullname, email, username, password].every(
      (f) => typeof f === "string" && f.trim()
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitedUser) {
    throw new ApiError(409, "Username or email already exists");
  }
  // handle in-memory uploads
  const avatarBuffer = req.files?.avatar?.[0]?.buffer;
  if (!avatarBuffer) throw new ApiError(400, "Avatar is missing");
  const coverBuffer = req.files?.coverImage?.[0]?.buffer;

  // upload avatar via stream
  const avatarId = `${Date.now()}-${uuid()}`;
  let avatarRes;
  try {
    avatarRes = await uploadBufferToCloudinary(avatarBuffer, {
      public_id: avatarId,
    });
  } catch (error) {
    throw new ApiError(500, "Failed to upload avatar");
  }
  // upload cover image if provided
  let coverRes = null;
  if (coverBuffer) {
    const coverId = `${Date.now()}-${uuid()}`;

    try {
      coverRes = await uploadBufferToCloudinary(coverBuffer, {
        public_id: coverId,
      });
    } catch (error) {
      throw new ApiError(500, "Failed to upload cover image");
    }
  }
  try {
    const user = await User.create({
      fullname,
      avatar: avatarRes.secure_url,
      coverImage: coverRes?.secure_url || "",
      email,
      password,
      username: username.toLowerCase(),
    });
    const createdUser = await User.findById(user._id).select(
      "-password -refershToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
    }
    res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", createdUser));
  } catch (error) {
    logger.info("Error creating user:", error);
    if (avatarRes) {
      await deleteFromCloudinary(avatarRes.public_id);
    }
    if (coverRes) {
      await deleteFromCloudinary(coverRes.public_id);
    }
    throw new ApiError(500, "Somegthing went wrong while creating user");
  }
});

export { registerUser };
