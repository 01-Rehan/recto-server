import { Types } from "mongoose";
import { IBook } from "./book"; // Assuming you want to use the Book type later for population
import { IUser } from "./user"; // Assuming you have a User type
import { Document } from "mongoose";

export type ReadingStatus = "reading" | "finished" | "dropped" | "wishlist";

export interface IUserBook extends Document{
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser; // Can be ID or populated User
  bookId: Types.ObjectId | IBook; // Can be ID or populated Book
  status: ReadingStatus;
  currentPage: number; // Current page number or percentage
  startDate?: Date;
  finishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}