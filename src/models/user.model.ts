import mongoose, { Schema, Model } from "mongoose";
import crypto from "crypto";
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
      required: [true, "Username is required"],
      unique: true, // Note: Custom error messages for 'unique' require a plugin or controller logic
    },
    fullName: {
      type: String,
      default: null,
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
      default: null,
    },
    avatarImage: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
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
    // Auto-generate a unique username if missing
    if (!this.userName || this.userName.trim() === "") {
      const baseSource: string = this.email?.split("@")[0] || "user";
      const baseRaw = baseSource.toLowerCase().replace(/[^a-z0-9_.]/g, "");
      const base = baseRaw.slice(0, 15) || "user";

      let generated = false;
      for (let i = 0; i < 5; i++) {
        const suffix = crypto.randomBytes(2).toString("hex");
        const maxBaseLen = Math.max(1, 20 - 1 - suffix.length);
        const candidate = `${base.slice(0, maxBaseLen)}_${suffix}`;
        const exists = await (this.constructor as mongoose.Model<IUser>).exists(
          {
            userName: candidate,
          },
        );
        if (!exists) {
          this.userName = candidate;
          generated = true;
          break;
        }
      }

      // If still unset after attempts, set a fallback
      if (!generated) {
        this.userName = `user_${crypto.randomBytes(3).toString("hex")}`;
      }
    }

    // Hash password if modified
    if (!this.isModified("hashedPassword")) return;
    if (this.hashedPassword) {
      this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
    }
  } catch (err: any) {
    throw err;
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  if (!password || password.trim().length === 0)
    throw new ApiError(400, "Password cannot be empty");
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
