import { Router } from "express";
import validate from "../middlewares/validate.middleware";
import blogValidationSchema from "../validation/blog.schema";
import {
  createBlogController,
  getAllBlogsController,
  getBlogBySlugController,
  updateBlogController,
  deleteBlogController,
  getUserBlogsController,
} from "../controller/blog.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// Public routes
router
  .route("/")
  .get(
    apiLimiter,
    validate(blogValidationSchema.getAllBlogs),
    getAllBlogsController,
  );

// Get a single blog by slug
router
  .route("/:slug")
  .get(
    apiLimiter,
    validate(blogValidationSchema.getBlogBySlug),
    getBlogBySlugController,
  );

// Protected routes - require authentication
router.use(VerifyJWT);

// Create a new blog
router
  .route("/")
  .post(
    apiLimiter,
    validate(blogValidationSchema.createBlog),
    createBlogController,
  );

// Get all blogs for the authenticated user
router.route("/user/my-blogs").get(getUserBlogsController);

// Update a blog
router
  .route("/:id")
  .patch(validate(blogValidationSchema.updateBlog), updateBlogController);

// Delete a blog
router
  .route("/:id")
  .delete(validate(blogValidationSchema.deleteBlog), deleteBlogController);

export default router;
