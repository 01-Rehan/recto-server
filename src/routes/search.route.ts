import { Router } from "express";
import { searchUsers, getUser } from "../controller/search.controller";
import searchSchema from "../validation/search.schema";
import validate from "../middlewares/validate.middleware";
import { apiLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

router.route("/users").get(apiLimiter, validate(searchSchema.searchUsers), searchUsers);
router.route("/user").get(apiLimiter, validate(searchSchema.getUser), getUser);

export default router;
