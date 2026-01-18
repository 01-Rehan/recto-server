import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { ValidatedRequest } from "../types/typedRequest";
import blogValidationSchema from "../validation/blog.schema";
import { blogService } from "../services/blog.service";

/**
 * Create a new blog
 * POST /blogs
 * Protected route
 */
export const createBlogController = asyncHandler(
  async (
    req: ValidatedRequest<typeof blogValidationSchema.createBlog> &
      CustomRequest,
    res: Response,
  ) => {
    const authorId = req.user!._id;
    const { title, content, cover_image, is_published } = req.body;

    const blog = await blogService.createBlog(authorId, {
      title,
      content,
      cover_image,
      is_published,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, blog, "Blog created successfully"));
  },
);

/**
 * Get all published blogs with pagination
 * GET /blogs
 * Public route
 */
export const getAllBlogsController = asyncHandler(
  async (
    req: ValidatedRequest<typeof blogValidationSchema.getAllBlogs>,
    res: Response,
  ) => {
    const {
      page = 1,
      limit = 10,
      published = "true",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const result = await blogService.getAllBlogs(
      page as number,
      limit as number,
      published as "true" | "false" | "both",
      sort as string,
      order as "asc" | "desc",
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Blogs fetched successfully"));
  },
);

/**
 * Get a single blog by slug
 * GET /blogs/:slug
 * Public route (but shows unpublished only to author)
 */
export const getBlogBySlugController = asyncHandler(
  async (
    req: ValidatedRequest<typeof blogValidationSchema.getBlogBySlug> &
      CustomRequest,
    res: Response,
  ) => {
    const { slug } = req.params;
    const authorId = req.user?._id;

    const blog = await blogService.getBlogBySlug(slug, authorId);

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog fetched successfully"));
  },
);

/**
 * Get all blogs for the authenticated user
 * GET /blogs/user/my-blogs
 * Protected route
 */
export const getUserBlogsController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const authorId = req.user!._id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await blogService.getAuthorBlogs(authorId, page, limit);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "User blogs fetched successfully"));
  },
);

/**
 * Update a blog
 * PATCH /blogs/:id
 * Protected route - only author can update
 */
export const updateBlogController = asyncHandler(
  async (
    req: ValidatedRequest<typeof blogValidationSchema.updateBlog> &
      CustomRequest,
    res: Response,
  ) => {
    const authorId = req.user!._id;
    const { id } = req.params;
    const updates = req.body;

    const blog = await blogService.updateBlog(id, authorId, updates);

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog updated successfully"));
  },
);

/**
 * Delete a blog
 * DELETE /blogs/:id
 * Protected route - only author can delete
 */
export const deleteBlogController = asyncHandler(
  async (
    req: ValidatedRequest<typeof blogValidationSchema.deleteBlog> &
      CustomRequest,
    res: Response,
  ) => {
    const authorId = req.user!._id;
    const { id } = req.params;

    const result = await blogService.deleteBlog(id, authorId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Blog deleted successfully"));
  },
);
