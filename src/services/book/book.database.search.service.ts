/**
 * Book Database Search Service
 * Searches books in the local database with filtering and sorting capabilities
 */

import Book from "../../models/books.model";
import ApiError from "../../utils/ApiError";

interface SearchOptions {
  genre?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  skip?: number;
}

interface BookSearchResponse {
  results: any[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    page: number;
  };
}

class BookDatabaseSearchService {
  /**
   * Search books in the database with filtering and sorting
   */
  async searchBooks(options: SearchOptions): Promise<BookSearchResponse> {
    try {
      const { genre, sort, order = "desc", limit = 6, skip = 0 } = options;

      // Build query filter
      const filter: any = {};

      if (genre) {
        // Case-insensitive genre search
        filter.genres = { $elemMatch: { $regex: genre, $options: "i" } };
      }

      // Build sort object
      const sortObj: any = {};

      if (sort === "averageRating") {
        sortObj.averageRating = order === "asc" ? 1 : -1;
      } else if (sort === "releaseDate") {
        sortObj.releaseDate = order === "asc" ? 1 : -1;
      } else if (sort === "createdAt") {
        sortObj.createdAt = order === "asc" ? 1 : -1;
      } else {
        // Default sort by createdAt descending
        sortObj.createdAt = -1;
      }

      // Get total count for pagination
      const total = await Book.countDocuments(filter);

      // Fetch books with applied filters and sorting
      const books = await Book.find(filter)
        .select(
          "_id title authors coverImage averageRating genres description releaseDate",
        )
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .lean();

      // Format response to match frontend expectations
      const results = books.map((book) => ({
        _id: book._id,
        title: book.title,
        authors: book.authors || [],
        coverImage: book.coverImage,
        averageRating: book.averageRating || 0,
        genres: book.genres || [],
        description: book.description,
      }));

      return {
        results,
        pagination: {
          total,
          limit,
          skip,
          page: Math.floor(skip / limit) + 1,
        },
      };
    } catch (error) {
      console.error("Error searching books in database:", error);
      throw new ApiError(500, "Failed to search books");
    }
  }

  /**
   * Get books by genre
   */
  async getByGenre(genre: string, limit: number = 6): Promise<any[]> {
    try {
      const books = await Book.find({
        genres: { $elemMatch: { $regex: genre, $options: "i" } },
      })
        .select("_id title authors coverImage averageRating genres description")
        .limit(limit)
        .lean();

      return books.map((book) => ({
        _id: book._id,
        title: book.title,
        authors: book.authors || [],
        coverImage: book.coverImage,
        averageRating: book.averageRating || 0,
        genres: book.genres || [],
        description: book.description,
      }));
    } catch (error) {
      console.error("Error fetching books by genre:", error);
      return [];
    }
  }

  /**
   * Get top-rated books
   */
  async getTopRated(limit: number = 6): Promise<any[]> {
    try {
      const books = await Book.find({ averageRating: { $gt: 0 } })
        .select("_id title authors coverImage averageRating genres description")
        .sort({ averageRating: -1 })
        .limit(limit)
        .lean();

      return books.map((book) => ({
        _id: book._id,
        title: book.title,
        authors: book.authors || [],
        coverImage: book.coverImage,
        averageRating: book.averageRating || 0,
        genres: book.genres || [],
        description: book.description,
      }));
    } catch (error) {
      console.error("Error fetching top-rated books:", error);
      return [];
    }
  }

  /**
   * Get new releases
   */
  async getNewReleases(limit: number = 6): Promise<any[]> {
    try {
      const books = await Book.find({ releaseDate: { $exists: true } })
        .select(
          "_id title authors coverImage averageRating genres description releaseDate",
        )
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return books.map((book) => ({
        _id: book._id,
        title: book.title,
        authors: book.authors || [],
        coverImage: book.coverImage,
        averageRating: book.averageRating || 0,
        genres: book.genres || [],
        description: book.description,
      }));
    } catch (error) {
      console.error("Error fetching new releases:", error);
      return [];
    }
  }
}

export default new BookDatabaseSearchService();
