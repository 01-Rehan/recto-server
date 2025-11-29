import { Router } from "express";
import { signup, VerifyOTPSaveUser } from "../controller/user.controller";

const router = Router();

router.route("/signup").post(signup);
router.route("/signup-verify").post(VerifyOTPSaveUser);

export default router;
