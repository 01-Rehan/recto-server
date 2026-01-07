import z from "zod";

class BlogValidationSchema {
  // Create a new blog
  createBlog = z
    .object({
      body: z
        .object({
          title: z
            .string({ message: "Blog title is required" })
            .min(1, "Title cannot be empty")
            .max(200, "Title cannot exceed 200 characters")
            .trim(),
          content: z
            .string({ message: "Blog content is required" })
            .min(10, "Content must be at least 10 characters")
            .trim(),
          cover_image: z
            .string()
            .url("Cover image must be a valid URL")
            .trim()
            .optional(),
          is_published: z.boolean().optional().default(true),
        })
        .strict(),
    })
    .strict();

  // Update an existing blog
  updateBlog = z
    .object({
      params: z.object({
        id: z.string({ message: "Blog ID is required" }),
      }),
      body: z
        .object({
          title: z
            .string()
            .min(1, "Title cannot be empty")
            .max(200, "Title cannot exceed 200 characters")
            .trim()
            .optional(),
          content: z
            .string()
            .min(10, "Content must be at least 10 characters")
            .trim()
            .optional(),
          cover_image: z
            .string()
            .url("Cover image must be a valid URL")
            .trim()
            .optional(),
          is_published: z.boolean().optional(),
        })
        .strict(),
    })
    .strict();

  // Delete a blog
  deleteBlog = z
    .object({
      params: z.object({
        id: z.string({ message: "Blog ID is required" }),
      }),
    })
    .strict();

  // Get a single blog by slug
  getBlogBySlug = z
    .object({
      params: z.object({
        slug: z.string({ message: "Blog slug is required" }),
      }),
    })
    .strict();

  // Get all blogs with pagination
  getAllBlogs = z
    .object({
      query: z
        .object({
          page: z.coerce
            .number()
            .min(1, "Page must be at least 1")
            .optional()
            .default(1),
          limit: z.coerce
            .number()
            .min(1, "Limit must be at least 1")
            .max(100, "Limit cannot exceed 100")
            .optional()
            .default(10),
          published: z
            .enum(["true", "false", "both"])
            .optional()
            .default("true"),
        })
        .strict(),
    })
    .strict();
}

const blogValidationSchema = new BlogValidationSchema();
export default blogValidationSchema;
