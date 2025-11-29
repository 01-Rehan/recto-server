import { Router } from "express";
import {
  googleAuthCallback,
  googleAuthRedirect,
  logout,
  signin,
  signup,
  VerifyOTPSaveUser,
} from "../controller/user.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/signup").post(signup);
router.route("/signup-verify").post(VerifyOTPSaveUser);
router.route("/signin").post(signin);
router.route("/logout").post(VerifyJWT, logout);

// Route 1: The entry point. Frontend links <a href=".../google"> here.
router.get("/google", googleAuthRedirect);

// Route 2: The return point. Google sends the user here.
router.get("/google/callback", googleAuthCallback);

export default router;
