import { Types, Schema, model } from "mongoose";
import { IUser } from "../types/user";
import { IReview } from "../types/bookReview";

interface IReviewLike {
  reviewId: Types.ObjectId | IReview;
  userId: Types.ObjectId | IUser;
  createdAt: Date;
}

const ReviewLikeSchema = new Schema<IReviewLike>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: "BookReview",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Useful to show "Liked 2 minutes ago"
  },
);

// --- CRITICAL INDEXES ---

// 1. Prevent Double Likes
// A user can only like a specific review ONCE.
ReviewLikeSchema.index({ userId: 1, reviewId: 1 }, { unique: true });

// 2. Performance Index
// Used when you need to load all likes for a specific review
// (or to count them if you aren't storing the count on the review itself).
ReviewLikeSchema.index({ reviewId: 1 });

export const ReviewLikeModel = model<IReviewLike>(
  "ReviewLike",
  ReviewLikeSchema,
);
