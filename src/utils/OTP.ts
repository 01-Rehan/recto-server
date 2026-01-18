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
      html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recto Verification Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            background-color: #333333; /* Dark header for contrast */
            padding: 10px;
            border-radius: 8px 8px 0 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
        }
        .content {
            padding: 20px;
            color: #333333;
            font-size: 16px;
            line-height: 1.5;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #007bff; /* Recto primary color? */
            background-color: #e9f5ff;
            padding: 10px 20px;
            display: inline-block;
            border-radius: 5px;
            margin: 20px 0;
            letter-spacing: 5px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777777;
            border-top: 1px solid #eeeeee;
            padding-top: 10px;
        }
        .warning {
            color: #d9534f;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="header">
            Recto Verification
        </div>

        <div class="content">
            <p>Hello,</p>
            <p>Thank you for starting the verification process with Recto.</p>
            
            <p>Use the code below to complete your Authentication Process:</p>
            
            <div class="otp-code">${code}</div>

            <p>This code is valid for <strong>5 minutes</strong>.</p>
            <p class="warning">Do not share this code with anyone.</p>
            
            <p>If you did not request this code, please ignore this email.</p>
        </div>

        <div class="footer">
            <p>Best regards,<br>The Recto Team</p>
            <p>&copy; ${new Date().getFullYear()} Recto. All rights reserved.</p>
        </div>
    </div>

</body>
</html>`,
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
  userName?: string,
  password?: string,
) => {
  if (!email) throw new ApiError(400, "Email is required");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    const result = await sendOTP(email, code);

    // storing OTP temporary
    const saveOTP = await OTPModel.create({
      email,
      ...(userName && { userName }),
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
