import { Types } from "mongoose";
import { IUser } from "./user";
import { Document } from "mongoose";

export interface IBlog extends Document {
  _id: Types.ObjectId;
  author_id: Types.ObjectId | IUser;
  title: string;
  slug: string;
  cover_image?: string;
  content: string;
  is_published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlogDto {
  title: string;
  content: string;
  cover_image?: string;
  is_published?: boolean;
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  cover_image?: string;
  is_published?: boolean;
}
