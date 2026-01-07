import ApiError from "../../utils/ApiError";
import User from "../../models/user.model";
import { sendOTPforVerification, verifyOTPcode } from "../../utils/OTP";
import { OTPModel } from "../../models/otp.model";
import { IUser, IUserMethods } from "../../types/user";
import { jwtServices } from "./JWT.service";
import { validateUsername } from "../../utils/UserNameChecker";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary";
import jwt from "jsonwebtoken";

class UserServices {
  signUp = async (email: string, fullName: string, password: string) => {
    const exitstedUser = await User.findOne({ email });
    if (exitstedUser) throw new ApiError(400, "User already exists");

    const { saveOTP: otpDoc } = await sendOTPforVerification(
      email,
      fullName,
      password,
    );
    const otpObject = otpDoc.toObject();
    const { hashedCode, hashedPassword, ...OTPresponse } = otpObject;

    return OTPresponse;
  };

  VerifyOTPandSignUp = async (email: string, otp: string) => {
    const { pendingOTP } = await verifyOTPcode(email, otp);

    // use insertMany to BYPASS the pre('save') hook so we don't double-hash.
    const [user] = await User.insertMany([
      {
        email,
        fullName: pendingOTP.fullName,
        hashedPassword: pendingOTP.hashedPassword, // This comes from the temporary OTP document
        isVerified: true,
      },
    ]);

    if (!user) throw new ApiError(500, "Error while updating user");

    // Clean up the OTP document after successful user creation
    await OTPModel.findByIdAndDelete(pendingOTP._id);
    const userResponse = user.toObject();
    const { hashedPassword, refreshToken, ...userData } = userResponse;
    return userData;
  };

  signIn = async (email: string, password: string) => {
    const user = (await User.findOne({ email }).select(
      "+hashedPassword +refreshToken",
    )) as unknown as IUser & IUserMethods;
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new ApiError(400, "Invalid password");
    if (!user.isVerified) throw new ApiError(400, "User not verified");

    const { accessToken, refreshToken } =
      await jwtServices.generateAccessAndRefreshTokens(user._id.toString());

    const UserObject = user.toObject();
    const { hashedPassword: _, refreshToken: __, ...userResponse } = UserObject;
    return { ...userResponse, accessToken, refreshToken };
  };

  logOut = async (userId: string) => {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { refreshToken: null } },
      { new: true },
    );
  };

  whoAmI = async (userId: string) => {
    const user = await User.findById(userId).lean();
    if (!user) throw new ApiError(404, "User not found");
    const { googleId, ...userData } = user as unknown as IUser;
    return userData;
  };

  updateProfile = async (
    userId: string,
    fullName: string,
    bio: string,
    userName: string,
  ) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (userName && userName !== user.userName) {
      const isAvailable = await this.userNameAvailability(userName);
      if (!isAvailable) throw new ApiError(400, "Username already exists");
      user.userName = userName.trim().toLowerCase();
    }
    if (fullName) user.fullName = fullName.trim();
    if (bio) user.bio = bio.trim();

    await user.save();

    // Sanitize response
    const userObject = user.toObject();
    const { refreshToken, ...userResponse } = userObject;
    return userResponse;
  };

  userNameAvailability = async (username: string) => {
    validateUsername(username);
    const existingUser = await User.findOne({
      userName: username?.trim().toLowerCase(),
    }).select("_id");

    // 3. Return a clean boolean/status
    const isAvailable = !existingUser;

    return isAvailable;
  };

  updateAvatarAndBanner = async (
    userId: string,
    avatarImageLocalPath: string,
    coverImageLocalPath: string,
    removeAvatar = false,
    removeCover = false,
  ) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // --- Avatar Logic ---
    if (removeAvatar) {
      if (user.avatarImage && user.avatarImage.includes("cloudinary.com")) {
        await deleteFromCloudinary(user.avatarImage);
      }
      user.avatarImage = "";
    } else if (avatarImageLocalPath) {
      const newAvatar = await uploadOnCloudinary(avatarImageLocalPath);
      if (newAvatar) {
        if (user.avatarImage && user.avatarImage.includes("cloudinary.com")) {
          await deleteFromCloudinary(user.avatarImage);
        }
        user.avatarImage = newAvatar.url;
      }
    }

    // --- Cover Image Logic ---
    if (removeCover) {
      if (user.coverImage && user.coverImage.includes("cloudinary.com")) {
        await deleteFromCloudinary(user.coverImage);
      }
      user.coverImage = "";
    } else if (coverImageLocalPath) {
      const newCover = await uploadOnCloudinary(coverImageLocalPath);
      if (newCover) {
        if (user.coverImage && user.coverImage.includes("cloudinary.com")) {
          await deleteFromCloudinary(user.coverImage);
        }
        user.coverImage = newCover.url;
      }
    }

    const response = await user.save();

    return response;
  };

  forgotPassword = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    await sendOTPforVerification(email, "User", "RESET_FLOW");
    return { message: "OTP sent to your email" };
  };

  verifyOTPforPasswordReset = async (email: string, otp: string) => {
    const { pendingOTP } = await verifyOTPcode(email, otp);
    if (!pendingOTP) throw new ApiError(404, "OTP not found");

    const resetToken = jwt.sign(
      {
        email: pendingOTP.email,
        purpose: "password-reset",
      },
      process.env.RESET_PASSWORD_SECRET!,
      {
        expiresIn: "10m",
      },
    );
    await OTPModel.findByIdAndDelete(pendingOTP._id);

    return { resetToken };
  };

  resetPassword = async (resetToken: string, newPassword: string) => {
    const decodedToken = jwt.verify(
      resetToken,
      process.env.RESET_PASSWORD_SECRET!,
    );
    if (!decodedToken) throw new ApiError(400, "Invalid token");
    if ((decodedToken as any).purpose !== "password-reset")
      throw new ApiError(400, "Invalid token");

    const user = await User.findOne({
      email: (decodedToken as any).email,
    }).select("+hashedPassword");
    if (!user) throw new ApiError(404, "User not found");

    user.hashedPassword = newPassword;
    await user.save();
    return { message: "Password reset successful" };
  };

  resetPassWithOldPass = async (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) => {
    const user: IUser & IUserMethods =
      await User.findById(userId).select("+hashedPassword");
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) throw new ApiError(400, "Invalid password");

    user.hashedPassword = newPassword;
    await user.save();
    return { message: "Password reset successful" };
  };
}

export const userServices = new UserServices();
