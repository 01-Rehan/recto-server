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
import validate from "../middlewares/validate.middleware";
import connectionSchema from "../validation/connection.schema";
import { apiLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

router
  .route("/followers")
  .get(apiLimiter, validate(connectionSchema.fetchFollowers), fetchFollowers);
router
  .route("/following")
  .get(apiLimiter, validate(connectionSchema.fetchFollowing), fetchFollowing);

router.use(VerifyJWT);

router
  .route("/follow/:userId")
  .post(apiLimiter, validate(connectionSchema.followUser), followUser);
router
  .route("/unfollow/:userId")
  .delete(apiLimiter, validate(connectionSchema.unfollowUser), unfollowUser);

router
  .route("/myfollowers")
  .get(apiLimiter, validate(connectionSchema.myFollowers), myFollowers);
router
  .route("/myfollowings")
  .get(apiLimiter, validate(connectionSchema.myFollowing), myFollowing);

export default router;
