import nodemailer from "nodemailer";
import ApiError from "../utils/ApiError";
import { OTPModel } from "../models/otp.model";
import { IOTP, IOTPMethods } from "../models/otp.model";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

export const sendOTP = async (userEmail: string, code: string) => {
  if (!userEmail || !code) throw new ApiError(400, "Email is required");

  try {
    const info = await transporter.sendMail({
      from: `"Recto" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: "Your One-Time Verification Code",
      html: `<p>Hello,</p>
            <p>Thank you for initiating the verification process.</p>
            <p>
              Your one-time verification code is:
              <strong style="font-size: 40px; color: #007bff; display: block; margin: 10px 0;">${code}</strong>
            </p>
            <p>
              Please enter this code on the verification screen to continue.
            </p>
            <p>
              **This code will expire in 5 minutes.**
            </p>
            <p>If you did not request this code, please ignore this message.</p>
            <p>Best regards,</p>
            <p>The Recto Team</p>`,
    });
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Error while sending OTP");
  }
};

export const sendOTPforVerification = async (
  email: string,
  fullName?: string,
  password?: string,
) => {
  if (!email) throw new ApiError(400, "Email is required");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    const result = await sendOTP(email, code);

    // storing OTP temporary
    const saveOTP = await OTPModel.create({
      email,
      ...(fullName && { fullName }),
      ...(password && { hashedPassword: password }),
      hashedCode: code,
    });
    if (!saveOTP) throw new ApiError(500, "Error while saving OTP");
    return { result, saveOTP };
  } catch (error) {
    throw new ApiError(500, "Error while sending OTP");
  }
};

export const verifyOTPcode = async (email: string, code: string) => {
  const pendingOTP = (await OTPModel.findOne({ email }).select(
    "+hashedCode +hashedPassword",
  )) as IOTP & IOTPMethods;
  if (!pendingOTP)
    throw new ApiError(404, "OTP not found or it is already registered");

  const isOTPSame = await pendingOTP.compareCode(code);
  if (!isOTPSame) throw new ApiError(400, "Invalid OTP");

  return { pendingOTP, isOTPSame };
};
