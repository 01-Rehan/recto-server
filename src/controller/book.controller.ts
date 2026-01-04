import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { bookServices } from "../services/book/book.service";

/**
 * Get Book Controller (OPTIMIZED)
 * 
 * IMPROVEMENTS:
 * 1. Fast validation
 * 2. Cache headers for client-side caching
 * 3. Minimal response transformation
 * 4. Early error returns
 * 
 * TARGET: <100ms for cached hits
 */
export const getBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const { externalId, title, authors, ...rest } = req.body;

    // Fast validation
    if (!externalId) {
      throw new ApiError(400, "externalId is required");
    }

    // Fetch book (uses optimized query service)
    const book = await bookServices.getBook(externalId, title, authors, rest);

    // Set cache headers for client-side caching
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 min cache

    return res
      .status(200)
      .json(new ApiResponse(200, book, "Book fetched successfully"));
  },
);

export const tbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;
    const { bookId, status, startedAt, finishedAt } = req.body;

    const addedBook = await bookServices.tbrBook(
      userId,
      bookId,
      status,
      startedAt as Date,
      finishedAt as Date,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, addedBook, "Book added to TBR successfully"));
  },
);

export const removeTbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;
    const { tbrId } = req.params as { tbrId: string };

    const deletedData = await bookServices.tbrRemoveBook(userId, tbrId);

    if (!deletedData) throw new ApiError(404, "Book not found in TBR");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Book removed from TBR successfully"));
  },
);

export const fetchBooksBasedOnStatus = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;
    const { status } = req.query as { status: string };

    const userBooks = await bookServices.fetchBooksBasedOnStatus(
      userId,
      status,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, userBooks, "Books fetched successfully"));
  },
);
