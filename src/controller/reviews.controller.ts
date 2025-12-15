import { reviewServices } from "../services/reviews.service";
import { CustomRequest } from "../types/customRequest";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Response } from "express";

export const addReview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { bookId, content, rating } = req.body;

    if (!userId || !bookId || rating === undefined)
      throw new ApiError(400, "userId, bookId, and rating are required");

    const Review = await reviewServices.createReview(
      userId,
      bookId,
      content,
      rating,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, Review, "Review added successfully"));
  },
);

export const removeReview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { reviewId } = req.params;
    const userRole = req.user?.role as string;

    if (!userId || !reviewId)
      throw new ApiError(400, "userId and reviewId are required");

    const Review = await reviewServices.removeReview(
      userId,
      reviewId,
      userRole,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, Review, "Review removed successfully"));
  },
);

export const updateReview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { reviewId } = req.params;
    const { content, rating } = req.body;

    if (!userId || !reviewId)
      throw new ApiError(400, "User ID and Review ID are required");

    const Review = await reviewServices.updateReview(
      userId,
      reviewId,
      content,
      rating,
    );
    return res
      .status(200)
      .json(new ApiResponse(200, Review, "Review updated successfully"));
  },
);
