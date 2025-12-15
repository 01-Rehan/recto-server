import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { bookServices } from "../services/book.service";

export const getBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const { externalId, ...rest } = req.body;
    const title = req.body.title as string;
    const authors = Array.isArray(rest.authors)
      ? rest.authors[0]
      : rest.authors || "";

    if (!externalId) throw new ApiError(400, "externalId is required");

    const book = await bookServices.getBook(externalId, title, authors, rest);

    return res
      .status(200)
      .json(new ApiResponse(200, book, "Book fetched successfully"));
  },
);

export const tbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { bookId, status, startedAt, finishedAt } = req.body;

    if (!userId || !bookId || !status)
      throw new ApiError(400, "userId, bookId and status are required");

    const addedBook = await bookServices.tbrBook(
      userId,
      bookId,
      status,
      startedAt,
      finishedAt,
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

    if (!userId || !_id)
      throw new ApiError(400, "userId and bookId are required");

    const deltedData = await bookServices.tbrRemoveBook(userId, _id);

    if (!deltedData) throw new ApiError(404, "Book not found in TBR");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Book removed from TBR successfully"));
  },
);

export const fetchBooksBasedOnStatus = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { status } = req.query;

    if (!userId || !status)
      throw new ApiError(400, "userId or status is required");

    const userBooks = await bookServices.fetchBooksBasedOnStatus(
      userId,
      status as string,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, userBooks, "Books fetched successfully"));
  },
);
