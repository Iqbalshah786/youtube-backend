import { Router } from "express";
import { upload } from "../middlewares/multer.middlerwares.js";
import {
  registerUser,
  logOutUser,
  loginUser,
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
export default router;
