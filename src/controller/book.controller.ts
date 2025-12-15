import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import Book from "../models/books.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { UserBookModel } from "../models/addedBook.model";
import { CustomRequest } from "../types/customRequest";
import mongoose from "mongoose";
import { ReviewModel } from "../models/bookReview.model";
// import { ReviewLikeModel } from "../models/reviewLike.model";
import { bookServices } from "../services/book.service";


export const getBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const { externalId, ...rest } = req.body;
    const title = req.body.title as string;
    const authors = Array.isArray(rest.authors)
      ? rest.authors[0]
      : rest.authors || "";

    if (!externalId) {
      throw new ApiError(400, "externalId is required");
    }

    const book = await bookServices.getBook(externalId,title,authors,rest);

    return res
      .status(200)
      .json(new ApiResponse(200, book, "Book fetched successfully"));
  },
);

export const tbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { bookId, status, startedAt, finishedAt } = req.body;

    if (!userId || !bookId || !status) {
      throw new ApiError(400, "userId, bookId and status are required");
    }

    const updates: any = { status };

    if (startedAt) updates.startedAt = startedAt ? new Date(startedAt) : null;

    if (status === "finished" && finishedAt) {
      updates.finishedAt = finishedAt ? new Date(finishedAt) : null;
    } else if (status !== "finished") {
      updates.finishedAt = null;
    }

    const addedBook = await UserBookModel.findOneAndUpdate(
      { userId, bookId },
      {
        $set: updates,
        $setOnInsert: { userId, bookId },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, addedBook, "Book added to TBR successfully"));
  },
);

export const removeTbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { _id } = req.body;

    if (!userId || !_id) {
      throw new ApiError(400, "userId and bookId are required");
    }

    const deltedData = await UserBookModel.findOneAndDelete({ _id, userId });
    if (!deltedData) {
      throw new ApiError(404, "Book not found in TBR");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Book removed from TBR successfully"));
  },
);

export const fetchReadingStatus = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { status } = req.query;

    if (!userId || !status) {
      throw new ApiError(400, "userId or status is required");
    }

    const userBooks = await UserBookModel.find({
      userId,
      status: status,
    }).populate("bookId", "title authors coverImage externalId ");
    if (!userBooks || userBooks.length === 0) {
      throw new ApiError(404, "No books found for the given status");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, userBooks, "Books fetched successfully"));
  },
);

export const addReview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { bookId, content, rating } = req.body;

    if (!userId || !bookId || rating === undefined) {
      throw new ApiError(400, "userId, bookId, and rating are required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newReview = await ReviewModel.create(
        [
          {
            userId,
            bookId,
            content,
            rating,
          },
        ],
        { session: session },
      );

      const book = await Book.findById(bookId).session(session);
      if (!book) {
        throw new ApiError(404, "Book not found");
      }

      const totalRating = (book.averageRating || 0) * (book.ratingsCount || 0);
      const newCount = (book.ratingsCount || 0) + 1;
      const newAverage = (totalRating + rating) / newCount;

      await Book.updateOne(
        { _id: book._id },
        {
          $set: {
            averageRating: newAverage.toFixed(1),
            ratingsCount: newCount,
          },
        },
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json(new ApiResponse(200, newReview[0], "Review added successfully"));
    } catch (error: Error | any) {
      await session.abortTransaction();
      session.endSession();

      if (error.code === 11000) {
        throw new ApiError(400, "User has already reviewed this book");
      }

      throw new ApiError(500, "Internal Server Error");
    }
  },
);

export const removeReview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { reviewId } = req.params;
    const userRole = req.user?.role;

    if (!userId || !reviewId) {
      throw new ApiError(400, "userId and reviewId are required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const review = await ReviewModel.findById(reviewId).session(session);
      if (!review) {
        throw new ApiError(404, "Review not found");
      }

      const isOwner = review.userId.toString() === userId.toString();
      const isAdmin = userRole === "admin" || userRole === "librarian"; // Adjust roles as needed

      if (!isOwner && !isAdmin) {
        throw new ApiError(403, "You are not authorized to delete this review");
      }

      await ReviewModel.findByIdAndDelete(reviewId).session(session);

      const book = await Book.findById(review.bookId).session(session);

      if (book) {
        const totalRating =
          (book.averageRating || 0) * (book.ratingsCount || 0);
        const newCount = (book.ratingsCount || 1) - 1;

        let newAverage = 0;
        if (newCount > 0) {
          // Subtract the specific rating of the review we just deleted
          newAverage = (totalRating - review.rating) / newCount;
        }

        await Book.updateOne(
          { _id: book._id },
          {
            $set: {
              // Parse float to ensure it saves as a Number, not a String
              averageRating: parseFloat(newAverage.toFixed(1)),
              ratingsCount: newCount,
            },
          },
          { session },
        );
      }

      await session.commitTransaction();

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Review removed successfully"));
    } catch (error) {
      await session.abortTransaction();
      throw error; // Re-throw the original error to be handled by asyncHandler
    } finally {
      session.endSession();
    }
  },
);

export const updateReview = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { reviewId } = req.params;
    const { content, rating } = req.body; // User might update content, rating, or both

    if (!userId || !reviewId) {
      throw new ApiError(400, "User ID and Review ID are required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the Review (Must belong to the user)
      const review = await ReviewModel.findOne({
        _id: reviewId,
        userId,
      }).session(session);

      if (!review) {
        throw new ApiError(404, "Review not found or you are not the owner");
      }

      // 2. Capture the old rating before we change it
      const oldRating = review.rating;
      const isRatingChanged = rating !== undefined && rating !== oldRating;

      // 3. Update the Review Document
      if (content) review.content = content;
      if (rating !== undefined) review.rating = rating;

      await review.save({ session });

      // 4. Update Book Stats (ONLY if rating changed)
      if (isRatingChanged) {
        const book = await Book.findById(review.bookId).session(session);

        if (book) {
          // Math: Remove the old rating weight, add the new rating weight
          const currentTotal =
            (book.averageRating || 0) * (book.ratingsCount || 0);
          // Be careful: ratingsCount does NOT change, only the average does
          const adjustedTotal = currentTotal - oldRating + rating;

          // Avoid division by zero (shouldn't happen if book exists, but safety first)
          const count = book.ratingsCount || 1;
          const newAverage = adjustedTotal / count;

          await Book.updateOne(
            { _id: book._id },
            {
              $set: { averageRating: parseFloat(newAverage.toFixed(1)) },
            },
            { session },
          );
        }
      }

      await session.commitTransaction();

      return res
        .status(200)
        .json(new ApiResponse(200, review, "Review updated successfully"));
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
);
