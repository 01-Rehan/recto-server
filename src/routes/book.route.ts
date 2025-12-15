import { Router } from "express";
import {
  getBookController,
  tbrBookController,
  removeTbrBookController,
  fetchReadingStatus,
  addReview,
  removeReview,
  updateReview,
} from "../controller/book.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Ex for different roles like admin \ librarian \ moderators
//   router.route("/stats").get(
//     VerifyJWT,
//     VerifyRole(["admin"]),
//     getSystemStats
// );

// // Example: Allow multiple roles
// router.route("/manage-content").patch(
//     VerifyJWT,
//     VerifyRole(["admin", "moderator"]),
//     manageContentController
// );


// for all users (without the JWT token)
router.route("/getbook").post(getBookController);


// Protected Routes 

router.use(VerifyJWT);

router.route("/tbrbook").post(tbrBookController);
router.route("/remove-tbrbook").delete(removeTbrBookController);

router.route("/fetch-user-books").get(fetchReadingStatus);

router.route("/reviews/add").post(addReview);
router.route("/reviews/:reviewId").patch(updateReview);
router.route("/reviews/:reviewId").delete(removeReview);
// router.route("/reviews/:reviewId/like").post();

export default router;
