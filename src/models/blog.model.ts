import { Schema, model } from "mongoose";
import { IBlog } from "../types/blog";

const BlogSchema = new Schema<IBlog>(
  {
    author_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    cover_image: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
    is_published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
BlogSchema.index({ author_id: 1, is_published: 1 });
BlogSchema.index({ is_published: 1, createdAt: -1 });

// Allow searching by Title and Content
BlogSchema.index({ title: "text", content: "text" });

export const BlogModel = model<IBlog>("Blog", BlogSchema);
