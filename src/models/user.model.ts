import mongoose, { Schema, Model } from "mongoose";
import { IUser, IUserMethods } from "../types/user"; // Ensure this interface matches the schema
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import { ROLES } from "../constant";

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
      select: false,
      default: null,
    },
    bio: {
      type: String,
      default: null
    },
    avatarImage: {
      type: String,
      default: null
    },
    coverImage: {
      type: String,
      default: null
    },
    
    // counters
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "user",
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

userSchema.pre("save", async function () {
  try {
    if (!this.isModified("hashedPassword")) return;
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
  } catch (err: any) {
    // Type as any or Error
    throw err;
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  if(!password || password.trim().length === 0) throw new ApiError(400, "Password cannot be empty");
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
      role: this.role,
      isVerified: this.isVerified,
    },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
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
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    } as SignOptions,
  );
};

userSchema.index({ userName: "text" });

export default mongoose.model<IUser>("User", userSchema);
