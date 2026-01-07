import { Types } from "mongoose";
import { IUser } from "./user";
import { IBook } from "./book";
import { Document } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  bookId: Types.ObjectId | IBook;
  content?: string; // Optional: User might just leave a star rating
  rating: number; // Float (e.g., 4.5)
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}
