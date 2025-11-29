import { asyncHandler } from "../utils/asyncHandler";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import ApiError from "../utils/ApiError";

interface CustomRequest extends Request {
  user?: any; // Define the 'user' property
}

export const VerifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token =
          req.cookies?.accessToken ||
          req.header("Authorization")?.replace("Bearer ", "");
        if (!token) throw new ApiError(401, "Unauthorized: Access token is missing");
    
        const decodedToken = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET!,
        ) as JwtPayload;
        const user = await User.findById(decodedToken?._id);
        if (!user) throw new ApiError(401,"Invalid Access Token");
    
        (req as CustomRequest).user = user;
        next();
    } catch (error) {
        const errorMessage =
        error instanceof jwt.JsonWebTokenError
          ? "Invalid or expired access token."
          : "Error during authorization process.";

      // Use the 'error' object from the catch block to log/debug the issue
      // console.error("JWT Verification Error:", error);

      throw new ApiError(401, errorMessage);
    }
  },
);
