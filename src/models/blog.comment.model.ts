import { Types } from "mongoose";
import { IUser } from "../types/user";
import { IBlog } from "../types/blog";

export interface IBlogComment {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser; // The commenter
  blogId: Types.ObjectId | IBlog; // The blog post being commented on
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Schema, model } from "mongoose";

const BlogCommentSchema = new Schema<IBlogComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // Limit comment length to prevent spam
    },
  },
  {
    timestamps: true, // Auto-manages createdAt and updatedAt
  },
);

// --- PERFORMANCE INDEX ---

// This index is crucial for loading comments for a specific blog post.
// Sorting by createdAt (-1) allows you to show the newest comments first.
BlogCommentSchema.index({ blogId: 1, createdAt: -1 });

export const BlogCommentModel = model<IBlogComment>(
  "BlogComment",
  BlogCommentSchema,
);
