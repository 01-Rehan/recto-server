import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  googleAuthCallback,
  googleAuthRedirect,
  logout,
  newPassword,
  refreshAccessToken,
  signin,
  signup,
  updateAvatarAndBanner,
  updateEmail,
  updateProfile,
  userNameAvailability,
  verifyOTPforPasswordChange,
  VerifyOTPSaveUser,
  whoami,
} from "../controller/user.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import validate from "../middlewares/validate.middleware";
import userSchema from "../validation/user.schema";

const router = Router();

// --- Auth Routes ---
router.route("/signup").post(validate(userSchema.signUp), signup);

router
  .route("/signup-verify")
  .post(validate(userSchema.verifyOTP), VerifyOTPSaveUser);

router.route("/signin").post(validate(userSchema.signIn), signin);

router
  .route("/refresh-accesstoken")
  .post(validate(userSchema.refreshToken), refreshAccessToken);

// --- Google Auth ---
// Frontend links <a href=".../google"> here
router.route("/google").get(googleAuthRedirect);
router.route("/google/callback").get(googleAuthCallback);

// --- Password Reset Flow ---
router
  .route("/password-otp")
  .post(validate(userSchema.forgotPassword), forgotPassword);

router
  .route("/password-otp-verify")
  .post(
    validate(userSchema.verifyOTPforPasswordChange),
    verifyOTPforPasswordChange,
  );

router
  .route("/new-password")
  .post(validate(userSchema.newPassword), newPassword);

// --- Protected Routes ---

// Change Password (Needs Auth + Validation)
router
  .route("/change-password")
  .post(VerifyJWT, validate(userSchema.changePassword), changePassword);

router.route("/logout").post(VerifyJWT, logout);

// Profile Updates
// Note: Changed to .patch() is standard for partial updates, but .post() works too.
router
  .route("/update-profile")
  .patch(VerifyJWT, validate(userSchema.updateProfile), updateProfile);

router.route("/update-email").patch(VerifyJWT, updateEmail); // Add validation if you create a schema for this later

// File Uploads
// Note: Multer ('upload') must run BEFORE validation if you add text fields to this request later
router.route("/update-profileimage").post(
  VerifyJWT,
  upload.fields([
    { name: "avatarImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateAvatarAndBanner,
);

// Utility
router
  .route("/check")
  .get(validate(userSchema.userNameAvailability), userNameAvailability);

router.route("/whoami").get(VerifyJWT, whoami);

export default router;
