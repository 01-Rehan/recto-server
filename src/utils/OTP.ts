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
      html: `<p>Hello!</p>
             <p>Your verification code is <strong>${code}</strong>.</p>
             <p>This code is valid for 5 minutes.</p>`,
    });
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Error while sending OTP");
  }
};

export const compareOTP = async (code : string ,hashedCode : string) => {
    return await bcrypt.compare(code, hashedCode);
}
