import mongoose, { Schema, Model } from "mongoose";
import { IUser, IUserMethods } from "../types/user"; // Ensure this interface matches the schema
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

const userSchema = new Schema<
  IUser,
  Model<IUser, {}, IUserMethods>,
  IUserMethods
>(
  {
    userName: {
      type: String,
      default: null,
      sparse: true,
      unique: true, // Note: Custom error messages for 'unique' require a plugin or controller logic
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true, 
    },
    hashedPassword: {
      type: String,
      // Not required, because Google users won't have a password
      select: false,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    avatarImage: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    // counters
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },

    refreshToken: {
      type: String,
      default: null,
      select: false
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.comparePassword = async function (password: string) {
  try {
    return await bcrypt.compare(password, this.hashedPassword);
  } catch (err) {
    console.log("Error comparing password", err);
    return false;
  }
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email, 
      isVerified: this.isVerified,
    },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m", // Fallback is good practice
    } as SignOptions,
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d",
    } as SignOptions,
  );
};

userSchema.index({ userName: "text" });

export default mongoose.model<IUser>("User", userSchema);
