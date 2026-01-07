import { Document } from "mongoose";
import { ROLES as UserRoles } from "../constant";

export interface IUser extends Document {
  userName: string;
  fullName: string;
  email: string;
  hashedPassword: string;
  googleId?: string | undefined; // Optional field
  bio: string;
  avatarImage: string;
  coverImage: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  refreshToken: string;
  isVerified: boolean;
  role: (typeof UserRoles)[number];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}
