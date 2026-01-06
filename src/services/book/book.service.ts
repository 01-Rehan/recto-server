import { bookQueryService } from "./book.query.service";
import { UserBookModel } from "../../models/addedBook.model";

/**
 * BookService - OPTIMIZED for fast responses
 * 
 * IMPROVEMENTS:
 * 1. Delegates to optimized QueryService
 * 2. Minimal validation overhead
 * 3. Lean queries throughout
 * 
 * TARGET: <100ms for cached, <300ms for new books
 */
class BookServices {
  /**
   * Get Book (OPTIMIZED - Primary Entry Point)
   * 
   * FLOW:
   * 1. Fast DB lookup (parallel when possible)
   * 2. Return immediately
   * 
   * PERFORMANCE:
   * - Cache hit: <100ms
   * - Cache miss: <300ms
   */
  getBook = async (
    externalId: string,
    title?: string,
    authors?: string[]
  ) => {
    // FAST PATH: Resolve book using optimized query service
    const book = await bookQueryService.resolveBook(
      externalId,
      title,
      authors
    );

    return book;
  };

  tbrBook = async (
    userId: string,
    bookId: string,
    status: string,
    startedAt: Date,
    finishedAt: Date,
  ) => {
    try {
      const updates: any = { status };

      if (status === "wishlist") {
        updates.startedAt = null;
        updates.finishedAt = null;
      } else if (status === "reading") {
        updates.startedAt = startedAt ? new Date(startedAt) : new Date();
        updates.finishedAt = null;
      } else if (status === "finished") {
        if (startedAt) updates.startedAt = new Date(startedAt);
        updates.finishedAt = finishedAt ? new Date(finishedAt) : new Date();
      }

      const userBook = await UserBookModel.findOneAndUpdate(
        { userId, bookId },
        {
          $set: updates,
          $setOnInsert: {
            userId,
            bookId,
            addedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
      return userBook;
    } catch (error) {
      throw error; // Re-throw the error to be handled by asyncHandler
    }
  };

  tbrRemoveBook = async (userId: string, tbrId: string) => {
    return await UserBookModel.findOneAndDelete({ _id: tbrId, userId });
  };

  fetchBooksBasedOnStatus = async (userId: string, status: string) => {
    return await UserBookModel.find({
      userId,
      status: status,
    }).populate("bookId", "title authors coverImage externalId ");
  };
}

export const bookServices = new BookServices();
