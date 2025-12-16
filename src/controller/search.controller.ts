import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import { searchServices } from "../services/search.service";

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { userName } = req.query as { userName: string };
  const users = await searchServices.searchUsers(userName);
  if (!users.length)
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No users found matching the query."));
  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully."));
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { userName } = req.query as { userName: string };
  const user = await searchServices.getUser(userName);
  if (!user)
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No user found matching the query."));

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully."));
});
