import mongoose, { Schema } from "mongoose";
import { IBookList, IBookListItem } from "../types/bookLists";

const bookListItemSchema = new Schema<IBookListItem>(
  {
    book_id: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const bookListSchema = new Schema<IBookList>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "List name is required"],
      trim: true,
      maxlength: [100, "List name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    is_public: {
      type: Boolean,
      default: false,
    },
    book_count: {
      type: Number,
      default: 0,
    },
    items: [bookListItemSchema],
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
bookListSchema.index({ user_id: 1, name: 1 });
bookListSchema.index({ is_public: 1 });

// Update book_count before saving
bookListSchema.pre("save", function () {
  this.book_count = this.items.length;
});

const BookList = mongoose.model<IBookList>("BookList", bookListSchema);

export default BookList;
