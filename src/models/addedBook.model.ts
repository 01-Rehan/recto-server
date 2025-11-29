import { Schema, model } from "mongoose";
import { IUserBook } from "../types/addedBook";

const userBookSchema = new Schema<IUserBook>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Links to your User model
      required: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book", // Links to your Book model
      required: true,
    },
    status: {
      type: String,
      enum: ["reading", "finished", "dropped", "wishlist"],
      required: true,
      default: "wishlist", // Good default entry point
    },
    currentPage: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    finishDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// --- INDEXES ---

// 1. COMPOUND UNIQUE INDEX (The most important one)
// Ensures a user can only have ONE entry per book.
// If they move it from 'wishlist' to 'reading', you UPDATE this doc, don't create a new one.
userBookSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// 2. Performance Index
// We don't strictly need a separate index for { userId: 1 } because the compound index 
// above covers it (since userId is the first field).
// However, we DO need one for bookId if you want to find "Who else is reading this book?"
// userBookSchema.index({ bookId: 1 });

export const UserBookModel = model<IUserBook>("AddedBook", userBookSchema);