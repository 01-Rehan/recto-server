import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import User from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { compareOTP, sendOTP } from "../utils/OTP";
import bcrypt from "bcrypt";
import { OTPModel } from "../models/otp.model";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, fullName, password } = req.body;

  if ([email, fullName, password].some((item) => item?.trim() === ""))
    throw new ApiError(400, "All fields are required");

  // checking if the user already exist
  const exitstedUser = await User.findOne({ email });
  if (exitstedUser) throw new ApiError(400, "User already exists");

  // generating OTP and Hasing it
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  //   // storing user with isVerified false
  //   const user = await User.create({
  //     email,
  //     fullName,
  //     passwordHash: password,
  //   });
  //   if (!user) throw new ApiError(500, "Error while creating user");

  // sending OTP via Email
  const sendEmail = await sendOTP(email, code);
  if (sendEmail.rejected.length > 0)
    throw new ApiError(500, "Email Rejected while sending OTP");

  // storing OTP temporary
  const saveOTP = await OTPModel.create({
    email,
    fullName,
    hashedPassword: password,
    hashedCode: code,
  });
  if (!saveOTP) throw new ApiError(500, "Error while saving OTP");

  res.status(200).json(new ApiResponse(201, "OTP sent successfully"));
});

export const VerifyOTPSaveUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code } = req.body;

    if ([email, code].some((item) => item?.trim() === ""))
      throw new ApiError(400, "All fields are required");

    const pendingOTP = await OTPModel.findOne({ email });
    if (!pendingOTP) {
      throw new ApiError(404, "OTP not found");
    }

    const isOTPSame = compareOTP(code, pendingOTP.hashedCode);
    if (!isOTPSame) return new ApiError(400, "Invalid OTP");

    const user = await User.create({
      email,
      fullName: pendingOTP.fullName,
      passwordHash: pendingOTP.hashedPassword,
      isVerified: true,
    });
    if (!user) throw new ApiError(500, "Error while updating user");
    await OTPModel.findByIdAndDelete(pendingOTP._id);

    res
      .status(200)
      .json(new ApiResponse(200, user, "User verified successfully"));
  },
);
