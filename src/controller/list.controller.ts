import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { ValidatedRequest } from "../types/typedRequest";
import listValidationSchema from "../validation/list.schema";
import { listService } from "../services/list.service";

// Create a new list
export const createListController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.createList> &
      CustomRequest,
    res: Response,
  ) => {
    const userId = req.user!._id;
    const { name, description, is_public } = req.body;

    const list = await listService.createList(
      userId,
      name,
      description,
      is_public,
    );

    return res
      .status(201)
      .json(new ApiResponse(201, list, "List created successfully"));
  },
);

// Get all lists for the authenticated user
export const getUserListsController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user!._id;

    const lists = await listService.getUserLists(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, lists, "Lists fetched successfully"));
  },
);

// Get a single list by ID
export const getListController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.getList> & CustomRequest,
    res: Response,
  ) => {
    const { listId } = req.params;
    const userId = req.user?._id;

    const list = await listService.getListById(listId, userId);

    return res
      .status(200)
      .json(new ApiResponse(200, list, "List fetched successfully"));
  },
);

// Update a list
export const updateListController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.updateList> &
      CustomRequest,
    res: Response,
  ) => {
    const userId = req.user!._id;
    const { listId } = req.params;
    const updates = req.body;

    const list = await listService.updateList(listId, userId, updates);

    return res
      .status(200)
      .json(new ApiResponse(200, list, "List updated successfully"));
  },
);

// Delete a list
export const deleteListController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.deleteList> &
      CustomRequest,
    res: Response,
  ) => {
    const userId = req.user!._id;
    const { listId } = req.params;

    const result = await listService.deleteList(listId, userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "List deleted successfully"));
  },
);

// Add a book to a list
export const addBookToListController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.addBookToList> &
      CustomRequest,
    res: Response,
  ) => {
    const userId = req.user!._id;
    const { listId } = req.params;
    const bookData = req.body;

    const list = await listService.addBookToList(listId, userId, bookData);

    return res
      .status(200)
      .json(new ApiResponse(200, list, "Book added to list successfully"));
  },
);

// Remove a book from a list
export const removeBookFromListController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.removeBookFromList> &
      CustomRequest,
    res: Response,
  ) => {
    const userId = req.user!._id;
    const { listId, bookId } = req.params;

    const list = await listService.removeBookFromList(listId, bookId, userId);

    return res
      .status(200)
      .json(new ApiResponse(200, list, "Book removed from list successfully"));
  },
);

// Reorder books in a list
export const reorderBooksController = asyncHandler(
  async (
    req: ValidatedRequest<typeof listValidationSchema.reorderBooks> &
      CustomRequest,
    res: Response,
  ) => {
    const userId = req.user!._id;
    const { listId } = req.params;
    const { bookIds } = req.body;

    const list = await listService.reorderBooks(listId, userId, bookIds);

    return res
      .status(200)
      .json(new ApiResponse(200, list, "Books reordered successfully"));
  },
);

// Get public lists (for discovery)
export const getPublicListsController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const lists = await listService.getPublicLists(limit, skip);

    return res
      .status(200)
      .json(new ApiResponse(200, lists, "Public lists fetched successfully"));
  },
);
