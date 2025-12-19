import { Router } from "express";
import { searchUsers, getUser } from "../controller/search.controller";
import searchSchema from "../validation/search.schema";
import validate from "../middlewares/validate.middleware";

const router = Router();

router.route("/users").get(validate(searchSchema.searchUsers), searchUsers);
router.route("/user").get(validate(searchSchema.getUser), getUser);

export default router;
