import nodemailer from "nodemailer";
import ApiError from "../utils/ApiError";
import bcrypt from "bcrypt";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false, // true for 465, false for other ports
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
      subject: "Recto: Your One-Time Verification Code",
      html: `<p>Hello,</p>
            <p>Thank you for initiating the verification process.</p>
            <p>
              Your one-time verification code is:
              <strong style="font-size: 20px; color: #007bff; display: block; margin: 10px 0;">${code}</strong>
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
