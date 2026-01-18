import { BlogModel } from "../models/blog.model";
import { CreateBlogDto, UpdateBlogDto } from "../types/blog";
import ApiError from "../utils/ApiError";
import mongoose from "mongoose";

class BlogService {
  /**
   * Generate a URL-friendly slug from the title
   * Converts to lowercase, replaces spaces with hyphens, removes special characters
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Generate a unique slug by checking for duplicates and appending a number if necessary
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await BlogModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Create a new blog
   */
  async createBlog(authorId: string, data: CreateBlogDto) {
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      throw new ApiError(400, "Invalid author ID");
    }

    const baseSlug = this.generateSlug(data.title);
    const slug = await this.generateUniqueSlug(baseSlug);

    const blog = await BlogModel.create({
      author_id: authorId,
      title: data.title,
      slug,
      content: data.content,
      cover_image: data.cover_image,
      is_published: data.is_published !== undefined ? data.is_published : true,
    });

    return blog.populate("author_id", "username email _id");
  }

  /**
   * Get a blog by slug
   */
  async getBlogBySlug(slug: string, authorId?: string) {
    const query: { slug: string; is_published?: boolean } = { slug };

    // If not authenticated or user is not the author, only show published blogs
    if (!authorId) {
      query.is_published = true;
    }

    const blog = await BlogModel.findOne(query).populate(
      "author_id",
      "username email _id",
    );

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    // If blog is unpublished, only the author can view it
    if (
      !blog.is_published &&
      authorId &&
      blog.author_id._id.toString() !== authorId
    ) {
      throw new ApiError(403, "You do not have permission to view this blog");
    }

    return blog;
  }

  /**
   * Get all published blogs with pagination
   */
  async getAllBlogs(
    page: number = 1,
    limit: number = 10,
    published: "true" | "false" | "both" = "true",
    sort: string = "createdAt",
    order: "asc" | "desc" = "desc",
  ) {
    const skip = (page - 1) * limit;

    const query: { is_published?: boolean } = {};
    if (published === "true") {
      query.is_published = true;
    } else if (published === "false") {
      query.is_published = false;
    }
    // If "both", don't add any filter

    // Build sort object
    const sortObj: any = {};
    const sortField = ["createdAt", "updatedAt", "title"].includes(sort)
      ? sort
      : "createdAt";
    sortObj[sortField] = order === "asc" ? 1 : -1;

    const blogs = await BlogModel.find(query)
      .populate("author_id", "username avatarImage _id")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await BlogModel.countDocuments(query);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all blogs for a specific author (authenticated only)
   */
  async getAuthorBlogs(authorId: string, page: number = 1, limit: number = 10) {
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      throw new ApiError(400, "Invalid author ID");
    }

    const skip = (page - 1) * limit;

    const blogs = await BlogModel.find({ author_id: authorId })
      .populate("author_id", "username email _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await BlogModel.countDocuments({ author_id: authorId });

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a blog
   */
  async updateBlog(blogId: string, authorId: string, data: UpdateBlogDto) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw new ApiError(400, "Invalid blog ID");
    }

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      throw new ApiError(400, "Invalid author ID");
    }

    const blog = await BlogModel.findById(blogId);

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    // Only the author can update the blog
    if (blog.author_id.toString() !== authorId) {
      throw new ApiError(403, "You can only update your own blogs");
    }

    // Update title and regenerate slug if title changed
    if (data.title !== undefined && data.title !== blog.title) {
      const baseSlug = this.generateSlug(data.title);
      const uniqueSlug = await this.generateUniqueSlug(baseSlug);
      blog.title = data.title;
      blog.slug = uniqueSlug;
    }

    if (data.content !== undefined) blog.content = data.content;
    if (data.cover_image !== undefined) blog.cover_image = data.cover_image;
    if (data.is_published !== undefined) blog.is_published = data.is_published;

    await blog.save();

    return blog.populate("author_id", "username email _id");
  }

  /**
   * Delete a blog
   */
  async deleteBlog(blogId: string, authorId: string) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw new ApiError(400, "Invalid blog ID");
    }

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      throw new ApiError(400, "Invalid author ID");
    }

    const blog = await BlogModel.findById(blogId);

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    // Only the author can delete the blog
    if (blog.author_id.toString() !== authorId) {
      throw new ApiError(403, "You can only delete your own blogs");
    }

    await BlogModel.findByIdAndDelete(blogId);

    return { message: "Blog deleted successfully" };
  }
}

export const blogService = new BlogService();
