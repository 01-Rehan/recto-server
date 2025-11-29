import { Document } from "mongoose";

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
  createdAt: Date;
  updatedAt: Date;

}

export interface IUserMethods {
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}