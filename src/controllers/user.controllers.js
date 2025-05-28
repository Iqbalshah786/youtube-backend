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
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

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
      "-password -refreshToken -__v"
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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (![email, password].every((f) => typeof f === "string" && f.trim())) {
    throw new ApiError(400, "Email and password are required");
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -__v"
  );
  if (!loggedInUser) {
    throw new ApiError(500, "Login failed, user not found");
  }

  const options = {
    httOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User login successful"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        refreshToken: undefined,
      },
    },

    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .clearCookie("accessToken", "", options)
    .clearCookie("refreshToken", "", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAndAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user || user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while refreshing token");
  }
});
export { registerUser, loginUser, refreshAndAccessToken, logOutUser };
