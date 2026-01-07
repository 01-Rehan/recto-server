import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { connectionServices } from "../services/connection.service";

export const followUser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userIdToFollow = req.params.userId as string;
    const currentUserId = req.user?._id as string;

    const result = await connectionServices.followUser(
      currentUserId,
      userIdToFollow,
    );

    if (!result) throw new ApiError(500, "Error while following user");

    return res
      .status(200)
      .json(new ApiResponse(200, result, "User followed successfully"));
  },
);

export const unfollowUser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userIdToUnfollow = req.params.userId as string;
    const currentUserId = req.user?._id as string;

    const result = await connectionServices.unfollowUser(
      currentUserId,
      userIdToUnfollow,
    );

    if (!result) throw new ApiError(404, "Follow relationship not found");

    return res
      .status(200)
      .json(new ApiResponse(200, result, "User unfollowed successfully"));
  },
);

export const fetchFollowers = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.query as { userId: string };

    const followers = await connectionServices.fetchFollowers(userId);
    if (!followers) throw new ApiError(500, "Error while fetching followers");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          followers,
          followers.length > 0
            ? "Followers fetched successfully"
            : "User has no followers",
        ),
      );
  },
);

export const fetchFollowing = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.query as { userId: string };

    const following = await connectionServices.fetchFollowings(userId);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          following,
          following.length > 0
            ? "Following fetched successfully"
            : "User is not following anyone",
        ),
      );
  },
);

export const myFollowers = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const currentUserId = req.user?._id as string;

    const followers = await connectionServices.fetchFollowers(currentUserId);
    if (!followers) throw new ApiError(500, "Error while fetching followers");

    return res
      .status(200)
      .json(new ApiResponse(200, followers, "Followers fetched successfully"));
  },
);

export const myFollowing = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const currentUserId = req.user?._id as string;

    const following = await connectionServices.fetchFollowings(currentUserId);
    if (!following) throw new ApiError(500, "Error while fetching following");

    return res
      .status(200)
      .json(new ApiResponse(200, following, "Following fetched successfully"));
  },
);
