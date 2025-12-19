import ApiError from "../../utils/ApiError";
import User from "../../models/user.model";
import { IUser, IUserMethods } from "../../types/user";
import jwt from "jsonwebtoken";


class JwtServices {
  generateAccessAndRefreshTokens = async (userId: string) => {
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

  refreshAccessToken = async (incomingRefreshToken: string) => {
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
    
          const tokenPair = await jwtServices.generateAccessAndRefreshTokens(
            userId,
          );

          return {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
        };
        } catch (error) {
          throw new ApiError(
            400,
            (error as Error)?.message || "error while refreshing access token",
          );
        }
  }
}

export const jwtServices = new JwtServices();
