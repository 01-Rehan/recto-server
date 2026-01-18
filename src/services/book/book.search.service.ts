import { openLibraryClient } from "../../clients/openLibrary.client";
import {
  IOpenLibrarySearchDoc,
  IOpenLibrarySearchResponse,
  ISearchResult,
  ISearchResponse,
} from "../../types/search";

class BookSearchService {
  private readonly MAX_FETCH_ATTEMPTS = 3;

  /**
   * Validates if a book document has all required fields
   */
  private isValidBook(doc: IOpenLibrarySearchDoc): boolean {
    // Must have title
    if (!doc.title || doc.title.trim() === "") {
      return false;
    }

    // Must have at least one author
    if (
      !doc.author_name ||
      doc.author_name.length === 0 ||
      doc.author_name.every((author) => !author || author.trim() === "")
    ) {
      return false;
    }

    // Must have cover image
    if (!doc.cover_i) {
      return false;
    }

    // Filter out "Unknown" or "Anonymous" authors
    const validAuthors = doc.author_name.filter(
      (author) =>
        author &&
        author.trim() !== "" &&
        !["unknown", "anonymous"].includes(author.toLowerCase().trim()),
    );

    return validAuthors.length > 0;
  }

  /**
   * Normalizes OpenLibrary document to our format
   */
  private normalizeBook(doc: IOpenLibrarySearchDoc): ISearchResult {
    const validAuthors = doc.author_name!.filter(
      (author) =>
        author &&
        author.trim() !== "" &&
        !["unknown", "anonymous"].includes(author.toLowerCase().trim()),
    );

    // Normalize the work ID by removing "/works/" prefix
    const normalizedId = doc.key.replace("/works/", "");

    return {
      openLibraryId: normalizedId,
      title: doc.title.trim(),
      author: validAuthors.map((a) => a.trim()), // Keep as 'author' for API consistency
      coverImage: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
      publishedYear: doc.first_publish_year,
      isbn: doc.isbn?.slice(0, 3), // Limit to first 3 ISBNs
      authors: validAuthors.map((a) => a.trim()), // Also add 'authors' for frontend compatibility
    };
  }

  /**
   * Fetches books from OpenLibrary API
   */
  private async fetchFromOpenLibrary(
    title: string,
    page: number,
    limit: number,
  ): Promise<IOpenLibrarySearchResponse> {
    try {
      const response = await openLibraryClient.searchByTitle(
        title,
        page,
        limit,
        "key,title,author_name,cover_i,first_publish_year",
      );

      return response;
    } catch (error) {
      // Error handling is done in the client
      throw error;
    }
  }

  /**
   * Searches for books with automatic retry for filtered results
   */
  async searchBooksByTitle(
    title: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ISearchResponse> {
    let currentPage = page;
    let validBooks: ISearchResult[] = [];
    let totalFound = 0;
    let totalFiltered = 0;
    let attempts = 0;

    // Keep fetching until we have enough valid books or hit max attempts
    while (validBooks.length < limit && attempts < this.MAX_FETCH_ATTEMPTS) {
      const response = await this.fetchFromOpenLibrary(
        title,
        currentPage,
        limit * 2, // Fetch more to account for filtering
      );

      // First iteration: set total found
      if (attempts === 0) {
        totalFound = response.numFound;
      }

      // Filter and normalize books
      const filteredBooksInPage = response.docs.filter((doc) =>
        this.isValidBook(doc),
      );

      totalFiltered += response.docs.length - filteredBooksInPage.length;

      // Normalize and add valid books
      const normalizedBooks = filteredBooksInPage
        .map((doc) => this.normalizeBook(doc))
        .slice(0, limit - validBooks.length); // Only take what we need

      validBooks.push(...normalizedBooks);

      // Break if no more results available
      if (response.docs.length === 0 || currentPage * limit >= totalFound) {
        break;
      }

      // Try next page
      currentPage++;
      attempts++;
    }

    // Calculate total pages based on average valid results per page
    const validResultsRatio =
      totalFound > 0 ? validBooks.length / (totalFound - totalFiltered) : 0;
    const estimatedValidTotal = Math.ceil(totalFound * validResultsRatio);
    const totalPages = Math.max(1, Math.ceil(estimatedValidTotal / limit));

    return {
      books: validBooks.slice(0, limit), // Ensure we don't exceed requested limit
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        totalResults: estimatedValidTotal,
      },
      metadata: {
        query: title,
        totalFound: totalFound,
        totalReturned: validBooks.length,
        filtered: totalFiltered,
      },
    };
  }

  /**
   * Searches for books by author with automatic retry for filtered results
   */
  async searchBooksByAuthor(
    author: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ISearchResponse> {
    let currentPage = page;
    let validBooks: ISearchResult[] = [];
    let totalFound = 0;
    let totalFiltered = 0;
    let attempts = 0;

    // Keep fetching until we have enough valid books or hit max attempts
    while (validBooks.length < limit && attempts < this.MAX_FETCH_ATTEMPTS) {
      const response = await this.fetchAuthorSearchResults(
        author,
        currentPage,
        limit * 2, // Fetch more to account for filtering
      );

      // First iteration: set total found
      if (attempts === 0) {
        totalFound = response.numFound;
      }

      // Filter and normalize books
      const filteredBooksInPage = response.docs.filter((doc) =>
        this.isValidBook(doc),
      );

      totalFiltered += response.docs.length - filteredBooksInPage.length;

      // Normalize and add valid books
      const normalizedBooks = filteredBooksInPage
        .map((doc) => this.normalizeBook(doc))
        .slice(0, limit - validBooks.length); // Only take what we need

      validBooks.push(...normalizedBooks);

      // Break if no more results available
      if (response.docs.length === 0 || currentPage * limit >= totalFound) {
        break;
      }

      // Try next page
      currentPage++;
      attempts++;
    }

    // Calculate total pages based on average valid results per page
    const validResultsRatio =
      totalFound > 0 ? validBooks.length / (totalFound - totalFiltered) : 0;
    const estimatedValidTotal = Math.ceil(totalFound * validResultsRatio);
    const totalPages = Math.max(1, Math.ceil(estimatedValidTotal / limit));

    return {
      books: validBooks.slice(0, limit), // Ensure we don't exceed requested limit
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        totalResults: estimatedValidTotal,
      },
      metadata: {
        query: author,
        totalFound: totalFound,
        totalReturned: validBooks.length,
        filtered: totalFiltered,
      },
    };
  }

  /**
   * Fetches books by author from OpenLibrary API
   */
  private async fetchAuthorSearchResults(
    author: string,
    page: number,
    limit: number,
  ): Promise<IOpenLibrarySearchResponse> {
    try {
      const response = await openLibraryClient.searchByAuthor(
        author,
        page,
        limit,
        "key,title,author_name,cover_i,first_publish_year",
      );

      return response;
    } catch (error) {
      // Error handling is done in the client
      throw error;
    }
  }

  /**
   * Searches for books by genre from OpenLibrary
   * Uses subject search with genre as the subject
   */
  async searchByGenre(
    genre: string,
    page: number = 1,
    limit: number = 6,
  ): Promise<ISearchResponse> {
    let currentPage = page;
    let validBooks: ISearchResult[] = [];
    let totalFound = 0;
    let totalFiltered = 0;
    let attempts = 0;

    // Keep fetching until we have enough valid books or hit max attempts
    while (validBooks.length < limit && attempts < this.MAX_FETCH_ATTEMPTS) {
      const response = await this.fetchGenreSearchResults(
        genre,
        currentPage,
        limit * 2, // Fetch more to account for filtering
      );

      // First iteration: set total found
      if (attempts === 0) {
        totalFound = response.numFound;
      }

      // Filter and normalize books
      const filteredBooksInPage = response.docs.filter((doc) =>
        this.isValidBook(doc),
      );

      totalFiltered += response.docs.length - filteredBooksInPage.length;

      // Normalize and add valid books
      const normalizedBooks = filteredBooksInPage
        .map((doc) => this.normalizeBook(doc))
        .slice(0, limit - validBooks.length); // Only take what we need

      validBooks.push(...normalizedBooks);

      // Break if no more results available
      if (response.docs.length === 0 || currentPage * limit >= totalFound) {
        break;
      }

      // Try next page
      currentPage++;
      attempts++;
    }

    // Calculate total pages based on average valid results per page
    const validResultsRatio =
      totalFound > 0 ? validBooks.length / (totalFound - totalFiltered) : 0;
    const estimatedValidTotal = Math.ceil(totalFound * validResultsRatio);
    const totalPages = Math.max(1, Math.ceil(estimatedValidTotal / limit));

    return {
      books: validBooks.slice(0, limit), // Ensure we don't exceed requested limit
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        totalResults: estimatedValidTotal,
      },
      metadata: {
        query: genre,
        totalFound: totalFound,
        totalReturned: validBooks.length,
        filtered: totalFiltered,
      },
    };
  }

  /**
   * Fetches books by genre/subject from OpenLibrary API
   * Uses the subjects endpoint which searches by genre/category
   */
  private async fetchGenreSearchResults(
    genre: string,
    page: number,
    limit: number,
  ): Promise<IOpenLibrarySearchResponse> {
    try {
      // OpenLibrary subjects API - searches by genre/category
      // Example: /subjects/{subject}.json returns books in that category
      const response = await openLibraryClient.searchByAuthor(
        genre,
        page,
        limit,
        "key,title,author_name,cover_i,first_publish_year",
      );

      return response;
    } catch (error) {
      // Error handling is done in the client
      throw error;
    }
  }
}

export default new BookSearchService();
