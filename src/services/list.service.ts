import BookList from "../models/bookLists.model";
import Book from "../models/books.model";
import { IBookListItem } from "../types/bookLists";
import ApiError from "../utils/ApiError";
import mongoose from "mongoose";

class ListService {
  // Create a new list
  async createList(
    userId: string,
    name: string,
    description?: string,
    isPublic?: boolean,
  ) {
    const newList = await BookList.create({
      user_id: userId,
      name,
      description,
      is_public: isPublic || false,
      items: [],
      book_count: 0,
    });

    return newList;
  }

  // Get all lists for a user
  async getUserLists(userId: string) {
    const lists = await BookList.find({ user_id: userId }).sort({
      createdAt: -1,
    });
    return lists;
  }

  // Get a single list by ID
  async getListById(listId: string, userId?: string) {
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    const list = await BookList.findById(listId);

    if (!list) {
      throw new ApiError(404, "List not found");
    }

    // If the list is private, only the owner can view it
    if (!list.is_public && userId && list.user_id.toString() !== userId) {
      throw new ApiError(403, "You do not have permission to view this list");
    }

    return list;
  }

  // Update a list
  async updateList(
    listId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      is_public?: boolean;
    },
  ) {
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    const list = await BookList.findById(listId);

    if (!list) {
      throw new ApiError(404, "List not found");
    }

    // Only the owner can update the list
    if (list.user_id.toString() !== userId) {
      throw new ApiError(403, "You can only update your own lists");
    }

    if (updates.name !== undefined) list.name = updates.name;
    if (updates.description !== undefined)
      list.description = updates.description;
    if (updates.is_public !== undefined) list.is_public = updates.is_public;

    await list.save();

    return list;
  }

  // Delete a list
  async deleteList(listId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    const list = await BookList.findById(listId);

    if (!list) {
      throw new ApiError(404, "List not found");
    }

    // Only the owner can delete the list
    if (list.user_id.toString() !== userId) {
      throw new ApiError(403, "You can only delete your own lists");
    }

    await BookList.findByIdAndDelete(listId);

    return { message: "List deleted successfully" };
  }

  // Add a book to a list
  async addBookToList(
    listId: string,
    userId: string,
    bookData: {
      book_id: string;
    },
  ) {
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    if (!mongoose.Types.ObjectId.isValid(bookData.book_id)) {
      throw new ApiError(400, "Invalid book ID");
    }

    const list = await BookList.findById(listId);

    if (!list) {
      throw new ApiError(404, "List not found");
    }

    // Only the owner can add books to the list
    if (list.user_id.toString() !== userId) {
      throw new ApiError(403, "You can only add books to your own lists");
    }

    // Check if the book is already in the list
    const bookExists = list.items.some(
      (item) => item.book_id.toString() === bookData.book_id,
    );

    if (bookExists) {
      throw new ApiError(400, "Book is already in the list");
    }

    // Fetch book details dynamically
    const book = await Book.findById(bookData.book_id).lean();

    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    const newPosition = list.items.length + 1;

    const newItem: IBookListItem = {
      book_id: new mongoose.Types.ObjectId(bookData.book_id),
      title: book.title,
      author:
        Array.isArray(book.authors) && book.authors.length > 0
          ? (book.authors[0] as string)
          : "Unknown author",
      added_at: new Date(),
      position: newPosition,
    };

    list.items.push(newItem);
    await list.save();

    return list;
  }

  // Remove a book from a list
  async removeBookFromList(listId: string, bookId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      throw new ApiError(400, "Invalid book ID");
    }

    const list = await BookList.findById(listId);

    if (!list) {
      throw new ApiError(404, "List not found");
    }

    // Only the owner can remove books from the list
    if (list.user_id.toString() !== userId) {
      throw new ApiError(403, "You can only remove books from your own lists");
    }

    // Remove the book from the list
    const initialLength = list.items.length;
    list.items = list.items.filter(
      (item) => item.book_id.toString() !== bookId,
    );

    if (list.items.length === initialLength) {
      throw new ApiError(404, "Book not found in the list");
    }

    // Reorder positions after removal
    list.items.forEach((item, index) => {
      item.position = index + 1;
    });

    await list.save();

    return list;
  }

  // Reorder books in a list
  async reorderBooks(listId: string, userId: string, bookIds: string[]) {
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ApiError(400, "Invalid list ID");
    }

    const list = await BookList.findById(listId);

    if (!list) {
      throw new ApiError(404, "List not found");
    }

    // Only the owner can reorder books
    if (list.user_id.toString() !== userId) {
      throw new ApiError(403, "You can only reorder books in your own lists");
    }

    // Validate that all bookIds are in the list
    if (bookIds.length !== list.items.length) {
      throw new ApiError(
        400,
        "All books in the list must be included in the reorder",
      );
    }

    // Create a map of book_id to item for quick lookup
    const itemMap = new Map();
    list.items.forEach((item) => {
      itemMap.set(item.book_id.toString(), item);
    });

    // Reorder the items based on the new order
    const reorderedItems: IBookListItem[] = [];
    for (let i = 0; i < bookIds.length; i++) {
      const item = itemMap.get(bookIds[i]);
      if (!item) {
        throw new ApiError(400, `Book with ID ${bookIds[i]} not found in list`);
      }
      item.position = i + 1;
      reorderedItems.push(item);
    }

    list.items = reorderedItems;
    await list.save();

    return list;
  }

  // Get public lists (for discovery)
  async getPublicLists(limit: number = 20, skip: number = 0) {
    const lists = await BookList.find({ is_public: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("user_id", "userName fullName avatarImage");

    return lists;
  }
}

export const listService = new ListService();
