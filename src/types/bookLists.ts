import mongoose from "mongoose";

export interface IBookListItem {
  book_id: mongoose.Types.ObjectId;
  title: string;
  author: string;
  added_at: Date;
  position: number;
}

export interface IBookList {
  user_id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  is_public: boolean;
  book_count: number;
  items: IBookListItem[];
  createdAt: Date;
  updatedAt: Date;
}
