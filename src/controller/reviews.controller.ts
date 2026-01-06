import { reviewServices } from "../services/reviews.service";
import { ValidatedRequest } from "../types/typedRequest";
import ApiResponse from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Response } from "express";
import bookReviewSchema from "../validation/bookReview.schema";

export const getAllReviewsForBook = asyncHandler(
  async (
    req: ValidatedRequest<typeof bookReviewSchema.getAllReviewsForBook>,
    res: Response
  ) => {
    const userId = req.user?._id || null;
    const { bookId } = req.params;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewServices.getAllReviewsForBook(
      bookId,
      userId,
      page,
      limit,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Reviews fetched successfully"));
  },
);

export const addReview = asyncHandler(
  async (
    req: ValidatedRequest<typeof bookReviewSchema.addReview>,
    res: Response
  ) => {
    const userId = req.user!._id;
    const { bookId, content, rating } = req.body;

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
  async (
    req: ValidatedRequest<typeof bookReviewSchema.removeReview>,
    res: Response
  ) => {
    const userId = req.user!._id;
    const { reviewId } = req.params;
    const userRole = req.user!.role;

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
  async (
    req: ValidatedRequest<typeof bookReviewSchema.updateReview>,
    res: Response
  ) => {
    const userId = req.user!._id;
    const { reviewId } = req.params;
    const { content, rating } = req.body;

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
