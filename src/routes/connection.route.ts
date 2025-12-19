import { Router } from "express";
import {
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  myFollowers,
  myFollowing,
} from "../controller/connection.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/followers").get(fetchFollowers);
router.route("/following").get(fetchFollowing);

router.use(VerifyJWT);

router.route("/follow/:userId").post(followUser);
router.route("/unfollow/:userId").delete(unfollowUser);

router.route("/myfollowers").get(myFollowers);
router.route("/myfollowings").get(myFollowing);

export default router;
