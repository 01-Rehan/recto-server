import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { bookServices } from "../services/book.service";

export const getBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const { externalId, ...rest } = req.body;
    const { title, authors } = req.body;

    const book = await bookServices.getBook(externalId, title, authors, rest);

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
