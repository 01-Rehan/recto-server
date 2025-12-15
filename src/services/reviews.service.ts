import ApiError from "../utils/ApiError";
import Book from "../models/books.model";
import { ReviewModel } from "../models/bookReview.model";
import mongoose from "mongoose";

class ReviewServices {
  createReview = async (
    userId: string,
    bookId: string,
    content: string,
    rating: number,
  ) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newReview = await ReviewModel.create(
        [{ userId, bookId, content, rating }],
        { session: session },
      );

      const book = await Book.findById(bookId).session(session);
      if (!book) throw new ApiError(404, "Book not found");

      const totalRating = (book.averageRating || 0) * (book.ratingsCount || 0);
      const newCount = (book.ratingsCount || 0) + 1;
      const newAverage = (totalRating + rating) / newCount;

      await Book.updateOne(
        { _id: book._id },
        {
          $set: {
            averageRating: parseFloat(newAverage.toFixed(1)),
            ratingsCount: newCount,
          },
        },
        { session },
      );
      await session.commitTransaction();
      session.endSession();

      return newReview[0];
    } catch (error: Error | any) {
      await session.abortTransaction();
      if (error.code === 11000)
        throw new ApiError(409, "You have already reviewed this book");
      throw error;
    } finally {
      session.endSession();
    }
  };

  removeReview = async (userId: string, reviewId: string, userRole: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const review = await ReviewModel.findById(reviewId).session(session);
      if (!review) throw new ApiError(404, "Review not found");

      const isOwner = review.userId.toString() === userId.toString();
      const isAdmin = userRole === "admin" || userRole === "librarian"; // Adjust roles as needed

      if (!isOwner && !isAdmin)
        throw new ApiError(403, "You are not authorized to delete this review");

      await ReviewModel.findByIdAndDelete(reviewId).session(session);

      const book = await Book.findById(review.bookId).session(session);

      if (book) {
        const totalRating =
          (book.averageRating || 0) * (book.ratingsCount || 0);
        const newCount = (book.ratingsCount || 1) - 1;

        let newAverage = 0;
        if (newCount > 0) newAverage = (totalRating - review.rating) / newCount;

        await Book.updateOne(
          { _id: book._id },
          {
            $set: {
              averageRating: parseFloat(newAverage.toFixed(1)),
              ratingsCount: newCount,
            },
          },
          { session },
        );
      }
      await session.commitTransaction();
      return null;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  updateReview = async (
    userId: string,
    reviewId: string,
    content: string,
    rating: number,
  ) => {
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

      return review;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };
}

export const reviewServices = new ReviewServices();
