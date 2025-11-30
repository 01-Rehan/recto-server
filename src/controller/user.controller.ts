import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import User from "../models/user.model";
import { OTPModel, IOTP, IOTPMethods } from "../models/otp.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { sendOTP, sendOTPforVerification, verifyOTPcode } from "../utils/OTP";
import { IUser, IUserMethods } from "../types/user";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};
interface CustomRequest extends Request {
  user?: any;
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, fullName, password } = req.body;

  if ([email, fullName, password].some((item) => !item || item?.trim() === ""))
    throw new ApiError(400, "All fields are required");

  if (password.length <= 8)
    throw new ApiError(400, "New password must be at least 8 characters long");

  // checking if the user already exist
  const exitstedUser = await User.findOne({ email });
  if (exitstedUser) throw new ApiError(400, "User already exists");

  const { saveOTP: otpDoc } = await sendOTPforVerification(
    email,
    fullName,
    password,
  );
  const otpObject = otpDoc.toObject();
  const { hashedCode, hashedPassword, ...OTPresponse } = otpObject;
  res
    .status(200)
    .json(new ApiResponse(201, OTPresponse, "OTP sent successfully"));
});

export const VerifyOTPSaveUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code } = req.body;

    if ([email, code].some((item) => item?.trim() === ""))
      throw new ApiError(400, "All fields are required");

    const { pendingOTP } = await verifyOTPcode(email, code);

    // We use insertMany to BYPASS the pre('save') hook so we don't double-hash.
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

    // Remove sensitive fields
    const { hashedPassword, refreshToken, ...userData } = userResponse;

    res
      .status(200)
      .json(new ApiResponse(200, userData, "User verified successfully"));
  },
);

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = (await User.findById(userId)) as unknown as IUser &
      IUserMethods;
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating tokens");
  }
};

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if ([email, password].some((item) => item?.trim() === ""))
    throw new ApiError(400, "All fields are required");

  const user = (await User.findOne({ email }).select(
    "+hashedPassword +refreshToken",
  )) as unknown as IUser & IUserMethods;
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid password");
  if (!user.isVerified) throw new ApiError(400, "User not verified");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id.toString(),
  );

  const loggedInUser = (await User.findById(user._id)) as unknown as IUser &
    IUserMethods;
  const UserObject = loggedInUser.toObject();
  const { hashedPassword, ...userResponse } = UserObject;

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: userResponse,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Define a custom interface for Request to include the 'user' property
  interface CustomRequest extends Request {
    user?: any;
  }
  const userId = (req as CustomRequest)?.user._id;

  await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: null } },
    { new: true },
  ).select("+refreshToken");

  return res
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const googleAuthRedirect = asyncHandler(
  (req: Request, res: Response) => {
    const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

    // Define the parameters for the URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      response_type: "code", // Important: We want a CODE, not a token directly (security)
      scope: "profile email", // We are asking for their name and email
      access_type: "offline", // Gets us a refresh token (optional, but good practice)
      prompt: "consent", // Forces the "Allow" screen to show every time
    });

    // 3. Construct the full URL and redirect the user
    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;
    return res.redirect(authUrl);
  },
);

export const googleAuthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    // ACTION 1: Extract the "code" from the URL parameters
    // Google sends the user back to: /google/callback?code=abc12345...
    const { code } = req.query;

    const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    if (!code) {
      throw new ApiError(
        400,
        "Authorization code missing from Google callback",
      );
    }

    // ACTION 2: Exchange the "code" for "tokens"
    // We make a server-to-server POST request to Google.
    // We send the code + our client secret. Google verifies it and gives us an Access Token.
    let googleTokens;
    try {
      const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      });
      googleTokens = tokenResponse.data;
    } catch (error) {
      throw new ApiError(500, "Failed to exchange code for tokens with Google");
    }

    const { access_token: googleAccessToken } = googleTokens;

    // ACTION 3: Get User Profile
    // Now we use that Google Access Token to ask Google: "Who is this user?"
    let googleUser;
    try {
      const userProfileResponse = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      });
      googleUser = userProfileResponse.data;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch user profile from Google");
    }

    // ACTION 4: Database Logic (The Waterfall)

    // STEP A: Check if this Google Account is already linked
    let user = await User.findOne({ googleId: googleUser.id });

    if (user) {
      // User found via Google ID - Great!
      // Just ensure they are verified (optional, but good practice)
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      // STEP B: User not found by Google ID. Check by Email.
      // This handles the case where a user signed up with Email/Password
      // but is now trying to log in with Google for the first time.
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        // User exists, but 'googleId' was missing. LINK THEM NOW.
        user.googleId = googleUser.id;

        if (!user.avatarImage && googleUser.picture)
          user.avatarImage =
            googleUser.picture.replace(/=s\d+(-c)?/g, "") + "=s400";

        await user.save({ validateBeforeSave: false });
      } else {
        // STEP C: New User entirely. Create account.

        const StockAvatarImg = googleUser.picture;
        const avatarImage = StockAvatarImg.replace(/=s\d+(-c)?/g, "") + "=s400";

        // Generate a random secure : process.env.NODE_ENC === "production", DB requirement is met
        // (Use a library like crypto or uuid)
        const dummyPassword = crypto.randomBytes(16).toString("hex");

        user = await User.create({
          email: googleUser.email,
          fullName: googleUser.name,
          googleId: googleUser.id, // SAVE THIS!
          avatarImage,
          isVerified: true,
          hashedPassword: dummyPassword,
        });
      }
    }
    // ... continue to Action 5 (Generate Tokens) ...

    // ACTION 5: Generate OUR Local Tokens (JWT)
    // This is the most important part. We stop caring about Google's token
    // and issue our OWN App Token (Access/Refresh) so the frontend works normally.

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id.toString());

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // ACTION 6: Set Cookies and Redirect
    // Instead of sending JSON, we usually set cookies and redirect the browser
    // to the Frontend Homepage (or a generic success page).

    return (
      res
        .status(200)
        .cookie("refreshToken", newRefreshToken, options)
        .cookie("accessToken", accessToken, options)
        // .redirect(process.env.CLIENT_URL || "http://localhost:5173/home");
        .json({
          message: "Success",
          accessToken,
          newRefreshToken,
        })
    );
  },
);

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(400, "Refresh token missing");

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
      );
      if (!decodedToken)
        throw new ApiError(400, "Invalid refresh token(JWT verification)");

      const userId: string = (decodedToken as { _id: string })._id;
      const user = await User.findById(userId).select("+refreshToken");
      if (!user) throw new ApiError(404, "User not found");

      if (user.refreshToken !== incomingRefreshToken)
        throw new ApiError(400, "Invalid refresh token");

      const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshTokens(userId);

      return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
          new ApiResponse(
            200,
            {
              accessToken,
              newRefreshToken,
            },
            "Access token refreshed successfully",
          ),
        );
    } catch (error) {
      throw new ApiError(
        400,
        (error as Error)?.message || "error while refreshing access token",
      );
    }
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email field is required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    await sendOTPforVerification(user.email, undefined, undefined);

    res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
  },
);

export const verifyOTPforPasswordChange = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code } = req.body;
    if (!email || !code)
      throw new ApiError(
        400,
        "All fields are required for verifying OTP (password change)",
      );

    const { pendingOTP } = await verifyOTPcode(email, code);
    if (!pendingOTP)
      throw new ApiError(404, "invalid OTP");

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

      await OTPModel.deleteMany({ email });

    return res
      .status(200)
      .json(new ApiResponse(200, { resetToken }, "OTP verified successfully"));
  },
);

export const newPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password)
    throw new ApiError(400, "All fields are required for new password");

  if (password.length <= 8)
  throw new ApiError(400, "Password must be at least 8 characters long");


  const decodedToken = jwt.verify(
    resetToken,
    process.env.RESET_PASSWORD_SECRET!,
  );
  if (!decodedToken) throw new ApiError(400, "Invalid token for new password");
  if ((decodedToken as any).purpose !== "password-reset")
    throw new ApiError(400, "Invalid token purpose");

  const user = await User.findOne({
    email: (decodedToken as any).email,
  }).select("+hashedPassword");
  if (!user) throw new ApiError(404, "User not found");

  user.hashedPassword = password;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      throw new ApiError(400, "All fields are required");

    if (newPassword.length <= 8)
      throw new ApiError(400, "Password must be at least 8 characters long");

    const userId = (req as CustomRequest).user._id;
    const user = await User.findById(userId).select("+hashedPassword");
    if (!user) throw new ApiError(404, "User not found");

    const ispasswordValid = await (user as any).comparePassword(oldPassword);
    if (!ispasswordValid) throw new ApiError(400, "old password is Invalid");

    user.hashedPassword = newPassword;

    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  },
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {},
);

export const updateEmail = asyncHandler(
  async (req: Request, res: Response) => {},
);

export const updateAvatarAndBanner = asyncHandler(
  async (req: Request, res: Response) => {},
);
