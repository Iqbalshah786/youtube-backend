import { Router } from "express";
import { upload } from "../middlewares/multer.middlerwares.js";
import {
  registerUser,
  logOutUser,
  loginUser,
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// secured routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/login").post(loginUser);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(upload.single("avatar"), verifyJWT, updateUserAvatar);
router
  .route("/update-cover-image")
  .patch(upload.single("coverImage"), verifyJWT, updateUserCoverImage);
export default router;
