import { asyncHandler } from "../utils/asyncHandler";
import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import { CustomRequest } from "../types/customRequest";

interface CustomJWTPayload extends JwtPayload {
  _id: string;
  role: string;
  isVerified: boolean;
}

export const VerifyJWT = asyncHandler(
  async (req: CustomRequest, _res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token)
        throw new ApiError(401, "Unauthorized: Access token is missing");

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as CustomJWTPayload;

      req.user = {
        _id: decodedToken._id,
        role: decodedToken.role,
        isVerified: decodedToken.isVerified,
      };

      next();
    } catch (error: any) {
      // If the token is expired, we typically return 401
      if (error.name === "TokenExpiredError") {
        throw new ApiError(401, "Token has expired");
      }
      // If the token is tampered with or malformed
      if (error.name === "JsonWebTokenError") {
        throw new ApiError(401, "Invalid token");
      }

      throw new ApiError(
        500,
        error?.message || "Internal server error during auth",
      );
    }
  },
);

export const VerifyRole = (allowedRoles: string[]) => {
  return (req: CustomRequest, _res: Response, next: NextFunction) => {
    // 1. Check if user exists (VerifyJWT should have handled this, but safety first)
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    // 2. Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    }
    next();
  };
};
