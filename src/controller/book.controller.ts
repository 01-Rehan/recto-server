import { asyncHandler } from "../utils/asyncHandler";
import { Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { ValidatedRequest } from "../types/typedRequest";
import { bookServices } from "../services/book/book.service";
import { affiliateService } from "../services/book/affiliate.service";
import Book from "../models/books.model";
import BookValidationSchema from "../validation/book.schema";


export const getBookController = asyncHandler(
  async (
    req: ValidatedRequest<typeof BookValidationSchema.createBook>,
    res: Response
  ) => {
    const { externalId, title, authors } = req.body;

    const book = await bookServices.getBook(externalId, title, authors);

    return res
      .status(200)
      .json(new ApiResponse(200, book, "Book fetched successfully"));
  },
);

export const tbrBookController = asyncHandler(
  async (
    req: ValidatedRequest<typeof BookValidationSchema.tbrBook> & CustomRequest,
    res: Response
  ) => {
    const userId = req.user!._id;
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
  async (
    req: ValidatedRequest<typeof BookValidationSchema.tbrRemoveBook> & CustomRequest,
    res: Response
  ) => {
    const userId = req.user!._id;
    const { tbrId } = req.params;

    const deletedData = await bookServices.tbrRemoveBook(userId, tbrId);

    if (!deletedData) throw new ApiError(404, "Book not found in TBR");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Book removed from TBR successfully"));
  },
);

export const fetchBooksBasedOnStatus = asyncHandler(
  async (
    req: ValidatedRequest<typeof BookValidationSchema.fetchBooksBasedOnStatus> & CustomRequest,
    res: Response
  ) => {
    const userId = req.user!._id;
    const { status } = req.query;

    const userBooks = await bookServices.fetchBooksBasedOnStatus(
      userId,
      status,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, userBooks, "Books fetched successfully"));
  },
);

export const getPurchaseLinksController = asyncHandler(
  async (
    req: ValidatedRequest<typeof BookValidationSchema.getPurchaseLinks>,
    res: Response
  ) => {
    const { bookId } = req.params;

    // Fetch book from database
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    // // Generate purchase links for all platforms
    // const purchaseLinks = affiliateService.generatePurchaseLinks(book);
    
    // Optionally group by category
    const grouped = affiliateService.groupPurchaseLinksByCategory(book);

    return res
      .status(200)
      .set("Cache-Control", "public, max-age=3600") // Cache for 1 hour
      .json(
        new ApiResponse(
          200,
          { allLinks: grouped },
          "Purchase links fetched successfully",
        ),
      );
  },
);

