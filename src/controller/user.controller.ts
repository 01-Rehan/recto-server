import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import "multer";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { userServices } from "../services/user/user.service";
import { jwtServices } from "../services/user/JWT.service";
import { googleAuth } from "../services/user/googleAuth.service";
import ApiError from "../utils/ApiError";

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, fullName, password } = req.body;
  const OTPresponse = await userServices.signUp(email, fullName, password);
  res
    .status(200)
    .json(new ApiResponse(201, OTPresponse, "OTP sent successfully"));
});

export const VerifyOTPSaveUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const userData = await userServices.VerifyOTPandSignUp(email, otp);
    res
      .status(200)
      .json(new ApiResponse(200, userData, "User verified successfully"));
  },
);

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { refreshToken, accessToken, ...user } = await userServices.signIn(
    email,
    password,
  );

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

export const logout = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;

    await userServices.logOut(userId);

    return res
      .clearCookie("refreshToken", options)
      .clearCookie("accessToken", options)
      .status(200)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  },
);

export const googleAuthRedirect = asyncHandler(
  async (_req: Request, res: Response) => {
    const { url, state } = await googleAuth.Redirect();
    // store state in httpOnly cookie for CSRF protection
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    return res.redirect(url);
  },
);

export const googleAuthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    // ACTION 1: Extract the "code" from the URL parameters
    // Google sends the user back to: /google/callback?code=abc12345...
    const { code, state } = req.query as { code: string; state?: string };

    // Verify state to prevent CSRF
    const stateCookie = req.cookies?.oauth_state as string | undefined;
    if (!state || !stateCookie || state !== stateCookie) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid OAuth state"));
    }

    const { refreshToken: newRefreshToken, accessToken } =
      await googleAuth.CallBack(code);

    // clear state cookie after successful validation
    res.clearCookie("oauth_state", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .redirect(process.env.CLIENT_URL!);
    // .json({
    //   message: "Success",
    //   accessToken,
    //   newRefreshToken,
    // })
  },
);

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    const { refreshToken: newRefreshToken, accessToken } =
      await jwtServices.refreshAccessToken(incomingRefreshToken);

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
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const { message } = await userServices.forgotPassword(email);

    res.status(200).json(new ApiResponse(200, {}, message));
  },
);

export const verifyOTPforPasswordChange = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code } = req.body;

    const resetToken = await userServices.verifyOTPforPasswordReset(
      email,
      code,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, { resetToken }, "OTP verified successfully"));
  },
);

export const newPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, password } = req.body;

  await userServices.resetPassword(resetToken, password);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

export const changePassword = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?._id as string;

    await userServices.resetPassWithOldPass(userId, oldPassword, newPassword);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  },
);

export const updateProfile = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { fullName, bio, userName } = req.body;
    const userId = req.user?._id as string;

    const userResponse = await userServices.updateProfile(
      userId,
      fullName,
      bio,
      userName,
    );

    res
      .status(200)
      .json(new ApiResponse(200, userResponse, "Profile updated successfully"));
  },
);

export const updateEmail = asyncHandler(
  async (_req: CustomRequest, _res: Response) => {
    throw new ApiError(501, "Email update is not yet implemented");
  },
);

export const updateAvatarAndBanner = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Check for uploaded files
    const avatarLocalPath = files?.["avatarImage"]?.[0]?.path;
    const coverImageLocalPath = files?.["coverImage"]?.[0]?.path;

    // Check for remove flags in the body
    const removeAvatar = req.body.avatarImage === "remove";
    const removeCover = req.body.coverImage === "remove";

    // A file upload should always take precedence over a remove flag.
    // So, we only trigger a remove if the flag is present AND no file is uploaded.
    const shouldRemoveAvatar = removeAvatar && !avatarLocalPath;
    const shouldRemoveCover = removeCover && !coverImageLocalPath;

    const userResponse = await userServices.updateAvatarAndBanner(
      userId,
      avatarLocalPath || "",
      coverImageLocalPath || "",
      shouldRemoveAvatar,
      shouldRemoveCover,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          userResponse,
          "Avatar and/or Banner updated successfully",
        ),
      );
  },
);

export const userNameAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { userName } = req.query as { userName: string };

    const isAvailable = await userServices.userNameAvailability(userName);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isAvailable },
          isAvailable ? "available" : "taken",
        ),
      );
  },
);

export const whoami = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;
    const user = await userServices.whoAmI(userId);

    const userResponse = user;
    return res
      .status(200)
      .json(new ApiResponse(200, userResponse, "User fetched successfully"));
  },
);
